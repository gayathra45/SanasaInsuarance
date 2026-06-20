import express from "express";
import crypto from "crypto";
import OfficeStaff from "../models/office_staff.model.js";
import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";

const router = express.Router();

// Helper to hash password matching the project's standard hashing logic (SHA-256)
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

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
      ...dateFilter
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
        ...dateFilter
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

export default router;
