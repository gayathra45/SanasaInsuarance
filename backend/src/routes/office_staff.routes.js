import express from "express";
import OfficeStaff from "../models/office_staff.model.js";
import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";
import Agent from "../models/agent.model.js";
import Admin from "../models/admin.model.js";
import { hashPassword } from "../utils/crypto.js";

const router = express.Router();

// POST login: /api/office-staff/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and Password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const staff = await OfficeStaff.findOne({ email: cleanEmail });
    if (!staff) {
      return res.status(400).json({ error: "Invalid Email or Password." });
    }

    const hashedInput = hashPassword(password);
    if (staff.password !== hashedInput) {
      return res.status(400).json({ error: "Invalid Email or Password." });
    }

    // Return staff object without password
    const staffObj = staff.toObject();
    delete staffObj.password;

    res.json({ message: "Office staff login successful", staff: staffObj });
  } catch (err) {
    console.error("Office staff login API error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// GET dashboard stats: /api/office-staff/dashboard-stats
router.get("/dashboard-stats", async (req, res) => {
  try {
    const { branch } = req.query;
    if (!branch) {
      return res.status(400).json({ error: "Branch query parameter is required." });
    }

    // Filter by the last 30 days (one month data)
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const dateFilter = { createdAt: { $gte: oneMonthAgo } };

    // Common query filter by branch
    const branchFilter = { branch: branch.trim() };

    // 1. KPI Counts
    const unassignedClaimsCount = await Claim.countDocuments({
      ...branchFilter,
      ...dateFilter,
      assignedAgent: ""
    });

    const newRegistrationsCount = await User.countDocuments({
      ...branchFilter,
      status: "Pending"
    });

    const activeClaimsCount = await Claim.countDocuments({
      ...branchFilter,
      ...dateFilter,
      status: "In Progress"
    });

    const pendingClaimsCount = await Claim.countDocuments({
      ...branchFilter,
      ...dateFilter,
      status: "Pending"
    });

    // 2. Fetch Lists for Dashboard (excluding heavy image/document fields)
    // New Claims for this branch (latest first)
    const newClaimsList = await Claim.find(
      {
        ...branchFilter,
        ...dateFilter
      },
      { accidentPhotos: 0, drivingLicense: 0 }
    ).sort({ createdAt: -1 });

    // New Registrations for this branch (latest first)
    const newRegistrationsList = await User.find(
      {
        ...branchFilter,
        status: "Pending"
      },
      { documents: 0 }
    ).sort({ createdAt: -1 });

    res.json({
      stats: {
        unassignedClaims: unassignedClaimsCount,
        newRegistrations: newRegistrationsCount,
        activeClaims: activeClaimsCount,
        pendingClaims: pendingClaimsCount
      },
      newClaims: newClaimsList,
      newRegistrations: newRegistrationsList
    });
  } catch (err) {
    console.error("Office staff dashboard stats API error:", err);
    res.status(500).json({ error: "An internal server error occurred fetching dashboard statistics." });
  }
});

// GET all claims for a specific branch: /api/office-staff/claims
router.get("/claims", async (req, res) => {
  try {
    const { branch } = req.query;
    if (!branch) {
      return res.status(400).json({ error: "Branch query parameter is required." });
    }
    const claims = await Claim.find({ branch: branch.trim() }).sort({ createdAt: -1 });
    res.json({ claims });
  } catch (err) {
    console.error("Fetch office staff claims error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// GET all policy holders for a specific branch: /api/office-staff/policy-holders
router.get("/policy-holders", async (req, res) => {
  try {
    const { branch } = req.query;
    if (!branch) {
      return res.status(400).json({ error: "Branch query parameter is required." });
    }
    const policyHolders = await User.find({ branch: branch.trim(), status: "Approved" }, { password: 0 }).sort({ createdAt: -1 });
    res.json({ policyHolders });
  } catch (err) {
    console.error("Fetch office staff policy holders error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// GET all agents for a specific branch: /api/office-staff/agents
router.get("/agents", async (req, res) => {
  try {
    const { branch } = req.query;
    if (!branch) {
      return res.status(400).json({ error: "Branch query parameter is required." });
    }
    const agents = await Agent.find({ branch: branch.trim() }, { password: 0 }).sort({ createdAt: -1 });
    res.json({ agents });
  } catch (err) {
    console.error("Fetch office staff agents error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// GET all registrations for a specific branch: /api/office-staff/registrations
router.get("/registrations", async (req, res) => {
  try {
    const { branch } = req.query;
    if (!branch) {
      return res.status(400).json({ error: "Branch query parameter is required." });
    }
    const registrations = await User.find({ branch: branch.trim(), status: { $ne: "Approved" } }, { password: 0 }).sort({ createdAt: -1 });
    res.json({ registrations });
  } catch (err) {
    console.error("Fetch office staff registrations error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// PATCH update user registration status: /api/office-staff/registrations/:id/status
router.patch("/registrations/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value. Must be Pending, Approved, or Rejected." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    user.status = status;
    await user.save();

    res.json({ message: `Registration status updated to ${status}`, user });
  } catch (err) {
    console.error("Update registration status error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// PATCH update claim details: /api/office-staff/claims/:claimNumber
router.patch("/claims/:claimNumber", async (req, res) => {
  try {
    const { claimNumber } = req.params;
    const { status, amount, currentStep, assignedAgent, messageText, messageSender } = req.body;

    const claim = await Claim.findOne({ claimNumber: claimNumber.trim().toUpperCase() });
    if (!claim) {
      return res.status(404).json({ error: "Claim not found." });
    }

    if (status !== undefined) claim.status = status;
    if (amount !== undefined) claim.amount = amount === "" ? null : Number(amount);
    if (currentStep !== undefined) claim.currentStep = Number(currentStep);
    if (assignedAgent !== undefined) claim.assignedAgent = assignedAgent;

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
    console.error("Update claim error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// POST create a new agent: /api/office-staff/agents
router.post("/agents", async (req, res) => {
  try {
    const { name, email, nic, address, dob, password, branch } = req.body;

    if (!name || !email || !nic || !address || !dob || !password || !branch) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNic = nic.trim().toUpperCase();

    // Check if email or nic already exists in Agent collection
    const existingAgent = await Agent.findOne({ $or: [{ email: cleanEmail }, { nic: cleanNic }] });
    if (existingAgent) {
      return res.status(400).json({ error: "An agent with this Email or NIC is already registered." });
    }

    // Check if email or nic already exists in User collection
    const existingUser = await User.findOne({ $or: [{ email: cleanEmail }, { nic: cleanNic }] });
    if (existingUser) {
      return res.status(400).json({ error: "A user with this Email or NIC is already registered." });
    }

    // Check if email or nic already exists in Admin collection
    const existingAdmin = await Admin.findOne({ $or: [{ email: cleanEmail }, { nic: cleanNic }] });
    if (existingAdmin) {
      return res.status(400).json({ error: "An admin with this Email or NIC is already registered." });
    }

    // Check if email already exists in OfficeStaff collection
    const existingOfficeStaff = await OfficeStaff.findOne({ email: cleanEmail });
    if (existingOfficeStaff) {
      return res.status(400).json({ error: "An office staff account with this Email is already registered." });
    }

    // Auto-generate agentId (e.g. AGT-0001)
    const lastAgent = await Agent.findOne({}, { agentId: 1 }).sort({ createdAt: -1 });
    let nextAgentId = "AGT-0001";
    if (lastAgent && lastAgent.agentId) {
      const match = lastAgent.agentId.match(/AGT-(\d+)/i);
      if (match) {
        const currentNum = parseInt(match[1], 10);
        nextAgentId = `AGT-${String(currentNum + 1).padStart(4, "0")}`;
      }
    }

    const hashedPassword = hashPassword(password);

    const newAgent = new Agent({
      agentId: nextAgentId,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      nic: cleanNic,
      address: address.trim(),
      dob: dob.trim(),
      branch: branch.trim()
    });

    await newAgent.save();

    // Return agent details without password
    const agentObj = newAgent.toObject();
    delete agentObj.password;

    res.status(201).json({ message: "Agent registered successfully", agent: agentObj });
  } catch (err) {
    console.error("Create agent API error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

export default router;
