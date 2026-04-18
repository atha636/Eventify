
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: `"Evencers" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

const sendOTP = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Your Evencers Verification Code",
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#faf7f2;border:1px solid rgba(201,168,76,0.25);border-radius:12px;padding:40px 36px;">
        <div style="text-align:center;margin-bottom:28px;">
          <span style="font-size:1.2rem;letter-spacing:0.15em;color:#c9a84c;font-weight:600;"> EVENCERS</span>
        </div>
        <h2 style="font-size:1.4rem;color:#0e0c0a;margin-bottom:8px;">Verify your email</h2>
        <p style="color:#7a7265;font-size:14px;line-height:1.6;margin-bottom:28px;">
          Use the code below to complete your registration. It expires in <strong>5 minutes</strong>.
        </p>
        <div style="text-align:center;background:#fff;border:1px solid rgba(201,168,76,0.3);border-radius:10px;padding:28px;margin-bottom:28px;">
          <span style="font-size:2.5rem;font-weight:700;letter-spacing:0.3em;color:#0e0c0a;">${otp}</span>
        </div>
        <p style="color:#bbb4a8;font-size:12px;text-align:center;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

const sendResetOTP = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Reset Your Evencers Password",
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#faf7f2;border:1px solid rgba(201,168,76,0.25);border-radius:12px;padding:40px 36px;">
        <div style="text-align:center;margin-bottom:28px;">
          <span style="font-size:1.2rem;letter-spacing:0.15em;color:#c9a84c;font-weight:600;"> EVENCERS</span>
        </div>
        <h2 style="font-size:1.4rem;color:#0e0c0a;margin-bottom:8px;">Reset your password</h2>
        <p style="color:#7a7265;font-size:14px;line-height:1.6;margin-bottom:28px;">
          Use the code below to reset your password. It expires in <strong>10 minutes</strong>.
        </p>
        <div style="text-align:center;background:#fff;border:1px solid rgba(201,168,76,0.3);border-radius:10px;padding:28px;margin-bottom:28px;">
          <span style="font-size:2.5rem;font-weight:700;letter-spacing:0.3em;color:#0e0c0a;">${otp}</span>
        </div>
        <p style="color:#7a7265;font-size:13px;margin-bottom:6px;">Didn't request a password reset?</p>
        <p style="color:#bbb4a8;font-size:12px;">
          Your account is safe. Simply ignore this email and your password will not be changed.
        </p>
      </div>
    `,
  });
};

// ─────────────────────────────────────────────────────────────────────
// NEW — Notify admin that a vendor is awaiting profile verification
// ─────────────────────────────────────────────────────────────────────
const sendVendorVerificationRequest = async ({ vendorName, vendorEmail, adminEmail }) => {
  await sendEmail({
    to: adminEmail,
    subject: `New Vendor Awaiting Verification — ${vendorName}`,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#faf7f2;border:1px solid rgba(201,168,76,0.25);border-radius:12px;padding:40px 36px;">
        <div style="text-align:center;margin-bottom:28px;">
          <span style="font-size:1.2rem;letter-spacing:0.15em;color:#c9a84c;font-weight:600;"> EVENCERS ADMIN</span>
        </div>
        <h2 style="font-size:1.4rem;color:#0e0c0a;margin-bottom:8px;">New Vendor Profile to Review</h2>
        <p style="color:#7a7265;font-size:14px;line-height:1.6;margin-bottom:20px;">
          A new vendor has registered and is awaiting your approval before they can go live on Evencers.
        </p>
        <div style="background:#fff;border:1px solid rgba(201,168,76,0.25);border-radius:10px;padding:20px;margin-bottom:24px;">
          <p style="font-size:13px;color:#0e0c0a;margin:0 0 6px;"><strong>Name:</strong> ${vendorName}</p>
          <p style="font-size:13px;color:#0e0c0a;margin:0;"><strong>Email:</strong> ${vendorEmail}</p>
        </div>
        <p style="text-align:center;">
          <a href="${process.env.ADMIN_PANEL_URL || "https://eventfiy.vercel.app"}/admin"
             style="display:inline-block;padding:13px 28px;background:#c9a84c;color:#0e0c0a;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;letter-spacing:0.04em;">
            Review in Admin Panel →
          </a>
        </p>
        <p style="color:#bbb4a8;font-size:11px;text-align:center;margin-top:20px;">
          This is an automated notification from Evencers.
        </p>
      </div>
    `,
  });
};

// ─────────────────────────────────────────────────────────────────────
// NEW — Notify vendor of approval decision
// ─────────────────────────────────────────────────────────────────────
const sendVendorVerificationResult = async ({ vendorEmail, vendorName, approved, reason }) => {
  const subject = approved
    ? "🎉 Your Evencers Vendor Profile is Approved!"
    : "Your Evencers Vendor Profile — Action Required";

  const bodyHtml = approved
    ? `
      <h2 style="font-size:1.4rem;color:#0e0c0a;margin-bottom:8px;">You're Live on Evencers!</h2>
      <p style="color:#7a7265;font-size:14px;line-height:1.6;margin-bottom:20px;">
        Hi <strong>${vendorName}</strong>, your vendor profile has been <strong style="color:#2d6a4f;">approved</strong> by our team.
        You can now add services and start accepting bookings from clients.
      </p>
      <p style="text-align:center;">
        <a href="${process.env.ADMIN_PANEL_URL || "https://eventfiy.vercel.app"}/vendor-dashboard"
           style="display:inline-block;padding:13px 28px;background:#c9a84c;color:#0e0c0a;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">
          Go to My Dashboard →
        </a>
      </p>
    `
    : `
      <h2 style="font-size:1.4rem;color:#0e0c0a;margin-bottom:8px;">Profile Review Update</h2>
      <p style="color:#7a7265;font-size:14px;line-height:1.6;margin-bottom:16px;">
        Hi <strong>${vendorName}</strong>, after reviewing your vendor profile, we were unable to approve it at this time.
      </p>
      ${reason ? `
      <div style="background:#fff3f3;border:1px solid rgba(184,92,92,0.25);border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="font-size:13px;color:#b85c5c;margin:0;"><strong>Reason:</strong> ${reason}</p>
      </div>` : ""}
      <p style="color:#7a7265;font-size:13px;line-height:1.6;">
        Please contact our support team at <a href="mailto:${process.env.EMAIL_USER}" style="color:#c9a84c;">${process.env.EMAIL_USER}</a> if you have any questions or would like to reapply.
      </p>
    `;

  await sendEmail({
    to: vendorEmail,
    subject,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#faf7f2;border:1px solid rgba(201,168,76,0.25);border-radius:12px;padding:40px 36px;">
        <div style="text-align:center;margin-bottom:28px;">
          <span style="font-size:1.2rem;letter-spacing:0.15em;color:#c9a84c;font-weight:600;"> EVENCERS</span>
        </div>
        ${bodyHtml}
        <p style="color:#bbb4a8;font-size:11px;text-align:center;margin-top:24px;">
          — The Evencers Team
        </p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendOTP,
  sendResetOTP,
  sendVendorVerificationRequest,   // ← NEW
  sendVendorVerificationResult,    // ← NEW
};