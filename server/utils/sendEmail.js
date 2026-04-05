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
    from: `"Eventify" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

const sendOTP = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Your Eventify Verification Code",
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#faf7f2;border:1px solid rgba(201,168,76,0.25);border-radius:12px;padding:40px 36px;">
        <div style="text-align:center;margin-bottom:28px;">
          <span style="font-size:1.2rem;letter-spacing:0.15em;color:#c9a84c;font-weight:600;">✦ EVENTIFY</span>
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
    subject: "Reset Your Eventify Password",
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#faf7f2;border:1px solid rgba(201,168,76,0.25);border-radius:12px;padding:40px 36px;">
        <div style="text-align:center;margin-bottom:28px;">
          <span style="font-size:1.2rem;letter-spacing:0.15em;color:#c9a84c;font-weight:600;">✦ EVENTIFY</span>
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

module.exports = { sendEmail, sendOTP, sendResetOTP };