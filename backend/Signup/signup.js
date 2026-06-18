import express from "express";
import crypto from "crypto";
import User from "./user.model.js";
import Agent from "../Agent/agent.model.js";
import OfficeStaff from "../office_staff/office_staff.model.js";
import Admin from "../Admin/admin.model.js";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config({ override: true });

const router = express.Router();

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function getNearestBranch(city = "", province = "") {
  const cleanCity = city.trim().toLowerCase();

  if (cleanCity.includes("galle") || cleanCity.includes("hambantota")) return "Galle";
  if (cleanCity.includes("matara")) return "Matara";
  if (cleanCity.includes("colombo") || cleanCity.includes("gampaha") || cleanCity.includes("kalutara")) return "Colombo";
  if (cleanCity.includes("anuradhapura") || cleanCity.includes("polonnaruwa")) return "Anuradhapura";
  if (cleanCity.includes("embilipitiya") || cleanCity.includes("ratnapura")) return "Embilipitiya";
  return "Galle";
}

// ─── CHECK: Email / NIC availability ─────────────────────────────────────────
router.get("/check", async (req, res) => {
  try {
    const { email, nic } = req.query;
    let emailExists = false;
    let nicExists = false;
    if (email) {
      const matchEmail = await User.findOne({ email: email.trim() });
      if (matchEmail) emailExists = true;
    }
    if (nic) {
      const matchNic = await User.findOne({ nic: nic.trim() });
      if (matchNic) nicExists = true;
    }
    res.json({ emailExists, nicExists });
  } catch (err) {
    console.error("Check endpoint error:", err);
    res.status(500).json({ error: "Server error checking details." });
  }
});

