// AI helper for vendors: write a service description, and suggest replies to customer messages.
// Free by default (built-in templates). If GEMINI_API_KEY is set, Gemini's free tier writes
// richer text, and any failure falls back to the templates.

const Vendor = require("../models/Vendor");
const { aiAllowed, geminiJson } = require("../utils/gemini");

const clean = (v, n) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const vendorOnly = (req, res) => {
  if (req.user?.role !== "vendor") { res.status(403).json({ error: "This helper is for vendor accounts." }); return false; }
  return true;
};

// Cut to a limit at the end of a sentence/word, never mid-word
function fit(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "));
  if (stop > max * 0.6) return cut.slice(0, stop + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "") + ".";
}

// ═══ 1. DESCRIPTION WRITER ══════════════════════════════════════════════════
const COPY = {
  photography: {
    noun: "photography",
    open: (t, where) => `${t} turns your most important moments into photographs you will treasure for a lifetime${where}.`,
    mid:  "From candid smiles to carefully composed portraits, every shot is framed with care and edited with a natural, true-to-life look.",
    close: "Share your date and vision and we will plan the coverage around you.",
  },
  decor: {
    noun: "decor",
    open: (t, where) => `${t} designs celebration spaces that feel as special as the occasion${where}.`,
    mid:  "From mandaps and stages to lighting, florals and table styling, we handle the concept, setup and teardown so you can simply enjoy the day.",
    close: "Tell us your theme and venue and we will bring it to life.",
  },
  catering: {
    noun: "catering",
    open: (t, where) => `${t} serves fresh, flavourful food that your guests will talk about long after the event${where}.`,
    mid:  "We build menus around your taste and guest count, with careful hygiene, on-time service and a warm, professional team.",
    close: "Share your guest count and preferences for a tailored menu.",
  },
  music: {
    noun: "music and entertainment",
    open: (t, where) => `${t} brings the energy that makes a celebration unforgettable${where}.`,
    mid:  "We read the crowd, mix the right songs for every age group and keep the dance floor alive with professional sound and lighting.",
    close: "Tell us your playlist wishes and event timing.",
  },
  florals: {
    noun: "floral design",
    open: (t, where) => `${t} creates fresh, beautiful floral arrangements for every kind of celebration${where}.`,
    mid:  "From entrance garlands to stage backdrops and table centrepieces, each design is made with seasonal blooms and attention to detail.",
    close: "Share your colours and venue for a custom design.",
  },
  venues: {
    noun: "venue",
    open: (t, where) => `${t} is a welcoming space for weddings, birthdays and corporate events${where}.`,
    mid:  "Comfortable seating, flexible layouts, parking and dependable on-site support make planning simple.",
    close: "Check your date with us and visit to see the space.",
  },
};

function builtinDescription({ serviceType, title, locations, hint }) {
  const c = COPY[serviceType] || COPY.decor;
  const name = title || "Our team";
  const where = locations.length ? ` in ${locations.slice(0, 3).join(", ")}${locations.length > 3 ? " and nearby areas" : ""}` : "";
  const parts = [c.open(name, where), c.mid];

  if (hint) {
    const yrs = hint.match(/(\d{1,2})\+?\s*(?:years?|yrs?)/i);
    const rest = hint.replace(/(\d{1,2})\+?\s*(?:years?|yrs?)(?:\s*of)?(?:\s*experience)?/i, "").replace(/^[\s,;.-]+|[\s,;.-]+$/g, "");
    if (yrs) parts.push(`With ${yrs[1]}+ years of experience, we know how to keep things smooth from start to finish.`);
    if (rest.length > 2) parts.push(`Our specialities: ${rest.toLowerCase()}.`);
  }
  parts.push(c.close);
  return fit(parts.join(" "), 500);
}

