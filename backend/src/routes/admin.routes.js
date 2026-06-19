import express from "express";
import crypto from "crypto";
import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";

const router = express.Router();

// Helper to hash password matching the project's standard hashing logic (SHA-256)
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// POST admin login: /api/admin/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and Password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = await Admin.findOne({ email: cleanEmail });
    if (!admin) {
      return res.status(400).json({ error: "Invalid Email or Password." });
    }

    const hashedInput = hashPassword(password);
    if (admin.password !== hashedInput) {
      return res.status(400).json({ error: "Invalid Email or Password." });
    }

    // Return admin object without password
    const adminObj = admin.toObject();
    delete adminObj.password;

    res.json({ message: "Admin login successful", admin: adminObj });
  } catch (err) {
    console.error("Admin login API error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// GET admin dashboard stats: /api/admin/dashboard-stats
router.post("/dashboard-stats", async (req, res) => {
  // Support POST request for stats
});

router.get("/dashboard-stats", async (req, res) => {
  try {
    // 30 days time window
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const dateFilter = { createdAt: { $gte: oneMonthAgo } };

    // 1. KPI Counts (last 30 days)
    const policyHoldersCount = await User.countDocuments(dateFilter);
    const totalClaimsCount = await Claim.countDocuments(dateFilter);
    const activeClaimsCount = await Claim.countDocuments({ status: "In Progress", ...dateFilter });
    const pendingClaimsCount = await Claim.countDocuments({ status: "Pending", ...dateFilter });

    // 2. Branch Performances (Temporarily set to 0, pending office staff assignment logic)
    const branches = [
      { name: "Galle", percentage: 0, count: 0 },
      { name: "Matara", percentage: 0, count: 0 },
      { name: "Anuradhapura", percentage: 0, count: 0 },
      { name: "Embilipitiya", percentage: 0, count: 0 }
    ];

    // 3. Monthly Claims (Aggregated by month, filtered to last 30 days)
    const claimsByMonth = await Claim.aggregate([
      {
        $match: dateFilter
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          status: "$status"
        }
      },
      {
        $group: {
          _id: { month: "$month" },
          submittedCount: { $sum: 1 },
          approvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] }
          }
        }
      }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyClaims = monthNames.map((name, index) => {
      const monthNum = index + 1;
      const match = claimsByMonth.find(c => c._id.month === monthNum);
      return {
        month: name,
        submitted: match ? match.submittedCount : 0,
        approved: match ? match.approvedCount : 0
      };
    });

    res.json({
      stats: {
        policyHolders: policyHoldersCount,
        totalClaims: totalClaimsCount,
        activeClaims: activeClaimsCount,
        pendingClaims: pendingClaimsCount
      },
      branches,
      monthlyClaims
    });
  } catch (err) {
    console.error("Admin dashboard stats API error:", err);
    res.status(500).json({ error: "An internal server error occurred fetching dashboard statistics." });
  }
});

export default router;
