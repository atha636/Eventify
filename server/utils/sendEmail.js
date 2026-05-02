const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Base sender ──────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const res = await resend.emails.send({
      from: "Evencers <noreply@evencers.com>",
      to,
      subject,
      html: html || `<pre style="font-family:sans-serif">${text}</pre>`,
      text,
    });
    return res;
  } catch (error) {
    console.error("❌ Email error:", error);
    throw error;
  }
};

// ── Shared style helpers ─────────────────────────────────────────────────────
const wrap = (body) => `
  <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#faf7f2;border:1px solid rgba(201,168,76,0.25);border-radius:12px;padding:40px 36px;">
    <div style="text-align:center;margin-bottom:28px;">
      <span style="font-size:1.2rem;letter-spacing:0.15em;color:#c9a84c;font-weight:600;">✦ EVENCERS</span>
    </div>
    ${body}
    <p style="color:#bbb4a8;font-size:11px;text-align:center;margin-top:24px;">— The Evencers Team</p>
  </div>`;

const row = (label, value) => `
  <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(201,168,76,0.1);font-size:13px;">
    <span style="color:#7a7265;">${label}</span>
    <span style="color:#0e0c0a;font-weight:500;">${value}</span>
  </div>`;

const badge = (text, color = "#2d6a4f", bg = "rgba(45,106,79,0.08)") =>
  `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${bg};color:${color};font-size:11px;font-weight:600;border:1px solid ${color}40;">${text}</span>`;

const goldBtn = (href, label) =>
  `<p style="text-align:center;margin-top:24px;">
    <a href="${href}" style="display:inline-block;padding:13px 28px;background:#c9a84c;color:#0e0c0a;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">${label}</a>
  </p>`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const fmtAmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const planLabel = (plan) =>
  plan === "25" ? "25% Book Date" : plan === "75" ? "75% Partial" : "100% Full (5% off)";

// ── 1. OTP emails (unchanged) ────────────────────────────────────────────────
const sendOTP = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Your Evencers Verification Code",
    html: wrap(`
      <h2 style="font-size:1.4rem;color:#0e0c0a;margin-bottom:8px;">Verify your email</h2>
      <p style="color:#7a7265;font-size:14px;line-height:1.6;margin-bottom:28px;">
        Use the code below. It expires in <strong>5 minutes</strong>.
      </p>
      <div style="text-align:center;background:#fff;border:1px solid rgba(201,168,76,0.3);border-radius:10px;padding:28px;margin-bottom:28px;">
        <span style="font-size:2.5rem;font-weight:700;letter-spacing:0.3em;color:#0e0c0a;">${otp}</span>
      </div>`),
  });
};

const sendResetOTP = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Reset Your Evencers Password",
    html: wrap(`
      <h2 style="font-size:1.4rem;color:#0e0c0a;margin-bottom:8px;">Reset your password</h2>
      <p style="color:#7a7265;font-size:14px;line-height:1.6;margin-bottom:28px;">
        Use the code below. It expires in <strong>10 minutes</strong>.
      </p>
      <div style="text-align:center;background:#fff;border:1px solid rgba(201,168,76,0.3);border-radius:10px;padding:28px;margin-bottom:28px;">
        <span style="font-size:2.5rem;font-weight:700;letter-spacing:0.3em;color:#0e0c0a;">${otp}</span>
      </div>`),
  });
};

// ── 2. Vendor verification (unchanged) ──────────────────────────────────────
const sendVendorVerificationRequest = async ({ vendorName, vendorEmail, adminEmail }) => {
  await sendEmail({
    to: adminEmail,
    subject: `New Vendor Awaiting Verification — ${vendorName}`,
    html: wrap(`
      <h2 style="font-size:1.4rem;color:#0e0c0a;margin-bottom:8px;">New Vendor Profile to Review</h2>
      <p style="color:#7a7265;font-size:14px;line-height:1.6;margin-bottom:20px;">
        <strong>${vendorName}</strong> (${vendorEmail}) is awaiting approval.
      </p>
      ${goldBtn(`${process.env.ADMIN_PANEL_URL || "https://eventfiy.vercel.app"}/admin`, "Review in Admin Panel →")}`),
  });
};

