// AI event-planner assistant.
//   • Always works with a built-in rule engine (free, no external service).
//   • If GEMINI_API_KEY is set, Google's free Gemini tier writes a richer plan;
//     any failure, bad output or daily-limit hit silently falls back to the rule engine.

const MAX_MESSAGES = 8;
const MAX_CHARS    = 500;
const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 20;
const GEMINI_MODEL   = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// ── event knowledge ─────────────────────────────────────────────────────────
const TYPES = {
  Wedding: {
    words: /wedding|shaadi|shadi|marriage|vivah|reception|sangeet|mehndi|mehendi/i,
    split: [["Venue", 27], ["Catering", 30], ["Decor", 12], ["Photography", 10], ["Attire & beauty", 8],
            ["Entertainment", 5], ["Invitations & gifts", 3], ["Contingency", 5]],
    minPerGuest: 1500,
    tasks: ["Fix the date, guest count and total budget", "Shortlist and book the venue", "Book photographer and videographer",
            "Finalise caterer and tasting", "Book decorator and share your theme", "Book makeup artist and finalise outfits",
            "Arrange music, DJ or band", "Send invitations", "Confirm all vendors one week before", "Plan final payments and gifts"],
  },
  Engagement: {
    words: /engagement|sagai|ring ceremony|roka|betrothal/i,
    split: [["Venue", 25], ["Catering", 30], ["Decor", 14], ["Photography", 10], ["Attire & beauty", 9],
            ["Entertainment", 5], ["Invitations & gifts", 3], ["Contingency", 4]],
    minPerGuest: 1200,
    tasks: ["Fix date and guest list", "Book the venue", "Book photographer", "Finalise catering", "Book decorator",
            "Arrange rings and outfits", "Send invitations", "Confirm vendors a few days before"],
  },
  Birthday: {
    words: /birthday|b'?day|bday|janamdin|first birthday|1st birthday/i,
    split: [["Venue", 20], ["Catering", 32], ["Decor", 18], ["Cake & desserts", 8], ["Photography", 8],
            ["Entertainment", 9], ["Return gifts", 3], ["Contingency", 2]],
    minPerGuest: 600,
    tasks: ["Fix date, theme and guest list", "Book venue (or prepare home)", "Order the cake", "Book decorator",
            "Arrange entertainment or games", "Book photographer", "Send invites", "Buy return gifts", "Confirm vendors a day before"],
  },
  Anniversary: {
    words: /anniversary|silver jubilee|golden jubilee/i,
    split: [["Venue", 25], ["Catering", 32], ["Decor", 14], ["Photography", 10], ["Entertainment", 8],
            ["Gifts", 5], ["Contingency", 6]],
    minPerGuest: 900,
    tasks: ["Fix date and guest list", "Book venue", "Finalise menu", "Book decorator", "Book photographer",
            "Plan the surprise or speeches", "Send invites", "Confirm vendors a day before"],
  },
  "Baby shower": {
    words: /baby shower|godh ?bharai|godbharai|gender reveal|naming ceremony|namkaran/i,
    split: [["Venue", 20], ["Catering", 32], ["Decor", 20], ["Photography", 9], ["Games & entertainment", 8],
            ["Return gifts", 6], ["Contingency", 5]],
    minPerGuest: 700,
    tasks: ["Fix date and guest list", "Pick a theme", "Book venue", "Book decorator", "Finalise menu",
            "Plan games", "Send invites", "Buy return gifts"],
  },
  Corporate: {
    words: /corporate|office|conference|seminar|product launch|launch|annual day|team ?building|offsite|company|business/i,
    split: [["Venue", 30], ["Catering", 25], ["AV & staging", 15], ["Decor & branding", 8], ["Photography & video", 7],
            ["Entertainment & hosts", 6], ["Printing & gifts", 4], ["Contingency", 5]],
    minPerGuest: 1000,
    tasks: ["Define goals, agenda and guest list", "Book venue with AV support", "Book caterer", "Arrange staging, sound and branding",
            "Book host or MC", "Book photographer and videographer", "Send invitations and track RSVPs", "Run a tech rehearsal"],
  },
  Other: {
    words: /.^/,
    split: [["Venue", 25], ["Catering", 30], ["Decor", 15], ["Photography", 10], ["Entertainment", 10],
            ["Miscellaneous", 5], ["Contingency", 5]],
    minPerGuest: 700,
    tasks: ["Fix date, guest list and budget", "Book venue", "Book caterer", "Book decorator", "Book photographer",
            "Send invitations", "Confirm all vendors before the event"],
  },
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// ── text understanding (rule engine) ────────────────────────────────────────
const toNum = (s) => Number(String(s).replace(/,/g, ""));
const unitMul = (u = "") => {
  u = u.toLowerCase();
  if (/^cr/.test(u)) return 1e7;
  if (/^(l|lac|lakh)/.test(u)) return 1e5;
  if (/^(k|thousand)/.test(u)) return 1e3;
  return 1;
};

function findBudget(text) {
  const found = [];
  const push = (re, valIdx, unitIdx) => {
    for (const m of text.matchAll(re)) {
      const v = toNum(m[valIdx]);
      if (Number.isFinite(v) && v > 0) found.push({ at: m.index, value: Math.round(v * unitMul(m[unitIdx])) });
    }
  };
  push(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(lakhs?|lacs?|l|crores?|cr|k|thousand)?\b/gi, 1, 2);
  push(/\b([\d,]+(?:\.\d+)?)\s*(lakhs?|lacs?|crores?|k|thousand)\b/gi, 1, 2);
  push(/budget\s*(?:of|is|around|about|:)?\s*([\d,]{4,})()/gi, 1, 2);
  if (!found.length) return 0;
  found.sort((a, b) => a.at - b.at);
  return found[found.length - 1].value;      // newest mention wins ("make it 3 lakh")
}

function findGuests(text) {
  let last = 0;
  for (const m of text.matchAll(/\b([\d,]{1,6})\s*(?:\+\s*)?(guests?|people|persons?|pax|members|attendees|log|mehman)\b/gi)) {
    const n = Math.round(toNum(m[1]));
    if (n > 0 && n < 100000) last = n;
  }
  if (!last) {
    const m = text.match(/\bfor\s+([\d,]{2,5})\b(?!\s*(?:k|lakh|lac|cr))/i);
    if (m) last = Math.round(toNum(m[1]));
  }
  return last;
}

function findDate(text) {
  const now = new Date();
  let m = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  m = text.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTHS.join("|")})[a-z]*\\.?(?:,?\\s+(20\\d{2}))?`, "i"));
  if (!m) m = text.match(new RegExp(`\\b(${MONTHS.join("|")})[a-z]*\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(20\\d{2}))?`, "i"));
  if (!m) return null;
  const dayFirst = /^\d/.test(m[1]);
  const day = dayFirst ? +m[1] : +m[2];
  const mon = MONTHS.indexOf((dayFirst ? m[2] : m[1]).slice(0, 3).toLowerCase());
  if (mon < 0 || day < 1 || day > 31) return null;
  let year = m[3] ? +m[3] : now.getUTCFullYear();
  let d = new Date(Date.UTC(year, mon, day));
  if (!m[3] && d < now) d = new Date(Date.UTC(year + 1, mon, day));
  return d;
}

function findType(text) {
  for (const [name, t] of Object.entries(TYPES)) if (name !== "Other" && t.words.test(text)) return name;
  return "Other";
}

function findCity(text) {
  const m = text.match(/\b(?:in|at|near)\s+([A-Z][a-zA-Z]{2,}(?:\s[A-Z][a-zA-Z]{2,})?)/);
  return m ? m[1] : "";
}

const inr = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

// Splits the budget across categories; rounds to nearest 500 and fixes the rounding on the biggest line
function allocate(split, budget) {
  const items = split.map(([category, pct]) => ({ category, name: category, estimated: Math.round((budget * pct / 100) / 500) * 500 }));
  const diff = budget - items.reduce((t, i) => t + i.estimated, 0);
  const biggest = items.reduce((a, b) => (b.estimated > a.estimated ? b : a), items[0]);
  biggest.estimated = Math.max(0, biggest.estimated + diff);
  return items;
}

function builtinPlan(text) {
  const eventType = findType(text);
  const cfg       = TYPES[eventType];
  const budget    = findBudget(text);
  const guests    = findGuests(text);
  const date      = findDate(text);
  const city      = findCity(text);

  if (!budget) {
    return { needBudget: true, reply: `Happy to help plan your ${eventType === "Other" ? "event" : eventType.toLowerCase()}! What's your total budget? For example “₹5 lakh” or “80k”.` };
  }

  const tips = [];
  if (guests) {
    const per = budget / guests;
    if (per < cfg.minPerGuest) tips.push(`That's about ${inr(per)} per guest — on the tight side. Consider fewer guests or a simpler venue and menu.`);
    else tips.push(`About ${inr(per)} per guest — a comfortable range.`);
  } else {
    tips.push("Tell me your guest count and I'll check whether the budget is realistic.");
  }
  tips.push("Catering and venue usually take over half the budget — get two or three quotes for each.");
  if (date) {
    const days = Math.ceil((date - Date.now()) / 86400000);
    if (days > 0 && days < 30 && /Wedding|Engagement/.test(eventType)) tips.push(`Only ${days} days left — book the venue, caterer and photographer first.`);
  }

  const title = `${eventType === "Other" ? "My event" : `${eventType}`}${city ? ` in ${city}` : ""}`;
  return {
    plan: {
      title, eventType, guests, totalBudget: budget, date: date ? date.toISOString().slice(0, 10) : null,
      items: allocate(cfg.split, budget), tasks: cfg.tasks.slice(), notes: city ? `City: ${city}` : "",
    },
    tips,
    reply: `Here's a ${inr(budget)} plan for your ${eventType === "Other" ? "event" : eventType.toLowerCase()}${guests ? ` with ${guests} guests` : ""}. Change anything you like, or tell me what to adjust.`,
  };
}

