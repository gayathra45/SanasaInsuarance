import express from "express";
import crypto from "crypto";
import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";
import { uploadToCloudinary } from "../utils/upload.js";

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
        const { documentName, fileData } = doc;
        if (documentName && fileData) {
          const uploadedUrl = await uploadToCloudinary(fileData, "claims/additional_documents");
          
          // Add to additionalDocuments array
          claim.additionalDocuments.push({
            name: documentName,
            url: uploadedUrl,
            uploadedAt: new Date()
          });

          // Remove uploaded document from requested list
          if (claim.requestedDocuments && Array.isArray(claim.requestedDocuments)) {
            claim.requestedDocuments = claim.requestedDocuments.filter(
              d => d.trim().toLowerCase() !== documentName.trim().toLowerCase()
            );
          }

          // Append audit message to claim history
          claim.messages.push({
            sender: "Policy Holder",
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

export default router;
