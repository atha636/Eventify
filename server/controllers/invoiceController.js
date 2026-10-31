const path     = require("path");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");

const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const User    = require("../models/User");

// ── Assets (bundled with the server so the PDF looks the same everywhere) ──
const FONT_REGULAR = path.join(__dirname, "../assets/fonts/Inter-Regular.otf");
const FONT_BOLD    = path.join(__dirname, "../assets/fonts/Inter-SemiBold.otf");
const LOGO         = path.join(__dirname, "../assets/logo.png");

// ── Brand palette (print-friendly: white page, ink header, gold accents) ──
const C = {
  ink:    "#0e0c0a",
  gold:   "#c9a84c",
  goldDk: "#8a6f1e",
  goldLt: "#e8d5a3",
  muted:  "#7a7265",
  text:   "#2a2622",
  line:   "#e8e2d4",
  tint:   "#faf7f2",
  green:  "#2d6a4f",
  red:    "#b85c5c",
  amber:  "#a07b28",
};

// ── Formatting helpers ──────────────────────────────────────────────────────
// Indian digit grouping (12,34,567) without relying on server ICU data
function groupIN(n) {
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const last3 = int.slice(-3);
  const rest  = int.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return dec === "00" ? grouped : `${grouped}.${dec}`;
}
const inr = (n) => `${n < 0 ? "-" : ""}₹${groupIN(Number(n) || 0)}`;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(d) {
  if (!d) return "—";
  const t = new Date(new Date(d).getTime() + 5.5 * 3600 * 1000); // IST
  if (isNaN(t)) return "—";
  return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
}

const PLAN_LABEL = {
  "25":  "25% now · 50% before event · 25% after event",
  "75":  "75% now · 25% after event",
  "100": "Full payment (5% discount)",
};