// ── optional Gemini (free tier) ─────────────────────────────────────────────
const dayCounts = new Map();            // userId → { day, n }
function aiAllowed(userId) {
  if (!process.env.GEMINI_API_KEY) return false;
  const day = new Date().toISOString().slice(0, 10);
  const rec = dayCounts.get(userId);
  if (!rec || rec.day !== day) { dayCounts.set(userId, { day, n: 1 }); return true; }
  if (rec.n >= AI_DAILY_LIMIT) return false;
  rec.n += 1;
  return true;
}

const clampStr = (v, n) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

function sanitisePlan(raw, fallback) {
  if (!raw || typeof raw !== "object") return null;
  const budget = Math.round(Number(raw.totalBudget)) || fallback.totalBudget;
  if (!(budget > 0)) return null;
  let items = (Array.isArray(raw.items) ? raw.items : []).slice(0, 14).map((i) => ({
    category: clampStr(i.category, 40) || "Other", name: clampStr(i.name || i.category, 120),
    estimated: Math.max(0, Math.round(Number(i.estimated) || 0)),
  })).filter((i) => i.name);
  const total = items.reduce((t, i) => t + i.estimated, 0);
  if (items.length < 3 || total <= 0) return null;
  const k = budget / total;                                    // rescale so lines add up to the budget
  items = items.map((i) => ({ ...i, estimated: Math.round(i.estimated * k / 500) * 500 }));
  const tasks = (Array.isArray(raw.tasks) ? raw.tasks : []).slice(0, 14).map((t) => clampStr(t, 160)).filter(Boolean);
  if (!tasks.length) return null;
  const date = raw.date && !Number.isNaN(new Date(raw.date).getTime()) ? new Date(raw.date).toISOString().slice(0, 10) : fallback.date;
  return {
    title: clampStr(raw.title, 100) || fallback.title,
    eventType: Object.keys(TYPES).includes(raw.eventType) ? raw.eventType : fallback.eventType,
    guests: Math.max(0, Math.round(Number(raw.guests)) || fallback.guests || 0),
    totalBudget: budget, date, items, tasks, notes: clampStr(raw.notes, 300),
  };
}

