import express from "express";
import crypto from "crypto";
import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";
import Agent from "../models/agent.model.js";

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

// GET aggregated admin notifications: /api/admin/notifications
router.get("/notifications", async (req, res) => {
  try {
    const compiled = [];

    // 1. Claims notifications
    const claims = await Claim.find({}).sort({ createdAt: -1 });
    claims.forEach((claim) => {
      // A. Unassigned Claim
      if (claim.status === "Pending" && (!claim.assignedAgent || claim.assignedAgent.trim() === "")) {
        compiled.push({
          id: `${claim._id}-unassigned`,
          type: "urgent",
          category: "claims",
          title: "Claim Awaiting Agent Assignment",
          description: `Claim ${claim.claimNumber} for vehicle ${claim.vehiclePlate} has been registered and is waiting for an agent assignment.`,
          date: claim.createdAt,
          isUrgent: true,
          link: `/Admin/Claims?claimId=${claim.claimNumber}`,
          actionLabel: "View Claims",
          claim
        });
      }

      // B. Inspection Report Submitted (awaiting staff/admin decision)
      if (claim.inspectionSubmitted && claim.currentStep === 3) {
        compiled.push({
          id: `${claim._id}-inspection-submitted`,
          type: "action",
          category: "claims",
          title: "Inspection Report Submitted",
          description: `Agent ${claim.assignedAgent || "assigned"} has uploaded the physical inspection report for claim ${claim.claimNumber}. Ready for review.`,
          date: claim.createdAt, // Or the date of the inspection report update if tracked separately
          isUrgent: false,
          link: `/Admin/Claims?claimId=${claim.claimNumber}`,
          actionLabel: "Review Assessment",
          claim
        });
      }

      // C. Claim Finalized (Approved/Rejected)
      if (claim.status === "Approved" || claim.status === "Rejected") {
        compiled.push({
          id: `${claim._id}-finalized`,
          type: "decision",
          category: "claims",
          title: `Claim ${claim.claimNumber} ${claim.status}`,
          description: `The insurance claim for vehicle ${claim.vehiclePlate} has been finalized. Final Status: ${claim.status}.`,
          date: claim.createdAt,
          isUrgent: false,
          link: `/Admin/Claims?claimId=${claim.claimNumber}`,
          actionLabel: "View Claim Details",
          claim
        });
      }

      // D. Office Staff message notification
      if (claim.messages && claim.messages.length > 0) {
        const staffMessages = claim.messages.filter((msg) => {
          const senderLower = (msg.sender || "").toLowerCase();
          return senderLower.includes("staff") || senderLower.includes("office") || senderLower.includes("admin");
        });
        if (staffMessages.length > 0) {
          const lastStaffMsg = staffMessages[staffMessages.length - 1];
          compiled.push({
            id: `${claim._id}-staff-msg-${lastStaffMsg.sentAt}`,
            type: "staff_message",
            category: "staff_messages",
            title: `Message from Office Staff on Claim ${claim.claimNumber}`,
            description: `From ${lastStaffMsg.sender}: "${lastStaffMsg.message}"`,
            date: lastStaffMsg.sentAt,
            isUrgent: false,
            link: `/Admin/Claims?claimId=${claim.claimNumber}`,
            actionLabel: "View Claim Details",
            claim
          });
        }
      }
    });

    // 2. Policy Holder notifications
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    users.forEach((user) => {
      // A. Pending portal registration
      if (user.status === "Pending" || (user.status !== "Approved" && user.status !== "Rejected")) {
        compiled.push({
          id: `${user._id}-pending-reg`,
          type: "decision",
          category: "policy_holders",
          title: "Pending Portal Registration",
          description: `Policy Holder registration request from ${user.firstName} ${user.lastName} (NIC: ${user.nic}) is awaiting approval.`,
          date: user.createdAt,
          isUrgent: false,
          link: `/Admin/PolicyHolders?ref=${user.referenceNumber}`,
          actionLabel: "Review Registration",
          user
        });
      }

      // B. Pending vehicle approval
      if (user.vehicles && Array.isArray(user.vehicles)) {
        user.vehicles.forEach((vehicle) => {
          if (!vehicle.status || vehicle.status === "Pending") {
            compiled.push({
              id: `${user._id}-vehicle-${vehicle.numberPlate}`,
              type: "action",
              category: "policy_holders",
              title: "New Vehicle Verification Pending",
              description: `Vehicle ${vehicle.numberPlate} (${vehicle.company} ${vehicle.model}) added by Policy Holder (NIC: ${user.nic}) requires verification.`,
              date: user.createdAt,
              isUrgent: false,
              link: `/Admin/PolicyHolders?nic=${user.nic}`,
              actionLabel: "Verify Vehicle",
              user,
              vehicle
            });
          }
        });
      }
    });

    // 3. Agent notifications
    const agents = await Agent.find({}, { password: 0 }).sort({ createdAt: -1 });
    agents.forEach((agent) => {
      // A. Inactive agent
      if (agent.status === "inactive") {
        compiled.push({
          id: `${agent._id}-inactive-agent`,
          type: "info",
          category: "agents",
          title: "Agent Account Pending Activation",
          description: `Agent ${agent.name} (${agent.email}) has been registered but is currently inactive.`,
          date: agent.createdAt,
          isUrgent: false,
          link: `/Admin/Agents?email=${agent.email}`,
          actionLabel: "View Agent",
          agent
        });
      }
    });

    // Sort: Urgent first, then newest first
    compiled.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    res.json({ notifications: compiled });
  } catch (err) {
    console.error("Fetch admin notifications error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

export default router;
