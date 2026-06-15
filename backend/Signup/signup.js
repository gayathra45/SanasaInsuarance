import express from "express";
import crypto from "crypto";
import User from "./user.model.js";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config({ override: true });

const router = express.Router();

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
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
      return res.status(400).json({ error: "All four required verification documents (NIC Front, NIC Back, Vehicle Registration, and Revenue License) must be uploaded." });
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
      firstName,
      lastName,
      nic: cleanNic,
      mobile: cleanMobile,
      email,
      dob,
      address,
      province,
      city,
      password: hashedPassword,
      vehicles,
      documents,
      referenceNumber: nextRefNum,
    });

    await newUser.save();

    res.status(201).json({ message: "Registration successful", referenceNumber: nextRefNum });
  } catch (err) {
    console.error("Signup backend error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// ─── ROUTE 1: Send password reset link to user's email ───────────────────────
router.post("/reset-password/send-link", async (req, res) => {
  try {
    const { nic, mobile, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNic = nic ? nic.trim() : "";
    const cleanMobile = mobile ? mobile.replace(/[-+()\s]/g, "") : "";

    let user;
    if (cleanNic) {
      // Find user by NIC and email (case-insensitive)
      user = await User.findOne({
        nic: { $regex: new RegExp(`^${cleanNic}$`, "i") },
        email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
      });
      if (!user) {
        return res.status(400).json({
          error: "No registered account found with that NIC and Email combination.",
        });
      }
    } else if (cleanMobile) {
      // Find user by normalized Mobile and email (case-insensitive)
      user = await User.findOne({
        mobile: cleanMobile,
        email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
      });
      if (!user) {
        return res.status(400).json({
          error: "No registered account found with that Mobile number and Email combination.",
        });
      }
    } else {
      return res.status(400).json({
        error: "Secondary verification detail (NIC or Mobile number) is required.",
      });
    }

    // Generate a secure random token (64 hex chars = 32 bytes)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save token to database
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Build the reset URL — frontend Reset_password page with token in query
    const resetUrl = `http://localhost:3000/Reset_password?token=${resetToken}`;

    // ── EMAIL HTML BODY ──────────────────────────────────────────────────────
    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f4f7f9;border-radius:12px;border:1px solid #dde3e9">
        <div style="text-align:center;margin-bottom:24px">
          <h2 style="color:#0e3b44;font-size:22px;margin:0">Sanasa General Insurance</h2>
          <p style="color:#666;font-size:13px;margin:4px 0 0">Password Reset Request</p>
        </div>
        <p style="color:#444;font-size:15px">Hi <strong>${user.firstName}</strong>,</p>
        <p style="color:#555;font-size:14px;line-height:1.6">
          We received a request to reset the password for your account.<br/>
          Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.
        </p>
        <div style="text-align:center;margin:32px 0">
          <a href="${resetUrl}"
             style="background:#ff9800;color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:16px;font-weight:bold;display:inline-block;letter-spacing:0.5px">
            Reset My Password
          </a>
        </div>
        <p style="color:#888;font-size:12px;text-align:center">
          If you did not request this, you can safely ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #dde3e9;margin:24px 0"/>
        <p style="color:#aaa;font-size:11px;text-align:center">Sanasa General Insurance &bull; Sri Lanka</p>
      </div>
    `;
    const emailText = `Reset your Sanasa Insurance password:\n\n${resetUrl}\n\nThis link expires in 15 minutes. If you did not request this, ignore this email.`;

    // ── SEND EMAIL ────────────────────────────────────────────────────────────
    const resendKey = process.env.RESEND_API_KEY;
    const smtpUser  = process.env.SMTP_USER;
    const smtpPass  = process.env.SMTP_PASS;

    const hasGmail  = smtpUser && smtpPass &&
                      !smtpUser.includes("your-gmail") &&
                      !smtpPass.includes("your-16-char");
    const hasResend = resendKey && !resendKey.includes("re_your");

    let emailSent = false;
    let emailError = null;

    try {
      if (hasGmail) {
        // Gmail SMTP — sends to ANY email address
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: { user: smtpUser, pass: smtpPass },
        });
        await transporter.sendMail({
          from: `"Sanasa Insurance" <${smtpUser}>`,
          to: user.email,
          subject: "Reset Your Sanasa Insurance Password",
          html: emailHtml,
          text: emailText,
        });
        console.log(`✅ Email sent to ${user.email} via Gmail SMTP`);
        emailSent = true;

      } else if (hasResend) {
        // Resend — Note: free tier only sends to your own verified email
        const resend = new Resend(resendKey);
        const { error: resendError } = await resend.emails.send({
          from: "Sanasa Insurance <onboarding@resend.dev>",
          to: [user.email],
          subject: "Reset Your Sanasa Insurance Password",
          html: emailHtml,
          text: emailText,
        });
        if (resendError) {
          console.error("Resend error details:", resendError);
          throw new Error(resendError.message || "Failed to send email via Resend.");
        }
        console.log(`✅ Email sent to ${user.email} via Resend`);
        emailSent = true;

      } else {
        console.warn("⚠️ No email credentials configured in backend/.env. Bypassing sending email (Dev/Sandbox Mode).");
        emailError = "Email credentials not configured in backend/.env";
      }
    } catch (sendErr) {
      console.error("❌ Failed to send email:", sendErr);
      emailError = sendErr.message || "Unknown error during email sending";
    }

    res.json({
      message: emailSent
        ? "Password reset link sent to your email."
        : `Dev Mode: Reset link generated (email not sent: ${emailError || "configuration missing"}).`,
      resetToken,
      emailSent,
      emailError,
    });
  } catch (err) {
    console.error("Send reset link error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});




// ─── ROUTE 2: Validate token (when user opens the link from their email) ──────
router.get("/reset-password/validate-token", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: "Reset token is required." });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        error: "This reset link is invalid or has expired. Please request a new one.",
      });
    }

    res.json({ valid: true, firstName: user.firstName, email: user.email });
  } catch (err) {
    console.error("Validate token error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// ─── ROUTE 3: Update password using the reset token ──────────────────────────
router.post("/reset-password/update", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Reset token and new password are required." });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        error: "This reset link is invalid or has expired. Please request a new one.",
      });
    }

    // Validate password rules
    if (newPassword.length < 6 || newPassword.length > 12) {
      return res.status(400).json({ error: "Password must be between 6 and 12 characters." });
    }
    if (!/[0-9]/.test(newPassword) && !/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({ error: "Password must contain at least one number or special character." });
    }

    // Update password and clear the token
    user.password = hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password updated successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password update error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

export default router;
