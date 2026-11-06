const Booking = require("../models/Booking");

// Extra discount a customer gets when they use the code of the vendor they are booking.
const PROMO_PERCENT = 5;

const normalizeCode = (c) => String(c ?? "").trim().toUpperCase().replace(/\s+/g, "");

/**
 * Can this customer use `code` on this service?
 *   service  – Vendor doc with `vendorId` populated (the owning User, so we can read vendorCode)
 *   userId   – the customer
 * Returns { ok:true, code, percent, ownerId, vendorName } or { ok:false, error }.
 *
 * Rules
 *  • the code must be the code of the vendor who owns THIS service (keeps it a "my clients" code)
 *  • a customer can use a given code once; if that booking was rejected or cancelled the code is free again
 */
async function checkPromo({ code, service, userId }) {
  const c = normalizeCode(code);
  if (!c) return { ok: false, error: "Enter a vendor code." };
  if (!/^[A-Z0-9]{4,12}$/.test(c)) return { ok: false, error: "That code doesn't look right." };

  const owner = service?.vendorId;                 // populated User
  const ownerCode = normalizeCode(owner?.vendorCode);
  if (!owner || !ownerCode || ownerCode !== c) {
    return { ok: false, error: "This code isn't valid for this vendor. Use the code the vendor shared with you." };
  }
  if (String(owner._id) === String(userId)) return { ok: false, error: "You can't use your own code." };

  const used = await Booking.exists({
    userId, "promo.code": c, status: { $in: ["pending", "approved"] },
  });
  if (used) return { ok: false, error: "You've already used this code on another booking." };

  return { ok: true, code: c, percent: PROMO_PERCENT, ownerId: owner._id, vendorName: owner.name || "this vendor" };
}

module.exports = { PROMO_PERCENT, normalizeCode, checkPromo };