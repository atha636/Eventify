/**
 * installmentScheduler.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs every day at 8 AM and sends reminder emails for the 25% payment plan.
 *
 * Rule: For bookings with paymentPlan === "25" where installment 2 (50%) is
 *       still pending, send a daily reminder from 3 days before the event
 *       until the event date (or until it's paid).
 *
 * HOW TO START:
 *   Require this file once in server.js:
 *       require("./utils/installmentScheduler");
 *
 * DEPENDENCIES:
 *   npm install node-cron
 * ─────────────────────────────────────────────────────────────────────────────
 */

const cron    = require("node-cron");
const Booking = require("../models/Booking");
const User    = require("../models/User");
const Vendor  = require("../models/Vendor");
const { sendEmail } = require("./sendEmail");

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if date d is between 0 and maxDays days from now (inclusive). */
function isWithinDays(eventDate, maxDays) {
  const now      = new Date();
  now.setHours(0, 0, 0, 0);
  const event    = new Date(eventDate);
  event.setHours(0, 0, 0, 0);
  const diffMs   = event.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  return diffDays >= 0 && diffDays <= maxDays;
}

/** Returns days remaining until event (can be negative if past). */
function daysUntilEvent(eventDate) {
  const now   = new Date();
  now.setHours(0, 0, 0, 0);
  const event = new Date(eventDate);
  event.setHours(0, 0, 0, 0);
  return Math.floor((event.getTime() - now.getTime()) / 86_400_000);
}

// ── Core logic ───────────────────────────────────────────────────────────────

async function sendMidInstallmentReminders() {
  console.log("[Scheduler] Running mid-installment reminder check…");

  try {
    // Find all 25%-plan bookings where installment 2 is still pending/link_sent
    const bookings = await Booking.find({
      paymentPlan: "25",
      status:      "approved",
      "installments.1.status": { $in: ["pending", "link_sent"] },
    }).populate("userId", "name email");

    let sent = 0;

    for (const booking of bookings) {
      try {
        // Only send reminder if event is within the next 3 days
        if (!isWithinDays(booking.date, 3)) continue;

        const days = daysUntilEvent(booking.date);
        const user = booking.userId;
        if (!user?.email) continue;

        const inst2 = booking.installments.find((i) => i.installmentNumber === 2);
        if (!inst2 || inst2.status === "paid") continue;

        // Update reminder tracking on the booking
        booking.lastReminderSentAt = new Date();
        booking.reminderSentCount  = (booking.reminderSentCount || 0) + 1;

        // Mark as link_sent if not already
        if (inst2.status === "pending") {
          const instIdx = booking.installments.findIndex((i) => i.installmentNumber === 2);
          booking.installments[instIdx].status = "link_sent";
        }

        await booking.save();

        const urgencyLabel = days === 0
          ? "TODAY is your event! ⚠"
          : days === 1
          ? "Tomorrow is your event!"
          : `Only ${days} day${days === 1 ? "" : "s"} left!`;

        await sendEmail({
          to:      user.email,
          subject: `⚠ Payment Reminder — ₹${inst2.amount.toLocaleString("en-IN")} Due Before Your Event`,
          text: [
            `Hello ${user.name},`,
            ``,
            `This is a reminder that your mid-event payment is due.`,
            ``,
            `📅 ${urgencyLabel}`,
            ``,
            `Event Date : ${new Date(booking.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
            `Package    : ${booking.packageName}`,
            ``,
            `Amount Due (50%) : ₹${inst2.amount.toLocaleString("en-IN")}`,
            ``,
            `Please log in and complete the payment to keep your booking active:`,
            `https://evencers.com/my-bookings`,
            ``,
            `— Evencers Team`,
          ].join("\n"),
        });

        sent++;
        console.log(`[Scheduler] Reminder sent to ${user.email} (booking ${booking._id})`);

      } catch (innerErr) {
        console.error(`[Scheduler] Error processing booking ${booking._id}:`, innerErr);
      }
    }

    console.log(`[Scheduler] Mid-installment reminders done. Sent: ${sent}`);

  } catch (err) {
    console.error("[Scheduler] Fatal error in reminder job:", err);
  }
}

// ── Schedule: every day at 8:00 AM ──────────────────────────────────────────
//
// Cron syntax: second(opt) minute hour day month weekday
// "0 8 * * *" = at 08:00 every day
//
cron.schedule("0 8 * * *", sendMidInstallmentReminders, {
  timezone: "Asia/Kolkata",
});

console.log("[Scheduler] Mid-installment reminder cron registered (daily 08:00 IST)");

// Export for manual testing / seeding
module.exports = { sendMidInstallmentReminders };