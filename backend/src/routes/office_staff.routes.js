import express from "express";
import crypto from "crypto";
import OfficeStaff from "../models/office_staff.model.js";
import User from "../models/user.model.js";
import Claim from "../models/claim.model.js";
import Agent from "../models/agent.model.js";
import Admin from "../models/admin.model.js";
import { hashPassword } from "../utils/crypto.js";
import { uploadToCloudinary } from "../utils/upload.js";
import { sendEmail } from "../utils/email.js";

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
      ...dateFilter,
      status: { $nin: ["Approved", "Rejected"] }
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
        ...dateFilter,
        status: { $nin: ["Approved", "Rejected"] }
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
    
    // Automatically approve initial vehicles if registration is approved
    if (status === "Approved" && user.vehicles && Array.isArray(user.vehicles)) {
      user.vehicles.forEach(v => {
        v.status = "Approved";
      });
    }

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
    const {
      status,
      amount,
      currentStep,
      assignedAgent,
      messageText,
      messageTexts,
      messageSender,
      messageRecipient,
      priority,
      requestedDocuments,
      documentsRequested,
      documentRequestTo,
      inspectionReport,
      inspectionSubmitted,
      paymentReceipt,
      noteText,
      bankName,
      bankBranch,
      bankAccount,
      rejectionReason,
      isManuallyUpdated,
      manualUpdateReason,
      manualUpdateBy
    } = req.body;

    const claim = await Claim.findOne({ claimNumber: claimNumber.trim().toUpperCase() });
    if (!claim) {
      return res.status(404).json({ error: "Claim not found." });
    }

    if (status !== undefined) {
      claim.status = status;
    }
    
    if (amount !== undefined) {
      claim.amount = amount === "" ? null : Number(amount);
    }

    if (currentStep !== undefined) {
      claim.currentStep = Number(currentStep);
    }

    if (assignedAgent !== undefined) {
      claim.assignedAgent = assignedAgent;
      // Auto-advance to Step 2 (Assigned) if agent assigned and step is 1
      if (assignedAgent && claim.currentStep < 2) {
        claim.currentStep = 2;
      }
    }

    if (priority !== undefined) claim.priority = priority;
    if (requestedDocuments !== undefined) claim.requestedDocuments = requestedDocuments;
    if (documentsRequested !== undefined) claim.documentsRequested = documentsRequested;
    if (documentRequestTo !== undefined) claim.documentRequestTo = documentRequestTo;
    if (inspectionReport !== undefined) claim.inspectionReport = inspectionReport;
    
    if (inspectionSubmitted !== undefined) {
      claim.inspectionSubmitted = inspectionSubmitted;
      if (inspectionSubmitted && claim.currentStep < 4) {
        claim.currentStep = 4;
      }
    }

    if (paymentReceipt !== undefined) {
      let receiptUrl = paymentReceipt;
      if (paymentReceipt && paymentReceipt.startsWith("data:")) {
        receiptUrl = await uploadToCloudinary(paymentReceipt, "claims/payment_receipts");
      }
      claim.paymentReceipt = receiptUrl;
      if (receiptUrl && claim.currentStep < 6) {
        claim.currentStep = 6;
      }
    }

    if (bankName !== undefined) claim.bankName = bankName;
    if (bankBranch !== undefined) claim.bankBranch = bankBranch;
    if (bankAccount !== undefined) claim.bankAccount = bankAccount;
    if (rejectionReason !== undefined) claim.rejectionReason = rejectionReason;

    if (isManuallyUpdated !== undefined) {
      claim.isManuallyUpdated = isManuallyUpdated;
      if (isManuallyUpdated) {
        claim.manualUpdateAt = new Date();
      }
    }
    if (manualUpdateReason !== undefined) {
      claim.manualUpdateReason = manualUpdateReason;
    }
    if (manualUpdateBy !== undefined) {
      claim.manualUpdateBy = manualUpdateBy;
    }

    if (messageText) {
      claim.messages.push({
        sender: messageSender || "Office Staff",
        message: messageText,
        sentAt: new Date(),
        recipient: messageRecipient || "Policy Holder"
      });
    }

    if (Array.isArray(messageTexts)) {
      messageTexts.forEach((msg) => {
        claim.messages.push({
          sender: messageSender || "Office Staff",
          message: msg.message || msg,
          sentAt: new Date(),
          recipient: msg.recipient || messageRecipient || "Policy Holder"
        });
      });
    }

    if (noteText) {
      claim.notes.push({
        text: noteText,
        addedBy: messageSender || "Office Staff",
        addedAt: new Date()
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
    const {
      name,
      email,
      nic,
      address,
      dob,
      branch,
      phone,
      city,
      province,
      nicFront,
      nicBack,
      birthCertificate,
      policeReport
    } = req.body;

    console.log("POST /agents fields received:", { name, email, nic, address, dob, branch });
    if (!name || !email || !nic || !address || !dob || !branch) {
      return res.status(400).json({ error: "All standard fields are required." });
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

    // Generate a long random password for the inactive account
    const tempPassword = crypto.randomBytes(32).toString("hex");
    const hashedPassword = hashPassword(tempPassword);

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString("hex");
    const activationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Upload documents to Cloudinary if they exist
    let nicFrontUrl = "";
    let nicBackUrl = "";
    let birthCertificateUrl = "";
    let policeReportUrl = "";

    if (nicFront) {
      nicFrontUrl = await uploadToCloudinary(nicFront, "agents/documents");
    }
    if (nicBack) {
      nicBackUrl = await uploadToCloudinary(nicBack, "agents/documents");
    }
    if (birthCertificate) {
      birthCertificateUrl = await uploadToCloudinary(birthCertificate, "agents/documents");
    }
    if (policeReport) {
      policeReportUrl = await uploadToCloudinary(policeReport, "agents/documents");
    }

    const newAgent = new Agent({
      agentId: nextAgentId,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      nic: cleanNic,
      address: address.trim(),
      dob: dob.trim(),
      branch: branch.trim(),
      phone: phone ? phone.trim() : "",
      city: city ? city.trim() : "",
      province: province ? province.trim() : "",
      nicFront: nicFrontUrl,
      nicBack: nicBackUrl,
      birthCertificate: birthCertificateUrl,
      policeReport: policeReportUrl,
      status: "inactive",
      activationToken,
      activationExpires
    });

    await newAgent.save();

    // Send activation email
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const activationLink = `${frontendUrl}/ActivateAgent?token=${activationToken}`;

    const subject = "Activate Your Sanasa Insurance Agent Account";
    const textBody = `Hello ${name.trim()},\n\nYou have been registered as an Insurance Agent for Sanasa Insurance. Please activate your account and set your login password by clicking the link below:\n\n${activationLink}\n\nThis link will expire in 24 hours.\n\nThank you,\nSanasa Insurance Team`;
    const htmlBody = `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
        <h2 style="color: #0f2d4a; margin-top: 0;">Welcome to Sanasa Insurance, ${name.trim()}!</h2>
        <p>You have been registered as an Insurance Agent at our <strong>${branch.trim()} Branch</strong>.</p>
        <p>To activate your account and set your password, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background-color: #0f2d4a; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Activate Account</a>
        </div>
        <p style="color: #64748b; font-size: 12px;">This activation link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #64748b; font-size: 12px;">If you did not request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail(cleanEmail, subject, htmlBody, textBody);
    } catch (emailErr) {
      console.error("Failed to send activation email:", emailErr);
    }

    // Return agent details without password
    const agentObj = newAgent.toObject();
    delete agentObj.password;

    res.status(201).json({ message: "Agent registered successfully", agent: agentObj });
  } catch (err) {
    console.error("Create agent API error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// DELETE agent: /api/office-staff/agents/:id
router.delete("/agents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAgent = await Agent.findByIdAndDelete(id);
    if (!deletedAgent) {
      return res.status(404).json({ error: "Agent not found." });
    }
    res.json({ message: "Agent removed successfully." });
  } catch (err) {
    console.error("Delete agent error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// PATCH update agent: /api/office-staff/agents/:id
router.patch("/agents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      nic,
      dob,
      address,
      password,
      phone,
      city,
      province,
      bankName,
      bankBranch,
      accountNumber,
      accountType,
      accountHolderName,
      nicFront,
      nicBack,
      birthCertificate,
      policeReport
    } = req.body;

    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found." });
    }

    if (name !== undefined) agent.name = name.trim();
    if (email !== undefined) agent.email = email.trim().toLowerCase();
    if (nic !== undefined) agent.nic = nic.trim().toUpperCase();
    if (dob !== undefined) agent.dob = dob.trim();
    if (address !== undefined) agent.address = address.trim();
    if (phone !== undefined) agent.phone = phone.trim();
    if (city !== undefined) agent.city = city.trim();
    if (province !== undefined) agent.province = province.trim();
    if (bankName !== undefined) agent.bankName = bankName.trim();
    if (bankBranch !== undefined) agent.bankBranch = bankBranch.trim();
    if (accountNumber !== undefined) agent.accountNumber = accountNumber.trim();
    if (accountType !== undefined) agent.accountType = accountType.trim();
    if (accountHolderName !== undefined) agent.accountHolderName = accountHolderName.trim();
    
    if (nicFront !== undefined) {
      agent.nicFront = nicFront ? await uploadToCloudinary(nicFront, "agents/documents") : "";
    }
    if (nicBack !== undefined) {
      agent.nicBack = nicBack ? await uploadToCloudinary(nicBack, "agents/documents") : "";
    }
    if (birthCertificate !== undefined) {
      agent.birthCertificate = birthCertificate ? await uploadToCloudinary(birthCertificate, "agents/documents") : "";
    }
    if (policeReport !== undefined) {
      agent.policeReport = policeReport ? await uploadToCloudinary(policeReport, "agents/documents") : "";
    }

    if (password) {
      agent.password = hashPassword(password);
    }

    await agent.save();

    const agentObj = agent.toObject();
    delete agentObj.password;

    res.json({ message: "Agent updated successfully", agent: agentObj });
  } catch (err) {
    console.error("Update agent error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// GET pending vehicles for office staff: /api/office-staff/pending-vehicles
router.get("/pending-vehicles", async (req, res) => {
  try {
    const { branch } = req.query;
    if (!branch) {
      return res.status(400).json({ error: "Branch query parameter is required." });
    }

    const users = await User.find({
      branch: branch.trim(),
      $or: [
        { "vehicles.status": "Pending" },
        { "vehicles.status": null },
        { "vehicles.status": { $exists: false } },
        { "vehicles": { $elemMatch: { status: { $exists: false } } } }
      ]
    }, { password: 0 });

    const pendingVehiclesList = [];
    users.forEach(user => {
      user.vehicles.forEach(vehicle => {
        if (!vehicle.status || vehicle.status === "Pending") {
          pendingVehiclesList.push({
            user: {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              nic: user.nic,
              email: user.email,
              mobile: user.mobile,
              dob: user.dob,
              address: user.address,
              province: user.province,
              city: user.city,
              branch: user.branch,
              status: user.status,
              createdAt: user.createdAt,
              referenceNumber: user.referenceNumber,
              vehicles: user.vehicles
            },
            vehicle
          });
        }
      });
    });

    res.json({ pendingVehicles: pendingVehiclesList });
  } catch (err) {
    console.error("Fetch pending vehicles error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// PATCH verify vehicle: /api/office-staff/vehicles/verify
router.patch("/vehicles/verify", async (req, res) => {
  try {
    const { nic, numberPlate, action } = req.body; // action: "Approve" or "Reject"
    if (!nic || !numberPlate || !action) {
      return res.status(400).json({ error: "NIC, numberPlate, and action are required." });
    }

    if (!["Approve", "Reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Must be Approve or Reject." });
    }

    const user = await User.findOne({ nic: nic.trim() });
    if (!user) {
      return res.status(404).json({ error: "Policy holder not found." });
    }

    const vehicle = user.vehicles.find(
      v => v.numberPlate.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === numberPlate.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
    );

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found." });
    }

    if (action === "Approve") {
      vehicle.status = "Approved";
    } else {
      vehicle.status = "Rejected";
    }

    await user.save();

    res.json({
      message: `Vehicle successfully ${action === "Approve" ? "approved" : "rejected"}.`,
      vehicle
    });
  } catch (err) {
    console.error("Verify vehicle error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

export default router;