// ─── SIGNUP ───────────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { personal, vehicles, documents } = req.body;

    if (!personal || !vehicles || !documents) {
      return res.status(400).json({ error: "Missing required signup sections." });
    }

    const { firstName, lastName, nic, mobile, email, dob, address, province, city, password } = personal;

    if (!firstName || !lastName || !nic || !mobile || !email || !dob || !address || !province || !city || !password) {
      return res.status(400).json({ error: "All personal detail fields are required." });
    }

    const cleanNic = nic.trim();
    const nicRegex = /^\d{8,11}[0-9vVxX]$/;
    if (!nicRegex.test(cleanNic)) {
      return res.status(400).json({ error: "Invalid NIC number. Must be between 9 and 12 characters, starting with numbers and ending with optional V or X." });
    }

    const cleanMobile = mobile.replace(/[-+()\s]/g, "");
    if (!/^\d{9,10}$/.test(cleanMobile)) {
      return res.status(400).json({ error: "Mobile number must be exactly 9 or 10 digits." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    if (password.length < 6 || password.length > 12) {
      return res.status(400).json({ error: "Password must be between 6 and 12 characters." });
    }
    if (!/[0-9]/.test(password) && !/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ error: "Password must contain at least one number or special character." });
    }

    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return res.status(400).json({ error: "At least one vehicle registration detail is required." });
    }
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      if (!v.numberPlate || !v.vehicleType || !v.year || !v.company || !v.model || !v.engineNumber || !v.chassisNumber || !v.policyNumber) {
        return res.status(400).json({ error: `All required fields for Vehicle #${i + 1} must be filled.` });
      }
      const cleanPlate = v.numberPlate.replace(/[\s-]/g, "");
      if (cleanPlate.length < 5 || cleanPlate.length > 10 || !/^[A-Za-z0-9]+$/.test(cleanPlate)) {
        return res.status(400).json({ error: `Vehicle #${i + 1} Number Plate must be an alphanumeric mix between 5 and 10 characters.` });
      }
      if (!/^\d{4}$/.test(v.year)) {
        return res.status(400).json({ error: `Invalid year for Vehicle #${i + 1}. Must be a 4-digit number.` });
      }
      const cleanPolicy = v.policyNumber.replace(/[\s-]/g, "");
      if (!/^SAN[A-Za-z0-9]{5,9}$/i.test(cleanPolicy)) {
        return res.status(400).json({ error: `Vehicle #${i + 1} Insurance Policy Number must start with 'SAN' and be between 8 and 12 alphanumeric characters.` });
      }
    }

    const { nicFront, nicBack, vehicleReg, revenueLicense } = documents;
    if (!nicFront || !nicBack || !vehicleReg || !revenueLicense) {
      return res.status(400).json({ error: "All four required verification documents must be uploaded." });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { nic: cleanNic }] });
    if (existingUser) {
      return res.status(400).json({ error: "A user with this Email or NIC is already registered." });
    }

    const hashedPassword = hashPassword(password);

    const lastUser = await User.findOne({}, { referenceNumber: 1 }).sort({ createdAt: -1 });
    let nextRefNum = "REF-0001";
    if (lastUser && lastUser.referenceNumber) {
      const match = lastUser.referenceNumber.match(/REF-(\d+)/i);
      if (match) {
        const currentNum = parseInt(match[1], 10);
        nextRefNum = `REF-${String(currentNum + 1).padStart(4, "0")}`;
      }
    }

    const newUser = new User({
      firstName, lastName, nic: cleanNic, mobile: cleanMobile,
      email, dob, address, province, city,
      password: hashedPassword, vehicles, documents,
      branch: getNearestBranch(city, province),
      referenceNumber: nextRefNum,
    });

    await newUser.save();
    res.status(201).json({ message: "Registration successful", referenceNumber: nextRefNum });
  } catch (err) {
    console.error("Signup backend error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// ─── Helper: find user in correct collection ──────────────────────────────────
async function findUserByRole(role, cleanNic, cleanMobile, cleanEmail) {
  if (role === "policy_holder") {
    if (!cleanNic) return { user: null, error: "NIC is required for Policy Holder." };
    const user = await User.findOne({
      nic: { $regex: new RegExp(`^${cleanNic}$`, "i") },
      email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
    });
    return { user, userName: user?.firstName, error: user ? null : "No registered Policy Holder found with that NIC and Email." };
  }
  if (role === "insurance_agent") {
    if (!cleanNic) return { user: null, error: "NIC is required for Insurance Agent." };
    const user = await Agent.findOne({
      nic: { $regex: new RegExp(`^${cleanNic}$`, "i") },
      email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
    });
    return { user, userName: user?.name, error: user ? null : "No registered Insurance Agent found with that NIC and Email." };
  }
  if (role === "office_staff") {
    if (!cleanMobile) return { user: null, error: "Mobile number is required for Office Staff." };
    const user = await OfficeStaff.findOne({
      mobile: cleanMobile,
      email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
    });
    return { user, userName: user?.name, error: user ? null : "No registered Office Staff found with that Mobile and Email." };
  }
  if (role === "admin") {
    if (!cleanMobile) return { user: null, error: "Mobile number is required for Admin." };
    const user = await Admin.findOne({
      mobile: cleanMobile,
      email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
    });
    return { user, userName: user?.name, error: user ? null : "No registered Admin found with that Mobile and Email." };
  }
  return { user: null, error: "Invalid role specified." };
}

// ─── Helper: send email via Gmail SMTP or Resend ─────────────────────────────
async function sendEmail(toEmail, subject, htmlBody, textBody) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const resendKey = process.env.RESEND_API_KEY;

  const hasGmail = smtpUser && smtpPass &&
                   !smtpUser.includes("your-gmail") &&
                   !smtpPass.includes("your-16-char");
  const hasResend = resendKey && !resendKey.includes("re_your");

  if (hasGmail) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", port: 587, secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.sendMail({
      from: `"Sanasa Insurance" <${smtpUser}>`,
      to: toEmail, subject, html: htmlBody, text: textBody,
    });
    console.log(`✅ Email sent to ${toEmail} via Gmail SMTP`);
    return { sent: true };
  }

  if (hasResend) {
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: "Sanasa Insurance <onboarding@resend.dev>",
      to: [toEmail], subject, html: htmlBody, text: textBody,
    });
    if (error) throw new Error(error.message || "Resend failed.");
    console.log(`✅ Email sent to ${toEmail} via Resend`);
    return { sent: true };
  }

  console.warn("⚠️ No email credentials configured — Dev Mode.");
  return { sent: false, error: "Email credentials not configured in backend/.env" };
}