function milestone(plan, n) {
  if (plan === "25")  return ["At booking", "Before the event", "After the event"][n - 1] || `Installment ${n}`;
  if (plan === "75")  return ["At booking", "After the event"][n - 1] || `Installment ${n}`;
  return "Full payment (5% discount)";
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF BUILDER — returns a Buffer
// ─────────────────────────────────────────────────────────────────────────────
function buildPdf(inv) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      bufferPages: true,
      info: {
        Title:   `Evencers ${inv.title} ${inv.number}`,
        Author:  "Evencers",
        Subject: "Booking invoice",
      },
    });

    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.registerFont("R", FONT_REGULAR);
    doc.registerFont("B", FONT_BOLD);

    // Drop any character the font can't draw (e.g. Devanagari in a name) so the
    // PDF never shows broken boxes
    const face = doc.font("R")._font;
    const safe = (s) =>
      Array.from(String(s ?? ""))
        .map((ch) => {
          const cp = ch.codePointAt(0);
          if (cp === 0x0a) return " ";
          if (cp < 0x20) return "";
          return face.font.hasGlyphForCodePoint(cp) ? ch : "?";
        })
        .join("")
        .trim();

    // A name written only in a script Inter doesn't have (e.g. Devanagari) would print as "????"
    const readable = (name, ...fallbacks) => {
      for (const c of [name, ...fallbacks]) {
        const t = safe(c);
        if (/[A-Za-z0-9]/.test(t)) return t;
      }
      return "Customer";
    };
    inv.customer.name = readable(inv.customer.name, inv.customer.email ? inv.customer.email.split("@")[0] : "");
    inv.vendor.name   = readable(inv.vendor.name, inv.vendor.service);

    const W = doc.page.width;      // 595.28
    const H = doc.page.height;     // 841.89
    const M = 48;                  // side margin
    const CW = W - M * 2;          // content width
    const FOOT = 58;               // reserved footer height

    // ── low-level helpers ──
    const text = (str, x, y, o = {}) => {
      doc.font(o.bold ? "B" : "R").fontSize(o.size || 9.5).fillColor(o.color || C.text);
      // single-line cells: a fixed height + ellipsis makes pdfkit truncate instead of wrapping
      const single = !!o.ellipsis;
      doc.text(safe(str), x, y, {
        width: o.width, align: o.align || "left",
        lineBreak: single ? true : (o.lineBreak ?? !!o.width),
        height: single ? (o.size || 9.5) * 1.3 : undefined,
        ellipsis: single ? "…" : undefined,
        characterSpacing: o.spacing || 0,
      });
    };
    const heightOf = (str, width, size = 9.5, bold = false) => {
      doc.font(bold ? "B" : "R").fontSize(size);
      return doc.heightOfString(safe(str), { width });
    };
    const rule = (y, color = C.line, x1 = M, x2 = W - M, w = 0.7) =>
      doc.save().moveTo(x1, y).lineTo(x2, y).lineWidth(w).strokeColor(color).stroke().restore();

    const ensure = (y, need) => {
      if (y + need <= H - FOOT - 12) return y;
      doc.addPage();
      return M;
    };

    // ═════════════ HEADER BAND ═════════════
    doc.rect(0, 0, W, 100).fill(C.ink);
    doc.rect(0, 100, W, 3).fill(C.gold);

    doc.save();
    doc.circle(M + 24, 50, 24).clip();
    doc.image(LOGO, M, 26, { width: 48, height: 48 });
    doc.restore();
    doc.circle(M + 24, 50, 24).lineWidth(1).strokeColor(C.gold).stroke();

    text("EVENCERS", M + 62, 38, { bold: true, size: 17, color: C.goldLt, spacing: 3 });
    text("India's premier event platform", M + 62, 61, { size: 8.5, color: "#a09888" });

    text(inv.title.toUpperCase(), W - M - 220, 32, { bold: true, size: 20, color: "#ffffff", width: 220, align: "right", spacing: 2 });
    text(inv.number, W - M - 220, 60, { size: 10, color: C.goldLt, width: 220, align: "right" });
    text(`Issued ${fmtDate(inv.issuedAt)}`, W - M - 220, 76, { size: 8.5, color: "#a09888", width: 220, align: "right" });

    // ═════════════ STATUS + PARTIES ═════════════
    let y = 126;

    // status pill
    const pill = inv.statusLabel;
    doc.font("B").fontSize(8.5);
    const pw = doc.widthOfString(pill, { characterSpacing: 1.2 }) + 24;
    doc.roundedRect(M, y, pw, 22, 11).fill(inv.statusColor);
    text(pill, M, y + 7, { bold: true, size: 8.5, color: "#ffffff", width: pw, align: "center", spacing: 1.2 });

    // ID of booking on the right
    text(`Booking ref  ${inv.bookingRef}`, W - M - 240, y + 6, { size: 8.5, color: C.muted, width: 240, align: "right" });

    y += 36;

    const colW = (CW - 24) / 2;
    const party = (title, lines, x) => {
      text(title.toUpperCase(), x, y, { bold: true, size: 8, color: C.goldDk, spacing: 1.4 });
      let yy = y + 16;
      lines.filter(Boolean).forEach((ln, i) => {
        const h = heightOf(ln.text, colW, ln.size || 9.5, ln.bold);
        text(ln.text, x, yy, { bold: ln.bold, size: ln.size || 9.5, color: ln.color || C.text, width: colW });
        yy += h + (i === 0 ? 3 : 2);
      });
      return yy;
    };

    const yL = party("Billed to", [
      { text: inv.customer.name, bold: true, size: 11 },
      inv.customer.email && { text: inv.customer.email, color: C.muted },
      inv.customer.phone && { text: inv.customer.phone, color: C.muted },
      inv.customer.address && { text: inv.customer.address, color: C.muted },
    ], M);
    const yR = party("Service provider", [
      { text: inv.vendor.name, bold: true, size: 11 },
      inv.vendor.service && { text: inv.vendor.service, color: C.muted },
      inv.vendor.location && { text: inv.vendor.location, color: C.muted },
      inv.vendor.email && { text: inv.vendor.email, color: C.muted },
      inv.vendor.phone && { text: inv.vendor.phone, color: C.muted },
    ], M + colW + 24);

    y = Math.max(yL, yR) + 14;

    // ═════════════ EVENT STRIP ═════════════
    const stripH = 52;
    doc.roundedRect(M, y, CW, stripH, 8).fill(C.tint);
    doc.roundedRect(M, y, CW, stripH, 8).lineWidth(0.7).strokeColor(C.line).stroke();
    const cells = [
      ["EVENT DATE", fmtDate(inv.eventDate)],
      ["BOOKED ON", fmtDate(inv.bookedOn)],
      ["PAYMENT PLAN", inv.planShort],
      ["PACKAGE", inv.packageName],
    ];
    const fr = [0.2, 0.2, 0.22, 0.38];                 // package name gets the most room
    let cellX = M;
    cells.forEach(([k, v], i) => {
      const cw = CW * fr[i];
      const cx = cellX + 14;
      text(k, cx, y + 11, { bold: true, size: 7.5, color: C.muted, spacing: 1.2 });
      text(v, cx, y + 26, { bold: true, size: 10, color: C.ink, width: cw - 22, ellipsis: true });
      if (i) rule(y + 10, C.line, cellX, cellX, 0.7);
      cellX += cw;
    });
    y += stripH + 20;

    // ═════════════ ITEMS ═════════════
    // hx/hw let a header sit exactly over its (padded) column values
    const tableHead = (labels, hx, hw, aligns) => {
      doc.rect(M, y, CW, 24).fill(C.ink);
      labels.forEach((lb, i) =>
        text(lb.toUpperCase(), hx[i], y + 8, { bold: true, size: 7.5, color: C.goldLt, width: hw[i], align: aligns[i], spacing: 1 })
      );
      y += 24;
    };

    text("CHARGES", M, y, { bold: true, size: 8, color: C.goldDk, spacing: 1.4 });
    y += 16;
    {
      const xs = [M + 14, W - M - 140];
      const ws = [CW - 170, 126];
      tableHead(["Description", "Amount"], xs, ws, ["left", "right"]);  // xs/ws already match the row text

      const rows = [
        { d: inv.packageName, sub: inv.vendor.service, a: inv.packagePrice },
      ];
      if (inv.discount > 0) rows.push({ d: "Full-payment discount (5%)", sub: "Applied because you chose to pay in full", a: -inv.discount, green: true });

      rows.forEach((r) => {
        const h = Math.max(34, heightOf(r.d, ws[0], 10, true) + (r.sub ? 16 : 0) + 14);
        y = ensure(y, h);
        text(r.d, xs[0], y + 9, { bold: true, size: 10, color: r.green ? C.green : C.ink, width: ws[0] });
        if (r.sub) text(r.sub, xs[0], y + 9 + heightOf(r.d, ws[0], 10, true) + 2, { size: 8.5, color: C.muted, width: ws[0] });
        text(inv.packagePrice === 0 && !r.green ? "—" : inr(r.a), xs[1], y + 9, { bold: true, size: 10, color: r.green ? C.green : C.ink, width: ws[1], align: "right" });
        y += h;
        rule(y);
      });
    }

    // ═════════════ TOTALS ═════════════
    y += 14;
    y = ensure(y, 100);
    {
      const bw = 232, bx = W - M - bw;
      const boxTop = y - 10;
      const line = (label, val, o = {}) => {
        text(label, bx + 14, y, { size: o.size || 9.5, bold: o.bold, color: o.color || C.muted });
        text(val, bx + 14, y, { size: o.size || 9.5, bold: true, color: o.color2 || C.ink, width: bw - 28, align: "right" });
        y += o.gap || 20;
      };
      doc.roundedRect(bx, y - 10, bw, 100, 8).fill(C.tint);
      doc.roundedRect(bx, y - 10, bw, 100, 8).lineWidth(0.7).strokeColor(C.line).stroke();
      y += 2;
      line("Total payable", inr(inv.totalPayable), { color2: C.ink });
      line("Amount paid", inr(inv.paid), { color2: C.green });
      rule(y - 6, C.line, bx + 14, bx + bw - 14);
      y += 4;
      // balance highlight
      doc.roundedRect(bx + 8, y - 8, bw - 16, 34, 6).fill(inv.balance > 0 ? C.ink : C.green);
      text(inv.balance > 0 ? "BALANCE DUE" : "BALANCE", bx + 22, y + 3, { bold: true, size: 8, color: C.goldLt, spacing: 1.2 });
      text(inr(inv.balance), bx + 14, y + 1, { bold: true, size: 14, color: "#ffffff", width: bw - 36, align: "right" });
      y += 40;

      // note on the left, level with the totals box
      const nw = CW - bw - 28;
      text(inv.balance > 0 ? "WHAT'S NEXT" : "THANK YOU", M, boxTop + 6, { bold: true, size: 8, color: C.goldDk, spacing: 1.4 });
      text(inv.note, M, boxTop + 22, { size: 9, color: C.muted, width: nw });
    }

    // ═════════════ PAYMENT SCHEDULE ═════════════
    y += 4;
    if (inv.schedule.length) {
      y = ensure(y, 90);
      text("PAYMENT SCHEDULE", M, y, { bold: true, size: 8, color: C.goldDk, spacing: 1.4 });
      y += 16;
      const ws = [30, 170, 40, 90, 80, CW - 30 - 170 - 40 - 90 - 80];
      const xs = []; ws.reduce((x, w) => (xs.push(x), x + w), M);
      tableHead(["#", "Milestone", "%", "Amount", "Status", "Paid on"],
        [xs[0] + 14, xs[1], xs[2], xs[3], xs[4] + 4, xs[5]],
        [ws[0] - 14, ws[1], ws[2], ws[3] - 14, ws[4], ws[5]],
        ["left", "left", "left", "right", "left", "left"]);

      inv.schedule.forEach((s) => {
        y = ensure(y, 26);
        const col = s.paid ? C.green : s.linkSent ? C.amber : C.muted;
        text(String(s.n), xs[0] + 14, y + 9, { size: 9.5, color: C.muted });
        text(s.label, xs[1], y + 9, { bold: true, size: 9.5, color: C.ink, width: ws[1] - 8, lineBreak: false, ellipsis: true });
        text(`${s.pct}%`, xs[2], y + 9, { size: 9.5, color: C.muted });
        text(inr(s.amount), xs[3], y + 9, { bold: true, size: 9.5, width: ws[3] - 14, align: "right" });
        text(s.statusLabel, xs[4] + 4, y + 9, { bold: true, size: 8.5, color: col, spacing: 0.4 });
        text(s.paid ? fmtDate(s.paidAt) : "—", xs[5], y + 9, { size: 9.5, color: C.muted });
        y += 28;
        rule(y);
      });
      y += 14;
    }

    // ═════════════ TRANSACTIONS ═════════════
    if (inv.transactions.length) {
      y = ensure(y, 70);
      text("TRANSACTIONS", M, y, { bold: true, size: 8, color: C.goldDk, spacing: 1.4 });
      y += 16;
      const ws = [78, CW - 78 - 120 - 90 - 80, 120, 90, 80];
      const xs = []; ws.reduce((x, w) => (xs.push(x), x + w), M);
      tableHead(["Date", "Reference", "For", "Amount", "Result"],
        [xs[0] + 14, xs[1], xs[2], xs[3], xs[4] + 4],
        [ws[0] - 14, ws[1], ws[2], ws[3] - 14, ws[4]],
        ["left", "left", "left", "right", "left"]);

      inv.transactions.forEach((t) => {
        y = ensure(y, 26);
        text(fmtDate(t.date), xs[0] + 14, y + 8, { size: 9, color: C.muted });
        text(t.ref || "—", xs[1], y + 8, { size: 8.5, color: C.text, width: ws[1] - 8, lineBreak: false, ellipsis: true });
        text(t.forLabel, xs[2], y + 8, { size: 9, color: C.muted, width: ws[2] - 8, lineBreak: false, ellipsis: true });
        text(inr(t.amount), xs[3], y + 8, { bold: true, size: 9, width: ws[3] - 14, align: "right" });
        text(t.result, xs[4] + 4, y + 8, { bold: true, size: 8.5, color: t.refunded ? C.red : C.green });
        y += 26;
        rule(y);
      });
      y += 14;
    }

    // ═════════════ FOOTER ON EVERY PAGE ═════════════
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      const fy = H - FOOT + 6;
      rule(fy - 8, C.gold, M, W - M, 0.8);
      text(
        "This is a computer-generated document and does not require a signature. It is a payment record for your booking and is not a GST tax invoice. " +
        "Payments are processed securely by Razorpay.",
        M, fy, { size: 7.5, color: C.muted, width: CW - 70 }
      );
      text("Evencers  ·  evencers.com", M, fy + 24, { bold: true, size: 7.5, color: C.goldDk, spacing: 0.6 });
      text(`Page ${i + 1} of ${pages.count}`, W - M - 70, fy + 24, { size: 7.5, color: C.muted, width: 70, align: "right" });
    }

    doc.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bookings/:id/invoice
