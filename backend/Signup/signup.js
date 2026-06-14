import express from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "./user.model.js";

const router = express.Router();

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const sendResetEmail = async (email, name, link) => {
  const isSMTPConfigured =
    process.env.SMTP_USER &&
    process.env.SMTP_USER !== "your-email@gmail.com" &&
    process.env.SMTP_PASS &&
    process.env.SMTP_PASS !== "your-gmail-app-password";

  if (isSMTPConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: `"Sanasa Insurance" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Reset Your Sanasa Insurance Password",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0e3b44; text-align: center;">Sanasa General Insurance</h2>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p>Hello <strong>${name}</strong>,</p>
            <p>We received a request to reset your account password. Please click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background-color: #ff9800; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 25px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #999; text-align: center;">This is an automated system message. Please do not reply directly.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Real email successfully sent to: ${email}`);
      return true;
    } catch (err) {
      console.error("❌ Failed to send real email via SMTP, falling back to console simulation:", err.message);
    }
  }

  // Fallback console log simulation
  console.log("\n==================================================");
  console.log(`📧 SIMULATED EMAIL SENT TO: ${email}`);
  console.log(`Subject: Reset Your Sanasa Insurance Password`);
  console.log(`Hello ${name},`);
  console.log(`We received a request to reset your password. Please use the link below to confirm:`);
  console.log(link);
  console.log("==================================================\n");
  return false;
};

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

router.post("/", async (req, res) => {
  try {
    const { personal, vehicles, documents } = req.body;

    if (!personal || !vehicles || !documents) {
      return res.status(400).json({ error: "Missing required signup sections." });
    }

    // 1. Personal Details Validation
    const { firstName, lastName, nic, mobile, email, dob, address, province, city, password } = personal;

    if (!firstName || !lastName || !nic || !mobile || !email || !dob || !address || !province || !city || !password) {
      return res.status(400).json({ error: "All personal detail fields are required." });
    }

    // Validation 1: First Name and Last Name are normal text box (not empty)

    // Validation 2: NIC number must be 9-12 characters. First (length-1) chars are digits, last can optionally be v/V/x/X.
    const cleanNic = nic.trim();
    const nicRegex = /^\d{8,11}[0-9vVxX]$/;
    if (!nicRegex.test(cleanNic)) {
      return res.status(400).json({ error: "Invalid NIC number. Must be between 9 and 12 characters, starting with numbers and ending with optional V or X." });
    }

    // Validation 3: Mobile number must be 9 or 10 digits
    const cleanMobile = mobile.replace(/[-+()\s]/g, "");
    if (!/^\d{9,10}$/.test(cleanMobile)) {
      return res.status(400).json({ error: "Mobile number must be exactly 9 or 10 digits." });
    }

    // Validation 4: Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    // Validation 5: Password between 6 and 12 characters, containing at least one number or special character
    if (password.length < 6 || password.length > 12) {
      return res.status(400).json({ error: "Password must be between 6 and 12 characters." });
    }
    if (!/[0-9]/.test(password) && !/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ error: "Password must contain at least one number or special character." });
    }

    // 2. Vehicles validation
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

    // 3. Documents validation
    const { nicFront, nicBack, vehicleReg, revenueLicense } = documents;
    if (!nicFront || !nicBack || !vehicleReg || !revenueLicense) {
      return res.status(400).json({ error: "All four required verification documents (NIC Front, NIC Back, Vehicle Registration, and Revenue License) must be uploaded." });
    }

    // Check if email or NIC is already registered
    const existingUser = await User.findOne({ $or: [{ email }, { nic: cleanNic }] });
    if (existingUser) {
      return res.status(400).json({ error: "A user with this Email or NIC is already registered." });
    }

    // Hash the password using native crypto sha256
    const hashedPassword = hashPassword(password);

    // Generate next sequential reference number starting with "REF-0001"
    const lastUser = await User.findOne({}, { referenceNumber: 1 }).sort({ createdAt: -1 });
    let nextRefNum = "REF-0001";
    if (lastUser && lastUser.referenceNumber) {
      const match = lastUser.referenceNumber.match(/REF-(\d+)/i);
      if (match) {
        const currentNum = parseInt(match[1], 10);
        const nextNum = currentNum + 1;
        nextRefNum = `REF-${String(nextNum).padStart(4, '0')}`;
      }
    }

    // Save to Database
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
      referenceNumber: nextRefNum
    });

    await newUser.save();

    res.status(201).json({ message: "Registration successful", referenceNumber: nextRefNum });
  } catch (err) {
    console.error("Signup backend error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

router.post("/reset-password/verify", async (req, res) => {
  try {
    const { nic, email } = req.body;

    if (!nic || !email) {
      return res.status(400).json({ error: "NIC and Email are required." });
    }

    const cleanNic = nic.trim();
    const user = await User.findOne({ nic: cleanNic, email: email.trim() });
    if (!user) {
      return res.status(400).json({ error: "No registered account matches the provided NIC and Email." });
    }

    res.json({ message: "Identity verified successfully. You can now enter your new password." });
  } catch (err) {
    console.error("Reset password verify error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

router.post("/reset-password/update", async (req, res) => {
  try {
    const { nic, email, newPassword } = req.body;

    if (!nic || !email || !newPassword) {
      return res.status(400).json({ error: "NIC, Email, and New Password are required." });
    }

    const cleanNic = nic.trim();
    const user = await User.findOne({ nic: cleanNic, email: email.trim() });
    if (!user) {
      return res.status(400).json({ error: "No registered account matches the provided NIC and Email." });
    }

    // Validate newPassword rules (6 to 12 characters, with numbers or special chars)
    if (newPassword.length < 6 || newPassword.length > 12) {
      return res.status(400).json({ error: "Password must be between 6 and 12 characters." });
    }
    if (!/[0-9]/.test(newPassword) && !/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({ error: "Password must contain at least one number or special character." });
    }

    // Hash and update the password
    user.password = hashPassword(newPassword);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Reset password update error:", err);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

export default router;