const sendVendorVerificationResult = async ({ vendorEmail, vendorName, approved, reason }) => {
  await sendEmail({
    to: vendorEmail,
    subject: approved ? "🎉 Your Evencers Vendor Profile is Approved!" : "Your Evencers Vendor Profile — Action Required",
    html: wrap(approved
      ? `<h2 style="font-size:1.4rem;color:#0e0c0a;margin-bottom:8px;">You're Live on Evencers!</h2>
         <p style="color:#7a7265;font-size:14px;line-height:1.6;margin-bottom:20px;">Hi <strong>${vendorName}</strong>, your profile has been <strong style="color:#2d6a4f;">approved</strong>.</p>
         ${goldBtn(`${process.env.ADMIN_PANEL_URL || "https://eventfiy.vercel.app"}/vendor-dashboard`, "Go to My Dashboard →")}`
      : `<h2 style="font-size:1.4rem;color:#0e0c0a;margin-bottom:8px;">Profile Review Update</h2>
         <p style="color:#7a7265;font-size:14px;line-height:1.6;">Hi <strong>${vendorName}</strong>, we were unable to approve your profile at this time.</p>
         ${reason ? `<div style="background:#fff3f3;border:1px solid rgba(184,92,92,0.25);border-radius:8px;padding:16px;margin:16px 0;"><p style="font-size:13px;color:#b85c5c;margin:0;"><strong>Reason:</strong> ${reason}</p></div>` : ""}`),
  });
};

