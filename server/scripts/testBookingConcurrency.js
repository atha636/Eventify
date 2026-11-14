/**
 * testBookingConcurrency.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fires many simultaneous requests at the new booking/payment guards and checks
 * that exactly one wins. Needs a REAL MongoDB.
 *
 *   TEST_MONGO_URI="mongodb://127.0.0.1:27017/evencers_test" node scripts/testBookingConcurrency.js
 *
 * SAFETY: it wipes the Booking collection and drops the database at the end, so it
 * refuses to run unless the database name contains "test". Never point it at production.
 * ─────────────────────────────────────────────────────────────────────────────
 */
require("dotenv").config();
const assert   = require("assert");
const mongoose = require("mongoose");
const Booking  = require("../models/Booking");
const { dupKeyFor, slotKeyFor, isDuplicateKeyError } = require("../utils/bookingLock");

const uri = process.env.TEST_MONGO_URI;
if (!uri) {
  console.error('Set TEST_MONGO_URI to a THROWAWAY database whose name contains "test".');
  process.exit(1);
}

const oid  = () => new mongoose.Types.ObjectId();
const date = new Date("2030-01-15T00:00:00.000Z");
const settled = (arr) => Promise.allSettled(arr);
const wins    = (r) => r.filter((x) => x.status === "fulfilled" && x.value).length;
const dupFails = (r) => r.filter((x) => x.status === "rejected" && isDuplicateKeyError(x.reason)).length;

(async () => {
  await mongoose.connect(uri);
  if (!/test/i.test(mongoose.connection.name)) {
    console.error(`Refusing to run: database "${mongoose.connection.name}" doesn't look like a test database.`);
    process.exit(1);
  }
  await Booking.deleteMany({});
  await Booking.syncIndexes();

  // 1) Double-click: same customer, same service, same day, 10 at once → 1 booking
  {
    const user = oid(), vendor = oid();
    const r = await settled(Array.from({ length: 10 }, () =>
      Booking.create({ userId: user, vendorId: vendor, date, dupKey: dupKeyFor(user, vendor, date) })));
    assert.strictEqual(wins(r.map((x) => ({ ...x, value: x.status === "fulfilled" }))), 1, "exactly one duplicate booking may be created");
    assert.strictEqual(dupFails(r), 9);
    console.log("PASS 1  10 simultaneous identical bookings → 1 created, 9 rejected");
  }

  // 2) Vendor approves several requests for the same day at once → only 1 approved
  {
    const vendor = oid();
    const bookings = [];
    for (let i = 0; i < 5; i++) {
      const user = oid();
      bookings.push(await Booking.create({ userId: user, vendorId: vendor, date, status: "pending", dupKey: dupKeyFor(user, vendor, date) }));
    }
    const r = await settled(bookings.map((b) =>
      Booking.findOneAndUpdate({ _id: b._id, status: "pending" }, { $set: { status: "approved", slotKey: slotKeyFor(vendor, date) } }, { new: true })));
    assert.strictEqual(wins(r), 1, "only one booking may be approved for a day");
    assert.strictEqual(dupFails(r), 4);
    assert.strictEqual(await Booking.countDocuments({ vendorId: vendor, status: "approved" }), 1);
    console.log("PASS 2  5 simultaneous approvals for one day → 1 approved, 4 rejected");
  }

  // 3) Same installment paid through 5 duplicate orders at once → counted once
  {
    const b = await Booking.create({
      userId: oid(), vendorId: oid(), date, status: "approved", totalPaid: 0,
      installments: [{ installmentNumber: 1, percentage: 95, amount: 5000, status: "pending" }],
    });
    const pay = () => Booking.findOneAndUpdate(
      { _id: b._id, status: "approved", installments: { $elemMatch: { installmentNumber: 1, status: { $ne: "paid" } } } },
      { $set: { "installments.$[inst].status": "paid" }, $inc: { totalPaid: 5000 } },
      { new: true, arrayFilters: [{ "inst.installmentNumber": 1 }] });
    const r = await settled(Array.from({ length: 5 }, pay));
    assert.strictEqual(wins(r), 1, "an installment may be credited only once");
    assert.strictEqual((await Booking.findById(b._id)).totalPaid, 5000, "totalPaid must not be double-counted");
    console.log("PASS 3  5 simultaneous payments for one installment → credited once (totalPaid = 5000)");
  }

  // 4) Cancel racing a payment, 50 rounds → never "cancelled" AND paid
  {
    for (let i = 0; i < 50; i++) {
      const b = await Booking.create({
        userId: oid(), vendorId: oid(), date, status: "approved", totalPaid: 0,
        installments: [{ installmentNumber: 1, percentage: 95, amount: 5000, status: "pending" }],
      });
      await settled([
        Booking.findOneAndUpdate({ _id: b._id, status: { $in: ["pending", "approved"] }, totalPaid: { $not: { $gt: 0 } } }, { $set: { status: "cancelled" } }),
        Booking.findOneAndUpdate(
          { _id: b._id, status: "approved", installments: { $elemMatch: { installmentNumber: 1, status: { $ne: "paid" } } } },
          { $set: { "installments.$[inst].status": "paid" }, $inc: { totalPaid: 5000 } },
          { arrayFilters: [{ "inst.installmentNumber": 1 }] }),
      ]);
      const f = await Booking.findById(b._id);
      assert(!(f.status === "cancelled" && f.totalPaid > 0), `round ${i}: booking is cancelled but has money paid`);
    }
    console.log("PASS 4  cancel vs. payment race × 50 → never cancelled-with-money");
  }

  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  console.log("\nAll concurrency checks passed.");
})().catch(async (e) => {
  console.error("\nFAIL:", e.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});