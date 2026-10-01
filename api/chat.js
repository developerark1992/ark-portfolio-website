// Vercel serverless — chat proxy for the on-site assistant.
// Prefers free Groq (GROQ_API_KEY), then Google Gemini (GEMINI_API_KEY).
// Keys live only in Vercel env vars — never in the browser.
// If every provider fails, return ok:false so the client uses scripted replies.

const SYSTEM = `You are the assistant on Abdul Rehman Khan's portfolio site (arkdesigningbureau.com).
Always refer to him as Abdul Rehman Khan — freelance lead with a mini team of freelancers under the brand ARK Designing Bureau (not a registered company). Based in Karachi, Pakistan. Building since 2013 (13+ years). 90+ projects shipped.
He builds websites on ANY major CMS — WordPress, WooCommerce, Shopify, Webflow, Wix, Squarespace, Framer — plus Astro / Next.js / React, .NET, AWS, design, SEO/digital marketing, and AI automation (Claude, ChatGPT, n8n, Make, Zapier). Also staff augmentation for startup agencies.
He works remotely worldwide. Primary markets: United States, Canada, UAE, UK. Quotes in USD, CAD, AED, GBP, or PKR.
Pricing: projects start around PKR 100,000 and scale with scope — give ballparks only; point people to /estimate for a live calculator or /contact for a free 30-min strategy call.
Contact: WhatsApp +92 315 9429998, email ark.educationalist@gmail.com.
Rules: Warm, concise (2-4 sentences), helpful. Never invent clients or exact prices. On buying intent, suggest a strategy call or project brief. Answer in the user's language.`;

const GROQ_MODELS = [process.env.GROQ_MODEL, 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'].filter(Boolean);
const GEMINI_MODELS = [process.env.GEMINI_MODEL, 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.0-flash'].filter(Boolean);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeBody(req) {
  let body = req.body;
  if (typeof body === 'string') body = JSON.parse(body || '{}');
  return body || {};
}

function buildTurns(body) {
  const history = Array.isArray(body.history) ? body.history : [];
  const message = String(body.message || '').slice(0, 2000);
  const turns = [];
  for (const m of history.slice(-8)) {
    if (!m || !m.text) continue;
    turns.push({ role: m.role === 'user' ? 'user' : 'assistant', text: String(m.text).slice(0, 2000) });
  }
  // Avoid duplicating the latest user turn when the client already pushed it into history.
  const last = turns[turns.length - 1];
  if (!(last && last.role === 'user' && last.text === message) && message) {
    turns.push({ role: 'user', text: message });
  }
  return { message, turns };
}

async function askGroq(key, turns) {
  const messages = [{ role: 'system', content: SYSTEM }];
  for (const t of turns) {
    messages.push({ role: t.role === 'user' ? 'user' : 'assistant', content: t.text });
  }
  let last = { status: 0, detail: '', model: '' };
  for (const model of GROQ_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.6,
          max_tokens: 400,
          messages,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const reply = String(data.choices?.[0]?.message?.content || '').trim();
        if (reply) return { ok: true, reply, model: `groq:${model}` };
        last = { status: 200, detail: 'empty', model };
        break;
      }
      last = { status: r.status, detail: (await r.text().catch(() => '')).slice(0, 200), model };
      if ((r.status === 429 || r.status === 503) && attempt === 0) {
        await sleep(700);
        continue;
      }
      break;
    }
  }
  return { ok: false, ...last };
}

async function askGemini(key, turns) {
  const contents = turns.map((t) => ({
    role: t.role === 'user' ? 'user' : 'model',
    parts: [{ text: t.text }],
  }));
  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents,
    generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
  });
  let last = { status: 0, detail: '', model: '' };
  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: payload,
      });
      if (r.ok) {
        const data = await r.json();
        const reply = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
        if (reply) return { ok: true, reply, model: `gemini:${model}` };
        last = { status: 200, detail: 'empty', model };
        break;
      }
      last = { status: r.status, detail: (await r.text().catch(() => '')).slice(0, 200), model };
      if (r.status === 503 && attempt === 0) {
        await sleep(800);
        continue;
      }
      break;
    }
  }
  return { ok: false, ...last };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }

  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!groqKey && !geminiKey) {
    res.status(200).json({ ok: false, error: 'no-key' });
    return;
  }

  try {
    const body = normalizeBody(req);
    const { message, turns } = buildTurns(body);
    if (!message) {
      res.status(400).json({ ok: false, error: 'empty' });
      return;
    }

    if (groqKey) {
      const g = await askGroq(groqKey, turns);
      if (g.ok) {
        res.status(200).json({ ok: true, reply: g.reply, model: g.model });
        return;
      }
    }

    if (geminiKey) {
      const g = await askGemini(geminiKey, turns);
      if (g.ok) {
        res.status(200).json({ ok: true, reply: g.reply, model: g.model });
        return;
      }
      res.status(200).json({ ok: false, error: 'upstream', status: g.status, model: g.model, detail: g.detail });
      return;
    }

    res.status(200).json({ ok: false, error: 'upstream', detail: 'groq-failed-no-gemini' });
  } catch (e) {
    res.status(200).json({ ok: false, error: 'exception', detail: String(e).slice(0, 300) });
  }
}