async function geminiPlan(conversation, base) {
  const prompt = `You are an Indian event-planning assistant for the Evencers marketplace. Read the customer's messages and produce a realistic budget plan in INR.
Rules: reply ONLY with JSON: {"reply": string (max 2 short sentences, friendly), "tips": string[] (max 3, practical, Indian context),
"plan": {"title": string, "eventType": one of ${Object.keys(TYPES).join("|")}, "guests": number, "totalBudget": number, "date": "YYYY-MM-DD" or null,
"items": [{"category": string, "name": string, "estimated": number}] (6-10 lines adding up to totalBudget, include a 4-6% contingency),
"tasks": string[] (8-12 ordered checklist tasks), "notes": string}}.
Use the customer's latest numbers if they changed them. Never invent facts about specific vendors.
Hints already extracted: ${JSON.stringify({ guests: base.plan.guests, totalBudget: base.plan.totalBudget, eventType: base.plan.eventType, date: base.plan.date })}
Customer messages:\n${conversation}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, responseMimeType: "application/json", maxOutputTokens: 1500 },
        }),
      }
    );
    if (!r.ok) throw new Error(`Gemini ${r.status}`);
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    const parsed = JSON.parse(text.replace(/^```json|```$/g, "").trim());
    const plan = sanitisePlan(parsed.plan, base.plan);
    if (!plan) throw new Error("unusable AI plan");
    return {
      plan,
      reply: clampStr(parsed.reply, 300) || base.reply,
      tips: (Array.isArray(parsed.tips) ? parsed.tips : []).slice(0, 3).map((t) => clampStr(t, 200)).filter(Boolean),
    };
  } finally { clearTimeout(timer); }
}

// POST /api/assistant/plan   body: { messages: [{ text }] }
exports.suggestPlan = async (req, res) => {
  try {
    if (req.user?.role !== "user") return res.status(403).json({ error: "The planning assistant is for customer accounts." });

    const msgs = (Array.isArray(req.body.messages) ? req.body.messages : [])
      .slice(-MAX_MESSAGES).map((m) => clampStr(m?.text, MAX_CHARS)).filter(Boolean);
    if (!msgs.length) return res.status(400).json({ error: "Tell me about your event first." });

    const conversation = msgs.join("\n");
    const base = builtinPlan(conversation);
    if (base.needBudget) return res.json({ reply: base.reply, plan: null, tips: [], source: "builtin" });

    let out = { ...base, source: "builtin" };
    if (aiAllowed(req.user.id)) {
      try { out = { ...(await geminiPlan(conversation, base)), source: "ai" }; }
      catch (e) { console.error("Assistant AI fallback:", e.message); }
    }
    res.json({ reply: out.reply, plan: out.plan, tips: out.tips, source: out.source });
  } catch (e) {
    console.error("suggestPlan:", e);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

exports._builtinPlan = builtinPlan;   // for tests