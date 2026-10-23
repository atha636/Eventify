import { useEffect, useState, useCallback } from "react";
import {
  getVendorReviews,
  getMyReviewStatus,
  submitReview,
  deleteReview,
  replyToReview,
} from "../services/reviewService";

// ── Star display (read-only) ────────────────────────────────────────────
function StarRow({ value, size = 14 }) {
  const rounded = Math.round(value || 0);
  return (
    <span className="rv-stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? "rv-star on" : "rv-star"}>★</span>
      ))}
    </span>
  );
}

// ── Star picker (interactive, for the write-review form) ───────────────
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="rv-picker">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= (hover || value) ? "rv-pick-star on" : "rv-pick-star"}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

// ── Main section ─────────────────────────────────────────────────────────
// Props:
//   vendorId   — the service/vendor doc id (required)
//   isLoggedIn — bool, whether a user is logged in
//   isOwner    — bool, whether the logged-in user IS the vendor who owns
//                this listing (shows reply controls instead of a review form)
export default function ReviewsSection({ vendorId, isLoggedIn, isOwner }) {
  const [data, setData]       = useState(null);   // { reviews, total, pages, rating, reviewCount, breakdown }
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [myStatus, setMyStatus] = useState(null); // { review, canReview, bookingId }
  const [formRating, setFormRating]   = useState(0);
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [formMsg, setFormMsg]         = useState("");

  const [replyDrafts, setReplyDrafts] = useState({}); // { [reviewId]: text }
  const [replyingId, setReplyingId]   = useState(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await getVendorReviews(vendorId, p, 10);
      setData(res);
      setPage(p);
    } catch (err) {
      setError(typeof err === "string" ? err : "Couldn't load reviews.");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => { if (vendorId) load(1); }, [vendorId, load]);

  useEffect(() => {
    if (!vendorId || !isLoggedIn || isOwner) return;
    getMyReviewStatus(vendorId)
      .then((res) => {
        setMyStatus(res);
        if (res.review) {
          setFormRating(res.review.rating);
          setFormComment(res.review.comment || "");
        }
      })
      .catch(() => {});
  }, [vendorId, isLoggedIn, isOwner]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formRating) { setFormMsg("Please select a star rating."); return; }
    setSubmitting(true);
    setFormMsg("");
    try {
      await submitReview(vendorId, formRating, formComment);
      setFormMsg("Thanks — your review is live!");
      await load(1);
      const refreshed = await getMyReviewStatus(vendorId);
      setMyStatus(refreshed);
    } catch (err) {
      setFormMsg(typeof err === "string" ? err : "Couldn't submit your review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myStatus?.review) return;
    if (!window.confirm("Delete your review?")) return;
    try {
      await deleteReview(myStatus.review._id);
      setFormRating(0);
      setFormComment("");
      setMyStatus((s) => ({ ...s, review: null }));
      await load(1);
    } catch {
      setFormMsg("Couldn't delete your review.");
    }
  };

  const handleReply = async (reviewId) => {
    const text = (replyDrafts[reviewId] || "").trim();
    if (!text) return;
    setReplyingId(reviewId);
    try {
      await replyToReview(reviewId, text);
      setReplyDrafts((d) => ({ ...d, [reviewId]: "" }));
      await load(page);
    } catch {
      // swallow — inline error not critical for a reply box
    } finally {
      setReplyingId(null);
    }
  };

  const avg   = data?.rating || 0;
  const count = data?.reviewCount || 0;
  const breakdown = data?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <div className="rv-section">
      <style>{reviewStyles}</style>
      <h2 className="vd-section-label">Reviews</h2>

      {/* ── Summary ── */}
      <div className="rv-summary">
        <div className="rv-summary-score">
          <span className="rv-big-num">{avg ? avg.toFixed(1) : "—"}</span>
          <StarRow value={avg} size={16} />
          <span className="rv-count-label">
            {count > 0 ? `${count} review${count === 1 ? "" : "s"}` : "No reviews yet"}
          </span>
        </div>
        <div className="rv-breakdown">
          {[5, 4, 3, 2, 1].map((star) => {
            const n = breakdown[star] || 0;
            const pct = count ? Math.round((n / count) * 100) : 0;
            return (
              <div key={star} className="rv-bar-row">
                <span className="rv-bar-label">{star}★</span>
                <div className="rv-bar-track"><div className="rv-bar-fill" style={{ width: `${pct}%` }} /></div>
                <span className="rv-bar-count">{n}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Write a review (clients only, not the vendor's own listing) ── */}
      {isLoggedIn && !isOwner && (
        <div className="rv-write">
          {myStatus === null ? null : myStatus.canReview ? (
            <form className="rv-form" onSubmit={handleSubmit}>
              <p className="rv-write-label">
                {myStatus.review ? "Edit your review" : "Write a review"}
              </p>
              <StarPicker value={formRating} onChange={setFormRating} />
              <textarea
                className="rv-textarea"
                placeholder="How was your experience with this vendor?"
                value={formComment}
                maxLength={1000}
                onChange={(e) => setFormComment(e.target.value)}
                rows={3}
              />
              <div className="rv-form-row">
                <button className="rv-submit-btn" type="submit" disabled={submitting}>
                  {submitting ? "Saving…" : myStatus.review ? "Update Review" : "Post Review"}
                </button>
                {myStatus.review && (
                  <button type="button" className="rv-delete-btn" onClick={handleDelete}>
                    Delete
                  </button>
                )}
              </div>
              {formMsg && <p className="rv-form-msg">{formMsg}</p>}
            </form>
          ) : (
            <p className="rv-gate-note">
              You can review this vendor once a booking with them is approved.
            </p>
          )}
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <p className="rv-empty">Loading reviews…</p>
      ) : error ? (
        <p className="rv-empty">{error}</p>
      ) : data?.reviews?.length ? (
        <>
          <div className="rv-list">
            {data.reviews.map((r) => (
              <div key={r._id} className="rv-item">
                <div className="rv-item-head">
                  <span className="rv-avatar">{(r.userName || "E")[0].toUpperCase()}</span>
                  <div>
                    <p className="rv-item-name">{r.userName}</p>
                    <StarRow value={r.rating} />
                  </div>
                  <span className="rv-item-date">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </span>
                </div>
                {r.comment && <p className="rv-item-comment">{r.comment}</p>}

                {r.vendorReply?.message && (
                  <div className="rv-reply">
                    <p className="rv-reply-label">Response from the vendor</p>
                    <p className="rv-reply-text">{r.vendorReply.message}</p>
                  </div>
                )}

                {isOwner && !r.vendorReply?.message && (
                  <div className="rv-reply-box">
                    <input
                      className="rv-reply-input"
                      placeholder="Reply to this review…"
                      value={replyDrafts[r._id] || ""}
                      maxLength={500}
                      onChange={(e) => setReplyDrafts((d) => ({ ...d, [r._id]: e.target.value }))}
                    />
                    <button
                      className="rv-reply-btn"
                      disabled={replyingId === r._id}
                      onClick={() => handleReply(r._id)}
                    >
                      {replyingId === r._id ? "…" : "Reply"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {data.pages > 1 && (
            <div className="rv-pager">
              <button disabled={page <= 1} onClick={() => load(page - 1)}>← Newer</button>
              <span>Page {page} of {data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => load(page + 1)}>Older →</button>
            </div>
          )}
        </>
      ) : (
        <p className="rv-empty">Be the first to review this vendor.</p>
      )}
    </div>
  );
}

const reviewStyles = `
  .rv-section { margin-top: 8px; }
  .rv-stars { letter-spacing: 1px; }
  .rv-star { color: var(--border); }
  .rv-star.on { color: var(--gold); }
  .rv-picker { display: inline-flex; gap: 2px; }
  .rv-pick-star { background: none; border: none; cursor: pointer; font-size: 26px; line-height: 1; color: var(--border); padding: 0 2px; transition: color .15s, transform .1s; }
  .rv-pick-star.on { color: var(--gold); transform: scale(1.05); }

  .rv-summary { display: flex; gap: 36px; flex-wrap: wrap; align-items: center; background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 24px 28px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(14,12,10,0.04); }
  .rv-summary-score { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 110px; }
  .rv-big-num { font-family:'Cormorant Garamond',serif; font-size: 2.4rem; font-weight: 600; color: var(--ink); line-height: 1; }
  .rv-count-label { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
  .rv-breakdown { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 5px; }
  .rv-bar-row { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: var(--muted); }
  .rv-bar-label { width: 22px; }
  .rv-bar-track { flex: 1; height: 6px; background: var(--surface); border-radius: 4px; overflow: hidden; }
  .rv-bar-fill { height: 100%; background: var(--gold); border-radius: 4px; }
  .rv-bar-count { width: 22px; text-align: right; }

  .rv-write { margin-bottom: 28px; }
  .rv-form { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 20px 22px; display: flex; flex-direction: column; gap: 12px; }
  .rv-write-label { font-size: 12.5px; font-weight: 600; color: var(--ink); margin: 0; }
  .rv-textarea { width: 100%; resize: vertical; border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink); background: var(--surface); box-sizing: border-box; }
  .rv-form-row { display: flex; gap: 10px; align-items: center; }
  .rv-submit-btn { background: var(--ink); color: var(--white); border: none; border-radius: 6px; padding: 10px 20px; font-size: 13px; font-weight: 500; cursor: pointer; }
  .rv-submit-btn:disabled { opacity: .6; cursor: default; }
  .rv-delete-btn { background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 6px; padding: 10px 16px; font-size: 12.5px; cursor: pointer; }
  .rv-form-msg { font-size: 12px; color: var(--muted); margin: 0; }
  .rv-gate-note { font-size: 12.5px; color: var(--muted); background: var(--surface); border: 1px dashed var(--border); border-radius: 8px; padding: 12px 16px; }

  .rv-list { display: flex; flex-direction: column; gap: 16px; }
  .rv-item { background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; }
  .rv-item-head { display: flex; align-items: center; gap: 10px; }
  .rv-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--gold-light); color: var(--ink); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; flex-shrink: 0; }
  .rv-item-name { font-size: 13px; font-weight: 600; color: var(--ink); margin: 0 0 2px; }
  .rv-item-date { margin-left: auto; font-size: 11px; color: var(--muted); }
  .rv-item-comment { font-size: 13px; color: var(--ink); line-height: 1.6; margin: 10px 0 0; }

  .rv-reply { background: var(--surface); border-radius: 8px; padding: 10px 14px; margin-top: 12px; }
  .rv-reply-label { font-size: 10.5px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); margin: 0 0 4px; }
  .rv-reply-text { font-size: 12.5px; color: var(--ink); margin: 0; line-height: 1.5; }

  .rv-reply-box { display: flex; gap: 8px; margin-top: 12px; }
  .rv-reply-input { flex: 1; border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; font-size: 12.5px; background: var(--surface); }
  .rv-reply-btn { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 8px 14px; font-size: 12px; cursor: pointer; color: var(--ink); }

  .rv-pager { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 20px; font-size: 12px; color: var(--muted); }
  .rv-pager button { background: none; border: 1px solid var(--border); border-radius: 6px; padding: 6px 12px; cursor: pointer; color: var(--ink); font-size: 12px; }
  .rv-pager button:disabled { opacity: .4; cursor: default; }

  .rv-empty { font-size: 13px; color: var(--muted); background: var(--white); border: 1px dashed var(--border); border-radius: 10px; padding: 24px; text-align: center; }
`;