async function geminiDescription(input) {
  const prompt = `Write a service description for an Indian event-vendor listing on the Evencers marketplace.
Rules: 3-4 sentences, warm and professional, plain English, MAX 480 characters, no emojis, no hashtags, no prices,
do NOT invent awards, client names, years of experience or numbers that are not in the facts below.
${input.existing ? "Improve and tighten the vendor's own draft, keeping its facts." : ""}
Facts: ${JSON.stringify({ category: input.serviceType, title: input.title, cities: input.locations, vendorNotes: input.hint, existingDraft: input.existing })}
Reply ONLY as JSON: {"description": string}`;
  const out = await geminiJson(prompt, 500);
  const text = clean(out.description, 600);
  if (text.length < 40) throw new Error("AI description too short");
  return fit(text, 500);
}

// POST /api/vendor-ai/description
exports.writeDescription = async (req, res) => {
  try {
    if (!vendorOnly(req, res)) return;
    const input = {
      serviceType: clean(req.body.serviceType, 30).toLowerCase(),
      title: clean(req.body.title, 100),
      locations: (Array.isArray(req.body.locations) ? req.body.locations : []).slice(0, 8).map((l) => clean(l, 40)).filter(Boolean),
      hint: clean(req.body.hint, 200),
      existing: clean(req.body.existing, 500),
    };
    let description, source = "builtin";
    if (aiAllowed(req.user.id, "desc")) {
      try { description = await geminiDescription(input); source = "ai"; }
      catch (e) { console.error("Vendor AI description fallback:", e.message); }
    }
    if (!description) description = builtinDescription(input);
    res.json({ description, source });
  } catch (e) {
    console.error("writeDescription:", e);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// ═══ 2. REPLY SUGGESTIONS ═══════════════════════════════════════════════════
const INTENTS = [
  ["price",    /price|rate|cost|quote|charge|charges|kitna|kitne|budget|package|packages|paise|fees?/i],
  ["date",     /available|availability|free on|date|slot|book(?:ed|ing)?\s+for|khali/i],
  ["discount", /discount|negotiat|less|reduce|kam|best price|final price|offer/i],
  ["advance",  /advance|payment|pay\b|confirm|token|deposit|book it|go ahead|proceed/i],
  ["place",    /location|where|venue|travel|outstation|come to|city|address|far/i],
  ["details",  /include|inclusion|detail|what do you|deliver|how many|portfolio|sample|work|album|hours/i],
  ["thanks",   /thank|thanks|shukriya|dhanyavad|great|perfect|ok(?:ay)?\b|done/i],
];

const money = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function builtinReplies(customerText, ctx) {
  const hi = ctx.customerName ? `Hi ${ctx.customerName}` : "Hello";
  const me = ctx.vendorName ? ` This is ${ctx.vendorName}.` : "";
  const pk = ctx.packages.length
    ? ctx.packages.slice(0, 3).map((p) => `${p.name}${p.price ? ` – ${money(p.price)}` : ""}`).join(", ")
    : "";
  const intent = (INTENTS.find(([, re]) => re.test(customerText)) || [])[0] || "general";

  const R = {
    price: [
      pk ? `${hi}, thanks for your interest!${me} Our packages are: ${pk}. Tell me your date and requirements and I'll suggest the best fit.`
         : `${hi}, thanks for your interest!${me} Pricing depends on your date, guest count and requirements. Could you share these so I can send an exact quote?`,
      "Happy to share a detailed quote. Could you tell me the event date, location and approximate guest count?",
      pk ? `You can see all package details on my service page. ${pk}. I'm glad to customise anything.` : "I'll prepare a quote and send it across shortly. Any special requirements I should include?",
    ],
    date: [
      `${hi}!${me} Could you share your exact event date? I'll check my calendar and confirm right away.`,
      "Thanks for asking! Please send the date and venue city, and I'll confirm availability today.",
      "I'd love to be part of your event. Let me check my schedule for that date and get back to you shortly.",
    ],
    discount: [
      "Thank you for understanding the value of quality work. Let me see what I can do. Could you tell me your budget and the services you need?",
      "I try to keep my pricing fair for every package. If you share your budget, I can suggest a package that fits it.",
      "Let's find a way that works for both of us. Tell me your date and must-haves, and I'll see what I can offer.",
    ],
    advance: [
      "Wonderful, thank you for choosing us! Please confirm your booking through Evencers so your date is secured. I'll approve it right away.",
      "Great! Once the booking request is placed on the platform, I'll confirm it and we can finalise the details together.",
      "Thank you! To lock your date, please send the booking request here on Evencers and choose the payment plan that suits you.",
    ],
    place: [
      "Thanks for asking! Please share your event location and I'll confirm whether I can cover it and if any travel charges apply.",
      "I serve the cities listed on my service page. Could you tell me the venue and city?",
      "I'm happy to travel for events. Share the venue details and I'll confirm everything.",
    ],
    details: [
      "Happy to explain! Each package lists what's included on my service page. Tell me what matters most to you and I'll walk you through it.",
      "Thanks for asking. Could you tell me about your event so I can explain exactly what we'll provide?",
      "Of course! Let me know which package you're considering and I'll share all the details.",
    ],
    thanks: [
      "Thank you so much! Please let me know if you need anything else.",
      "My pleasure! I'm here whenever you have questions.",
      "Thank you! Looking forward to being part of your celebration.",
    ],
    general: [
      `${hi}, thank you for reaching out!${me} How can I help you with your event?`,
      "Thanks for your message! Could you share your event date, location and requirements so I can help properly?",
      "Happy to help! Tell me a little about your event and I'll get back with the details.",
    ],
  };
  return R[intent];
}

async function geminiReplies(msgs, ctx) {
  const convo = msgs.map((m) => `${m.from === "me" ? "VENDOR" : "CUSTOMER"}: ${m.text}`).join("\n");
  const prompt = `You help an Indian event vendor reply to a customer on a booking marketplace chat.
Write 3 different short replies (1-3 sentences each) the vendor could send next. Polite, warm, professional.
Match the customer's language (English, Hindi, or Hinglish). Do not use emojis.
NEVER invent prices, discounts, availability, dates or promises. Only quote prices from the packages listed below;
if the customer asks something you can't know, ask a clarifying question (date, city, guest count) instead.
Vendor: ${ctx.vendorName || "the vendor"}. Packages: ${JSON.stringify(ctx.packages)}.
Conversation (latest last):\n${convo}
Reply ONLY as JSON: {"replies": [string, string, string]}`;
  const out = await geminiJson(prompt, 500);
  const replies = (Array.isArray(out.replies) ? out.replies : []).map((r) => clean(r, 400)).filter((r) => r.length > 5).slice(0, 3);
  if (replies.length < 2) throw new Error("AI replies unusable");
  return replies;
}

// POST /api/vendor-ai/replies   body: { messages: [{ from: "me"|"customer", text }], customerName }
exports.suggestReplies = async (req, res) => {
  try {
    if (!vendorOnly(req, res)) return;
    const msgs = (Array.isArray(req.body.messages) ? req.body.messages : []).slice(-6)
      .map((m) => ({ from: m?.from === "me" ? "me" : "customer", text: clean(m?.text, 500) })).filter((m) => m.text);
    const lastCustomer = [...msgs].reverse().find((m) => m.from === "customer");
    if (!lastCustomer) return res.status(400).json({ error: "There's no customer message to reply to yet." });

    // real package data, so suggested replies quote real prices
    const services = await Vendor.find({ vendorId: req.user.id }).select("vendorName packages price").limit(5).lean();
    const packages = services.flatMap((s) => (s.packages || []).map((p) => ({ name: p.name, price: p.price }))).slice(0, 6);
    const ctx = {
      vendorName: clean(services[0]?.vendorName, 60),
      customerName: clean(req.body.customerName, 40).split(" ")[0],
      packages,
    };

    let replies, source = "builtin";
    if (aiAllowed(req.user.id, "reply")) {
      try { replies = await geminiReplies(msgs, ctx); source = "ai"; }
      catch (e) { console.error("Vendor AI replies fallback:", e.message); }
    }
    if (!replies) replies = builtinReplies(lastCustomer.text, ctx);
    res.json({ replies, source });
  } catch (e) {
    console.error("suggestReplies:", e);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

exports._builtinDescription = builtinDescription;
exports._builtinReplies = builtinReplies;