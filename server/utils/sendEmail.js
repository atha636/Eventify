const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ GENERIC EMAIL FUNCTION (for booking, service, etc.)
const sendEmail = async ({ to, subject, text, html }) => {
  await transporter.sendMail({
    from: `"Eventify" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

// ✅ OTP EMAIL (keep this)
const sendOTP = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    html: `
      <h2>Your OTP Code</h2>
      <p>Your verification code is:</p>
      <h1>${otp}</h1>
      <p>This code expires in 5 minutes.</p>
    `,
  });
};

module.exports = {
  sendEmail,
  sendOTP,
};