// Streams a PDF to the customer who made the booking, the vendor who owns the
// service, or an admin. Available once a booking is approved or has any payment.
// ─────────────────────────────────────────────────────────────────────────────
exports.getInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const booking = await Booking.findById(id)
      .populate("userId", "name email phone")
      .populate("vendorId", "title vendorName location locations vendorId");

    if (!booking) return res.status(404).json({ error: "Booking not found." });

    const service  = booking.vendorId;           // Vendor (service) document
    const customer = booking.userId;             // populated User
    const ownerId  = service?.vendorId ? String(service.vendorId) : null;
    const me       = String(req.user.id);

    const isCustomer = customer && String(customer._id) === me;
    const isVendor   = ownerId === me;
    const isAdmin    = req.user.role === "admin";
    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({ error: "You don't have access to this invoice." });
    }

    const hasPayment = (booking.totalPaid || 0) > 0;
    if (booking.status !== "approved" && !hasPayment) {
      return res.status(400).json({
        error: booking.status === "pending"
          ? "The invoice is available once the vendor approves this booking."
          : `An invoice isn't available for a ${booking.status} booking.`,
      });
    }

    const [owner, payments] = await Promise.all([
      ownerId ? User.findById(ownerId).select("name email phone").lean() : null,
      Payment.find({ bookingId: booking._id, status: { $in: ["paid", "refunded"] } })
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    // ── Money ────────────────────────────────────────────────────────────
    const installments  = booking.installments || [];
    const packagePrice  = Number(booking.packagePrice) || 0;
    const scheduleTotal = installments.reduce((t, i) => t + (Number(i.amount) || 0), 0);
    const totalPayable  = installments.length ? scheduleTotal : packagePrice;
    const discount      = Math.max(0, packagePrice - totalPayable);
    const paid          = Math.min(Number(booking.totalPaid) || 0, totalPayable || Infinity);
    const balance       = Math.max(0, totalPayable - paid);

    let statusLabel, statusColor;
    if (paid > 0 && balance === 0) { statusLabel = "PAID IN FULL";   statusColor = C.green; }
    else if (paid > 0)             { statusLabel = "PARTIALLY PAID"; statusColor = C.amber; }
    else                           { statusLabel = "PAYMENT PENDING"; statusColor = C.muted; }

    const plan = booking.paymentPlan || "100";
    const nextDue = installments.find((i) => i.status !== "paid");
    const note =
      balance > 0
        ? (nextDue
            ? `Next payment: ${inr(nextDue.amount)} (${milestone(plan, nextDue.installmentNumber).toLowerCase()}). You can pay securely from your Evencers dashboard.`
            : "A balance remains on this booking. You can pay securely from your Evencers dashboard.")
        : "Your booking is fully paid. We hope your event is wonderful!";

    const loc = service?.location || (service?.locations || []).join(", ") || "";
    const userDetails = booking.userDetails || {};

    const inv = {
      title: balance === 0 && paid > 0 ? "Payment Receipt" : "Booking Invoice",
      number: `EVC-${new Date(booking.createdAt || Date.now()).getFullYear()}-${String(booking._id).slice(-6).toUpperCase()}`,
      bookingRef: String(booking._id).slice(-8).toUpperCase(),
      issuedAt: new Date(),
      bookedOn: booking.createdAt,
      eventDate: booking.date,
      packageName: booking.packageName || "Custom package",
      packagePrice,
      discount,
      totalPayable,
      paid,
      balance,
      statusLabel,
      statusColor,
      planShort: plan === "100" ? "Pay in full" : `${plan}% upfront`,
      note,
      customer: {
        name:    userDetails.name || customer?.name || "Customer",
        email:   customer?.email || "",
        phone:   userDetails.phone || customer?.phone || "",
        address: userDetails.address || "",
      },
      vendor: {
        name:     service?.vendorName || owner?.name || "Vendor",
        service:  service?.title || "",
        location: loc,
        email:    owner?.email || "",
        phone:    owner?.phone || "",
      },
      schedule: installments.map((i) => ({
        n: i.installmentNumber,
        label: milestone(plan, i.installmentNumber),
        pct: i.percentage,
        amount: i.amount,
        paid: i.status === "paid",
        linkSent: i.status === "link_sent",
        paidAt: i.paidAt,
        statusLabel: i.status === "paid" ? "PAID" : i.status === "link_sent" ? "DUE NOW" : "UPCOMING",
      })),
      transactions: payments.map((p) => ({
        date: p.updatedAt || p.createdAt,
        ref: p.paymentId || p.orderId,
        forLabel: plan === "100" ? "Full payment" : p.installmentNumber ? milestone(plan, p.installmentNumber) : "Booking payment",
        amount: p.amount,
        refunded: p.status === "refunded",
        result: p.status === "refunded" ? "REFUNDED" : "SUCCESS",
      })),
    };

    const pdf = await buildPdf(inv);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdf.length);
    res.setHeader("Content-Disposition", `attachment; filename="Evencers-Invoice-${String(booking._id).slice(-6).toUpperCase()}.pdf"`);
    res.setHeader("Cache-Control", "private, no-store");
    res.end(pdf);
  } catch (err) {
    console.error("INVOICE ERROR:", err);
    res.status(500).json({ error: "Couldn't generate the invoice. Please try again." });
  }
};

exports._buildPdf = buildPdf; // exported for tests