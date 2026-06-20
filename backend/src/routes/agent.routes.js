import express from "express";
import crypto from "crypto";
import Agent from "../models/agent.model.js";
import Claim from "../models/claim.model.js";

const router = express.Router();

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// POST agent login: /api/agent/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and Password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const agent = await Agent.findOne({ email: cleanEmail });
    if (!agent) {
      return res.status(400).json({ error: "Invalid Email or Password." });
    }

    if (agent.status === "inactive") {
      return res.status(400).json({ error: "Your account is not activated. Please check your email to set a password and activate your account." });
    }

    const hashedInput = hashPassword(password);
    if (agent.password !== hashedInput) {
      return res.status(400).json({ error: "Invalid Email or Password." });
    }

    const agentObj = agent.toObject();
    delete agentObj.password;

    res.json({ message: "Agent login successful", agent: agentObj });
  } catch (err) {
    console.error("Agent login API error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// GET agent's claims: /api/agent/claims?email=...
router.get("/claims", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Agent email is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    // Fetch all claims assigned to this agent email from MongoDB (excluding heavy image/license fields)
    const claims = await Claim.find(
      { assignedAgent: cleanEmail },
      { accidentPhotos: 0, drivingLicense: 0 }
    ).sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) {
    console.error("Fetch agent claims error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// POST update claim status/assessment: /api/agent/claims/:id/status
router.post("/claims/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, amount, inspectionReport, inspectionSubmitted } = req.body;

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (amount !== undefined) updateData.amount = amount === "" ? null : Number(amount);
    if (inspectionReport !== undefined) updateData.inspectionReport = inspectionReport;
    if (inspectionSubmitted !== undefined) {
      updateData.inspectionSubmitted = inspectionSubmitted;
      if (inspectionSubmitted) {
        updateData.currentStep = 3;
      }
    }

    const updatedClaim = await Claim.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedClaim) {
      return res.status(404).json({ error: "Claim not found." });
    }

    res.json({ message: "Claim status updated successfully", claim: updatedClaim });
  } catch (err) {
    console.error("Update claim status error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// GET verify activation token: /api/agent/verify-activation?token=...
router.get("/verify-activation", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: "Activation token is required." });
    }

    const agent = await Agent.findOne({
      activationToken: token,
      activationExpires: { $gt: new Date() },
      status: "inactive"
    });

    if (!agent) {
      return res.status(400).json({ error: "Invalid or expired activation link." });
    }

    res.json({ message: "Token verified successfully.", email: agent.email, name: agent.name });
  } catch (err) {
    console.error("Verify activation error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// POST activate account: /api/agent/activate
router.post("/activate", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token and Password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const agent = await Agent.findOne({
      activationToken: token,
      activationExpires: { $gt: new Date() },
      status: "inactive"
    });

    if (!agent) {
      return res.status(400).json({ error: "Invalid or expired activation link." });
    }

    // Hash password and set to active
    agent.password = hashPassword(password);
    agent.status = "active";
    agent.activationToken = undefined;
    agent.activationExpires = undefined;

    await agent.save();

    res.json({ message: "Your agent account has been activated successfully! You can now log in." });
  } catch (err) {
    console.error("Activate agent error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

export default router;