// ── 3. Payment Plan — Installment Receipt ────────────────────────────────────
// Sent to user after any installment is successfully paid
const sendInstallmentReceiptEmail = async (user, booking, payment) => {
  const plan      = booking.paymentPlan || "100";
  const instNum   = payment.installmentNumber || 1;
  const instPct   = payment.installmentPercentage || 100;
  const remaining = booking.packagePrice - booking.totalPaid;

  // Build "what's remaining" block
  let remainingHtml = "";
  if (plan === "25") {
    const pendingInst = (booking.installments || []).filter(i => i.status !== "paid");
    if (pendingInst.length > 0) {
      remainingHtml = `
        <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:16px;margin-top:16px;">
          <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#7a7265;margin:0 0 10px;">Remaining Payments</p>
          ${pendingInst.map(i => `
            <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid rgba(201,168,76,0.08);">
              <span style="color:#7a7265;">Installment ${i.installmentNumber} (${i.percentage}%)
                ${i.installmentNumber === 2 ? " · Before Event" : " · After Event"}
              </span>
              <span style="color:#0e0c0a;font-weight:500;">${fmtAmt(i.amount)}</span>
            </div>`).join("")}
        </div>`;
    }
  } else if (plan === "75") {
    const lastInst = (booking.installments || [])[1];
    if (lastInst && lastInst.status !== "paid") {
      remainingHtml = `
        <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:14px;margin-top:16px;">
          <p style="font-size:13px;color:#7a7265;margin:0;">
            Remaining <strong style="color:#0e0c0a;">${fmtAmt(lastInst.amount)} (25%)</strong> is due after your event is confirmed by both you and the vendor.
          </p>
        </div>`;
    }
  }

  const discountNote = plan === "100"
    ? `<p style="font-size:12px;color:#2d6a4f;margin-top:8px;">✓ 5% discount applied — you saved ${fmtAmt(booking.packagePrice * 0.05)}</p>`
    : "";

  await sendEmail({
    to: user.email,
    subject: `Payment Received — ${fmtAmt(payment.amount)} (Installment ${instNum}) ✓`,
    html: wrap(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:60px;height:60px;background:rgba(45,106,79,0.1);border:1.5px solid rgba(45,106,79,0.3);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:1.8rem;">✓</div>
      </div>
      <h2 style="font-size:1.5rem;color:#0e0c0a;margin-bottom:4px;text-align:center;">Payment Confirmed!</h2>
      <p style="color:#7a7265;font-size:13px;text-align:center;margin-bottom:24px;">
        Installment ${instNum} of your <strong>${planLabel(plan)}</strong> plan has been received.
      </p>
      <div style="background:#fff;border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:16px;margin-bottom:16px;">
        ${row("Service",      booking.vendorName || "Your Service")}
        ${row("Event Date",   fmtDate(booking.date))}
        ${row("Package",      booking.packageName || "—")}
        ${row("Amount Paid",  `<strong style="color:#c9a84c;font-size:1.1rem;">${fmtAmt(payment.amount)}</strong>`)}
        ${row("Installment",  `${instNum} of ${booking.installments?.length || 1} (${instPct}%)`)}
        ${row("Payment ID",   `<span style="font-family:monospace;font-size:11px;">${payment.paymentId || "—"}</span>`)}
        ${row("Booking Status", badge("Confirmed ✓"))}
      </div>
      ${discountNote}
      ${remainingHtml}
      ${goldBtn(`${process.env.FRONTEND_URL || "https://eventfiy.vercel.app"}/my-bookings`, "View My Bookings →")}
    `),
  });
};

// ── 4. Pre-Event Reminder — for 25% plan, 50% installment ────────────────────
// Sent by cron 2–3 days before event
const sendPaymentReminderEmail = async (user, booking) => {
  const inst2 = booking.installments?.[1];
  if (!inst2) return;

  const daysLeft = Math.ceil((new Date(booking.date) - new Date()) / (1000 * 60 * 60 * 24));
  const payUrl   = `${process.env.FRONTEND_URL || "https://eventfiy.vercel.app"}/my-bookings`;

  await sendEmail({
    to: user.email,
    subject: `⏰ Action Required — Pay 50% Before Your Event (${daysLeft} day${daysLeft !== 1 ? "s" : ""} left)`,
    html: wrap(`
      <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.3);border-radius:10px;padding:16px;margin-bottom:20px;text-align:center;">
        <p style="font-size:1.6rem;margin:0;">📅</p>
        <p style="font-size:14px;font-weight:600;color:#0e0c0a;margin:8px 0 0;">
          Your event is in <strong style="color:#c9a84c;">${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong>!
        </p>
      </div>
      <h2 style="font-size:1.4rem;color:#0e0c0a;margin-bottom:8px;">50% Installment Due</h2>
      <p style="color:#7a7265;font-size:13.5px;line-height:1.7;margin-bottom:20px;">
        Hi <strong>${user.name}</strong>, your event is coming up soon. Please pay the 50% installment to keep your booking active.
      </p>
      <div style="background:#fff;border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:16px;margin-bottom:16px;">
        ${row("Event Date",    fmtDate(booking.date))}
        ${row("Amount Due",    `<strong style="color:#c9a84c;font-size:1.1rem;">${fmtAmt(inst2.amount)}</strong>`)}
        ${row("Installment",   "2 of 3 · 50%")}
        ${row("Already Paid",  fmtAmt(booking.totalPaid))}
      </div>
      <div style="background:rgba(169,50,38,0.05);border:1px solid rgba(169,50,38,0.2);border-radius:8px;padding:12px;margin-bottom:16px;">
        <p style="font-size:12.5px;color:#a93226;margin:0;">⚠ Please pay before your event date to avoid cancellation.</p>
      </div>
      ${goldBtn(payUrl, "Pay Now — " + fmtAmt(inst2.amount) + " →")}
    `),
  });
};

// ── 5. Event Confirmed → Final Payment Request ───────────────────────────────
// Sent when both vendor + user confirm the event happened
const sendFinalPaymentRequestEmail = async (user, booking) => {
  const finalInst = booking.installments?.find(i => i.status !== "paid");
  if (!finalInst) return;
  const payUrl = `${process.env.FRONTEND_URL || "https://eventfiy.vercel.app"}/my-bookings`;

  await sendEmail({
    to: user.email,
    subject: `🎉 Event Complete! Final Payment of ${fmtAmt(finalInst.amount)} Due`,
    html: wrap(`
      <div style="text-align:center;margin-bottom:20px;">
        <div style="width:64px;height:64px;background:rgba(45,106,79,0.1);border:1.5px solid rgba(45,106,79,0.3);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:2rem;">🎊</div>
      </div>
      <h2 style="font-size:1.5rem;color:#0e0c0a;margin-bottom:8px;text-align:center;">Your Event Was a Success!</h2>
      <p style="color:#7a7265;font-size:13.5px;line-height:1.7;margin-bottom:20px;">
        Hi <strong>${user.name}</strong>, your event has been confirmed by both you and the vendor. 
        Please pay the final installment to complete your booking.
      </p>
      <div style="background:#fff;border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:16px;margin-bottom:16px;">
        ${row("Service",        booking.vendorName || "Your Service")}
        ${row("Event Date",     fmtDate(booking.date))}
        ${row("Final Amount",   `<strong style="color:#c9a84c;font-size:1.1rem;">${fmtAmt(finalInst.amount)}</strong>`)}
        ${row("Installment",    `${finalInst.installmentNumber} of ${booking.installments?.length} · ${finalInst.percentage}%`)}
        ${row("Already Paid",   fmtAmt(booking.totalPaid))}
      </div>
      ${goldBtn(payUrl, "Pay Final Amount — " + fmtAmt(finalInst.amount) + " →")}
      <p style="color:#7a7265;font-size:12px;text-align:center;margin-top:12px;">
        You can also leave a review for the vendor once the final payment is complete.
      </p>
    `),
  });
};

// ── 6. Vendor notification of new paid booking ───────────────────────────────
const sendVendorNewBookingEmail = async (vendorUser, booking, user, payment) => {
  const plan = booking.paymentPlan || "100";
  await sendEmail({
    to: vendorUser.email,
    subject: `New Paid Booking — ${fmtAmt(payment.amount)} Received 🎉`,
    html: wrap(`
      <h2 style="font-size:1.4rem;color:#0e0c0a;margin-bottom:8px;">You Have a New Confirmed Booking!</h2>
      <p style="color:#7a7265;font-size:13.5px;line-height:1.7;margin-bottom:20px;">
        <strong>${user.name}</strong> has booked your service and completed their first payment.
      </p>
      <div style="background:#fff;border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:16px;margin-bottom:16px;">
        ${row("Customer",     user.name)}
        ${row("Phone",        booking.userDetails?.phone || "—")}
        ${row("Event Date",   fmtDate(booking.date))}
        ${row("Package",      booking.packageName || "—")}
        ${row("Package Price",fmtAmt(booking.packagePrice))}
        ${row("Amount Paid",  `<strong style="color:#c9a84c;">${fmtAmt(payment.amount)}</strong>`)}
        ${row("Payment Plan", planLabel(plan))}
        ${row("Address",      booking.userDetails?.address || "—")}
      </div>
      ${goldBtn(`${process.env.FRONTEND_URL || "https://eventfiy.vercel.app"}/vendor-dashboard`, "View in Dashboard →")}
    `),
  });
};

// ── 7. Event confirmation nudge to vendor/user ───────────────────────────────
const sendEventConfirmationNudge = async (toEmail, toName, booking, role) => {
  const dashUrl = role === "vendor"
    ? `${process.env.FRONTEND_URL || "https://eventfiy.vercel.app"}/vendor-dashboard`
    : `${process.env.FRONTEND_URL || "https://eventfiy.vercel.app"}/my-bookings`;

  await sendEmail({
    to: toEmail,
    subject: "Please Confirm Your Event is Complete ✓",
    html: wrap(`
      <h2 style="font-size:1.4rem;color:#0e0c0a;margin-bottom:8px;">Confirm Event Completion</h2>
      <p style="color:#7a7265;font-size:13.5px;line-height:1.7;margin-bottom:20px;">
        Hi <strong>${toName}</strong>, your event on <strong>${fmtDate(booking.date)}</strong> should be complete. 
        Please confirm in your ${role === "vendor" ? "vendor dashboard" : "bookings page"} to ${role === "vendor" ? "allow the client to be notified for final payment" : "trigger the final payment process"}.
      </p>
      ${goldBtn(dashUrl, role === "vendor" ? "Confirm in Dashboard →" : "Confirm in My Bookings →")}
    `),
  });
};

module.exports = {
  sendEmail,
  sendOTP,
  sendResetOTP,
  sendVendorVerificationRequest,
  sendVendorVerificationResult,
  // ── NEW ──
  sendInstallmentReceiptEmail,
  sendPaymentReminderEmail,
  sendFinalPaymentRequestEmail,
  sendVendorNewBookingEmail,
  sendEventConfirmationNudge,
};
