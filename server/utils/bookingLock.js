/**
 * bookingLock.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Helpers that make booking / payment writes safe under concurrency.
 *
 * Two ideas:
 *
 * 1. LOCK KEYS. A "check, then write" pair is never safe on its own — two
 *    requests can both pass the check. Instead we store a string key on the
 *    Booking and put a UNIQUE (partial) index on it, so MongoDB itself rejects
 *    the second writer with an E11000 error:
 *      • dupKey  = user + service + day   → one active booking per user/service/day
 *      • slotKey = service + day          → one approved booking per day, only for
 *                                           services with `autoBlockBooked` on
 *
 * 2. TRANSACTIONS (when the deployment supports them). Atlas and any replica
 *    set do. A standalone local mongod does not, so withTransaction() quietly
 *    falls back to running the same work without one — the single-document
 *    atomic updates used by the callers keep that path safe too.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require("mongoose");
const { dayKey } = require("./availability");

const dupKeyFor  = (userId, vendorId, date) => `${userId}:${vendorId}:${dayKey(date)}`;
const slotKeyFor = (vendorId, date)         => `${vendorId}:${dayKey(date)}`;

// true when a Mongo write failed on a unique index
const isDuplicateKeyError = (err) =>
  !!err && (err.code === 11000 || err.code === 11001);

// "this server can't do transactions" (standalone mongod), as opposed to a real failure
const isTransactionUnsupported = (err) =>
  !!err && (
    err.code === 20 ||
    err.codeName === "IllegalOperation" ||
    /transaction numbers are only allowed|replica set|does not support transactions/i.test(err.message || "")
  );

/**
 * Run `work(session)` inside a MongoDB transaction.
 *  • Commits if `work` returns, aborts if it throws.
 *  • `work` may run more than once (transient-error retry), so it must only
 *    touch the database — no emails, no responses, no external API calls.
 *  • On a server without transaction support, runs `work(null)` once instead.
 *    Pass the session straight into queries: `Model.find(q, null, { session })`
 *    and `{ session }` in update options both accept null.
 */
async function withTransaction(work) {
  let session;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    if (isTransactionUnsupported(err)) {
      // Nothing was committed (the error comes from the first operation), so re-running is safe.
      return work(null);
    }
    throw err;
  } finally {
    if (session) await session.endSession();
  }
}

module.exports = { dupKeyFor, slotKeyFor, isDuplicateKeyError, withTransaction };