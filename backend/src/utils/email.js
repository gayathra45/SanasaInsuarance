import nodemailer from "nodemailer";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config({ override: true });

export async function sendEmail(toEmail, subject, htmlBody, textBody) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const senderEmail = process.env.SENDER_EMAIL || "codemapper71@gmail.com";
  const resendKey = process.env.RESEND_API_KEY;

  // 1. Check for Mailtrap / Custom SMTP
  const hasCustomSmtp = smtpHost && smtpUser && smtpPass &&
                        !smtpHost.includes("your-") &&
                        !smtpUser.includes("your-") &&
                        !smtpPass.includes("your-");

  if (hasCustomSmtp) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: smtpPort == 465, // true for 465, false for others
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.sendMail({
      from: `"Sanasa Insurance" <${senderEmail}>`,
      to: toEmail,
      subject,
      html: htmlBody,
      text: textBody,
    });
    console.log(`✅ Email sent to ${toEmail} via SMTP Server (${smtpHost})`);
    return { sent: true };
  }

  // 2. Fallback: Check for legacy Gmail SMTP
  const hasGmail = smtpUser && smtpPass &&
                   smtpUser.includes("@gmail.com") &&
                   !smtpUser.includes("your-gmail") &&
                   !smtpPass.includes("your-16-char");

  if (hasGmail) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.sendMail({
      from: `"Sanasa Insurance" <${smtpUser}>`,
      to: toEmail,
      subject,
      html: htmlBody,
      text: textBody,
    });
    console.log(`✅ Email sent to ${toEmail} via Gmail SMTP`);
    return { sent: true };
  }

  // 3. Fallback: Check for Resend
  const hasResend = resendKey && !resendKey.includes("re_your");
  if (hasResend) {
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: "Sanasa Insurance <onboarding@resend.dev>",
      to: [toEmail],
      subject,
      html: htmlBody,
      text: textBody,
    });
    if (error) throw new Error(error.message || "Resend failed.");
    console.log(`✅ Email sent to ${toEmail} via Resend`);
    return { sent: true };
  }

  console.warn("⚠️ No email credentials configured — Dev Mode.");
  return { sent: false, error: "Email credentials not configured in backend/.env" };
}
