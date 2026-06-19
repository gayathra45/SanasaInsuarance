import express from "express";
import crypto from "crypto";
import Agent from "./agent.model.js";
import Claim from "../policy_holder/claim.model.js";

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
    const { status, amount } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (amount !== undefined) updateData.amount = amount;

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

export default router;
