import express from "express";
import crypto from "crypto";
import User from "../../Signup/user.model.js";
import Claim from "../claim.model.js";

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
    const { nic } = req.query;
    if (!nic) {
      return res.status(400).json({ error: "NIC query parameter is required." });
    }

    const cleanNic = nic.trim();
    const claims = await Claim.find(
      { userNic: cleanNic },
      { accidentPhotos: 0, drivingLicense: 0 }
    ).sort({ createdAt: -1 });
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

// 4. Update claim details by office staff (status, amount, currentStep, append message)
router.patch("/update-claim/:claimNumber", async (req, res) => {
  try {
    const { claimNumber } = req.params;
    const { status, amount, currentStep, documentsRequested, requestedDocuments, messageText, messageSender } = req.body;

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

    await claim.save();
    res.json({ message: "Claim updated successfully", claim });
  } catch (err) {
    console.error("Update claim API error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

export default router;
