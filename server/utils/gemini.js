// Tiny helper around Google's free Gemini API. Used by the vendor AI helper.
// Everything that calls this must have a built-in fallback: it throws on any problem.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 20;
const counts = new Map();               // `${bucket}:${userId}` → { day, n }

// true if a Gemini key exists and this user still has AI calls left today
function aiAllowed(userId, bucket = "default") {
  if (!process.env.GEMINI_API_KEY) return false;
  const key = `${bucket}:${userId}`;
  const day = new Date().toISOString().slice(0, 10);
  const rec = counts.get(key);
  if (!rec || rec.day !== day) { counts.set(key, { day, n: 1 }); return true; }
  if (rec.n >= DAILY_LIMIT) return false;
  rec.n += 1;
  return true;
}

async function geminiJson(prompt, maxOutputTokens = 900) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, responseMimeType: "application/json", maxOutputTokens },
        }),
      }
    );
    if (!r.ok) throw new Error(`Gemini ${r.status}`);
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    return JSON.parse(text.replace(/^```json|```$/g, "").trim());
  } finally { clearTimeout(timer); }
}

module.exports = { aiAllowed, geminiJson };