// ─── ROUTE 1: Send 6-digit OTP to user's email ───────────────────────────────
router.post("/reset-password/send-otp", async (req, res) => {
  try {
    const { nic, mobile, email, role } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const cleanEmail = email.trim().toLowerCase();
    const cleanNic = nic ? nic.trim() : "";
    const cleanMobile = mobile ? mobile.replace(/[-+()\s]/g, "") : "";
    const userRole = role || "policy_holder";

    const { user, userName, error: findError } = await findUserByRole(userRole, cleanNic, cleanMobile, cleanEmail);
    if (findError || !user) return res.status(400).json({ error: findError || "User not found." });

    // Rate limiting: 1 OTP per 60 seconds
    if (user.resetOtpRequestedAt) {
      const secs = (Date.now() - new Date(user.resetOtpRequestedAt).getTime()) / 1000;
      if (secs < 60) {
        return res.status(429).json({ error: `Please wait ${Math.ceil(60 - secs)} seconds before requesting another code.` });
      }
    }

    // Generate & store hashed OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = crypto.createHash("sha256").update(otp).digest("hex");
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.resetOtpRequestedAt = new Date();
    user.resetSessionToken = undefined;
    user.resetSessionExpires = undefined;
    await user.save();

    const displayName = userName || "User";
    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f4f7f9;border-radius:12px;border:1px solid #dde3e9">
        <div style="text-align:center;margin-bottom:24px">
          <h2 style="color:#0e3b44;font-size:22px;margin:0">Sanasa General Insurance</h2>
          <p style="color:#666;font-size:13px;margin:4px 0 0">Password Reset Verification Code</p>
        </div>
        <p style="color:#444;font-size:15px">Hi <strong>${displayName}</strong>,</p>
        <p style="color:#555;font-size:14px;line-height:1.6">Your password reset verification code is:</p>
        <div style="text-align:center;margin:32px 0">
          <div style="display:inline-block;background:#0e3b44;color:#ff9800;font-size:40px;font-weight:bold;letter-spacing:14px;padding:20px 36px;border-radius:14px;font-family:monospace;border:2px solid #1a5c6b">
            ${otp}
          </div>
        </div>
        <p style="color:#555;font-size:14px;text-align:center">
          This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
        </p>
        <p style="color:#888;font-size:12px;text-align:center;margin-top:16px">
          If you did not request this, you can safely ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #dde3e9;margin:24px 0"/>
        <p style="color:#aaa;font-size:11px;text-align:center">Sanasa General Insurance &bull; Sri Lanka</p>
      </div>
    `;
    const textBody = `Your Sanasa Insurance password reset code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`;

    let emailSent = false;
    let emailError = null;
    try {
      const result = await sendEmail(user.email, `${otp} — Your Sanasa Insurance Verification Code`, htmlBody, textBody);
      emailSent = result.sent;
      emailError = result.error || null;
    } catch (sendErr) {
      emailError = sendErr.message;
    }

    res.json({
      message: emailSent ? `Verification code sent to ${user.email}.` : "Dev Mode: OTP generated (email not sent).",
      emailSent,
      emailError,
      devOtp: emailSent ? undefined : otp,
    });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// ─── ROUTE 2: Verify OTP → issue session token ────────────────────────────────
router.post("/reset-password/verify-otp", async (req, res) => {
  try {
    const { email, otp, role } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP code are required." });

    const cleanEmail = email.trim().toLowerCase();
    const otpHash = crypto.createHash("sha256").update(otp.trim()).digest("hex");
    const cleanRole = role || "policy_holder";

    let user;
    const emailQuery = { email: { $regex: new RegExp(`^${cleanEmail}$`, "i") } };
    if (cleanRole === "policy_holder") user = await User.findOne(emailQuery);
    else if (cleanRole === "insurance_agent") user = await Agent.findOne(emailQuery);
    else if (cleanRole === "office_staff") user = await OfficeStaff.findOne(emailQuery);
    else if (cleanRole === "admin") user = await Admin.findOne(emailQuery);

    if (!user || !user.resetOtp) {
      return res.status(400).json({ error: "No OTP request found. Please request a new code." });
    }
    if (new Date() > user.resetOtpExpires) {
      return res.status(400).json({ error: "This code has expired. Please request a new one." });
    }
    if (user.resetOtp !== otpHash) {
      return res.status(400).json({ error: "Incorrect code. Please check your email and try again." });
    }

    // Issue short-lived session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpRequestedAt = undefined;
    user.resetSessionToken = sessionToken;
    user.resetSessionExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    res.json({ message: "OTP verified successfully.", sessionToken });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// ─── ROUTE 3: Update password using verified session token ────────────────────
router.post("/reset-password/update", async (req, res) => {
  try {
    const { sessionToken, newPassword } = req.body;
    if (!sessionToken || !newPassword) {
      return res.status(400).json({ error: "Session token and new password are required." });
    }

    const tokenQuery = { resetSessionToken: sessionToken, resetSessionExpires: { $gt: new Date() } };
    let user = await User.findOne(tokenQuery);
    if (!user) user = await Agent.findOne(tokenQuery);
    if (!user) user = await OfficeStaff.findOne(tokenQuery);
    if (!user) user = await Admin.findOne(tokenQuery);

    if (!user) {
      return res.status(400).json({ error: "Session expired or invalid. Please start the reset process again." });
    }

    if (newPassword.length < 6 || newPassword.length > 12) {
      return res.status(400).json({ error: "Password must be between 6 and 12 characters." });
    }
    if (!/[0-9]/.test(newPassword) && !/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({ error: "Password must contain at least one number or special character." });
    }

    user.password = hashPassword(newPassword);
    user.resetSessionToken = undefined;
    user.resetSessionExpires = undefined;
    await user.save();

    res.json({ message: "Password updated successfully. You can now log in." });
  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

export default router;
