import express from "express";
import crypto from "crypto";
import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";
import { uploadToCloudinary } from "../utils/upload.js";
import { sendEmail } from "../utils/email.js";

const router = express.Router();

// Helper to hash password matching the signup hashing logic
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// 1. Authenticate user session (login)
router.post("/login", async (req, res) => {
  try {
    const { nic, password } = req.body;
    if (!nic || !password) {
      return res.status(400).json({ error: "NIC and Password are required." });
    }

    const cleanNic = nic.trim();
    const user = await User.findOne({ nic: cleanNic }, { documents: 0 });
    if (!user) {
      return res.status(400).json({ error: "Invalid NIC or Password." });
    }

    const hashedInput = hashPassword(password);
    if (user.password !== hashedInput) {
      return res.status(400).json({ error: "Invalid NIC or Password." });
    }

    if (user.status === "Rejected") {
      return res.status(400).json({ error: "Your registration has been rejected by the office staff." });
    } else if (user.status !== "Approved") {
      return res.status(400).json({ error: "Your account is pending approval from the office staff of your nearest branch." });
    }

    // Return user details excluding password
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ message: "Login successful", user: userObj });
  } catch (err) {
    console.error("Policy holder login API error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// 2. Fetch user's claims list
router.get("/user-claims", async (req, res) => {
  try {
    const { nic, includeDocs } = req.query;
    if (!nic) {
      return res.status(400).json({ error: "NIC query parameter is required." });
    }

    const cleanNic = nic.trim();
    const projection = includeDocs === "true"
      ? {}
      : { accidentPhotos: 0, drivingLicense: 0 };

    const claims = await Claim.find({ userNic: cleanNic }, projection).sort({ createdAt: -1 });
    res.json({ claims });
  } catch (err) {
    console.error("Fetch user claims API error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// 3. Track a single claim by Claim Number
router.get("/track-claim", async (req, res) => {
  try {
    const { claimNumber } = req.query;
    if (!claimNumber) {
      return res.status(400).json({ error: "Claim number query parameter is required." });
    }

    const claim = await Claim.findOne({ claimNumber: claimNumber.trim().toUpperCase() });
    if (!claim) {
      return res.status(404).json({ error: "No claim found with the provided Claim ID." });
    }

    res.json({ claim });
  } catch (err) {
    console.error("Track claim API error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// 4. Update claim details (status, amount, currentStep, append message, upload documents)
router.patch("/update-claim/:claimNumber", async (req, res) => {
  try {
    const { claimNumber } = req.params;
    const {
      status,
      amount,
      currentStep,
      documentsRequested,
      requestedDocuments,
      messageText,
      messageSender,
      uploadedDocuments
    } = req.body;

    const claim = await Claim.findOne({ claimNumber: claimNumber.trim().toUpperCase() });
    if (!claim) {
      return res.status(404).json({ error: "Claim not found." });
    }

    if (status !== undefined) claim.status = status;
    if (amount !== undefined) claim.amount = amount;
    if (currentStep !== undefined) claim.currentStep = currentStep;
    if (documentsRequested !== undefined) claim.documentsRequested = documentsRequested;
    if (requestedDocuments !== undefined) claim.requestedDocuments = requestedDocuments;

    if (messageText) {
      claim.messages.push({
        sender: messageSender || "Office Staff",
        message: messageText,
        sentAt: new Date()
      });
    }

    // Process additional document uploads
    if (uploadedDocuments && Array.isArray(uploadedDocuments)) {
      for (const doc of uploadedDocuments) {
        const { documentName, fileData, uploadedBy } = doc;
        if (documentName && fileData) {
          const uploadedUrl = await uploadToCloudinary(fileData, "claims/additional_documents");
          
          const creator = uploadedBy || req.body.uploadedBy || "Policy Holder";
          
          // Add to additionalDocuments array
          claim.additionalDocuments.push({
            name: documentName,
            url: uploadedUrl,
            uploadedAt: new Date(),
            uploadedBy: creator
          });

          // Remove uploaded document from requested list
          if (claim.requestedDocuments && Array.isArray(claim.requestedDocuments)) {
            claim.requestedDocuments = claim.requestedDocuments.filter(
              d => d.trim().toLowerCase() !== documentName.trim().toLowerCase()
            );
          }

          // Append audit message to claim history
          claim.messages.push({
            sender: creator,
            message: `Uploaded requested document: ${documentName}`,
            sentAt: new Date()
          });
        }
      }

      // If all requested documents are uploaded, auto-resolve requests
      if (claim.requestedDocuments && claim.requestedDocuments.length === 0) {
        claim.documentsRequested = false;
        
        // Auto transition to Review status
        claim.status = "Review";
        claim.currentStep = 4;
      }
    }

    await claim.save();
    res.json({ message: "Claim updated successfully", claim });
  } catch (err) {
    console.error("Update claim API error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// 5. Send an email from the policy holder contact page
router.post("/contact/email", async (req, res) => {
  try {
    const { name, email, nic, phone, subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: "Subject and message are required." });
    }

    const recipient = "claims@sanasainsurance.lk";
    const emailSubject = `Contact Request: ${subject}`;
    
    // Construct rich email body
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #004f6e; border-bottom: 2px solid #004f6e; padding-bottom: 10px;">Contact Inquiry from Policy Holder</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #475569; width: 120px;">Name:</td>
            <td style="padding: 6px 0; color: #0f172a;">${name || "Anonymous Policy Holder"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #475569;">Email:</td>
            <td style="padding: 6px 0; color: #0f172a;">${email || "Not Provided"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #475569;">NIC:</td>
            <td style="padding: 6px 0; color: #0f172a;">${nic || "Not Provided"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #475569;">Phone:</td>
            <td style="padding: 6px 0; color: #0f172a;">${phone || "Not Provided"}</td>
          </tr>
        </table>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #004f6e; padding: 15px; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #0f172a;">Message:</h3>
          <p style="white-space: pre-wrap; color: #334155; line-height: 1.6; margin-bottom: 0;">${message}</p>
        </div>
        
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          Sent from Sanasa Insurance Portal Contact Form
        </p>
      </div>
    `;

    const textBody = `
Contact Request: ${subject}

Policy Holder Details:
- Name: ${name || "Anonymous Policy Holder"}
- Email: ${email || "Not Provided"}
- NIC: ${nic || "Not Provided"}
- Phone: ${phone || "Not Provided"}

Message:
${message}

--
Sent from Sanasa Insurance Portal Contact Form
    `;

    const emailRes = await sendEmail(recipient, emailSubject, htmlBody, textBody);
    if (emailRes.sent) {
      res.json({ message: "Email sent successfully!" });
    } else {
      res.status(500).json({ error: emailRes.error || "Failed to send email." });
    }
  } catch (err) {
    console.error("Contact email sending API error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

export default router;
