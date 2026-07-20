// Vercel serverless function — proxies chat to Google Gemini.
// The API key lives ONLY in the GEMINI_API_KEY environment variable (set in
// Vercel → Settings → Environment Variables). It is never shipped to the browser.
// If the key is missing or the call fails, we return ok:false so the client
// falls back to its built-in scripted assistant.

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const SYSTEM = `You are the assistant on Abdul Rehman Khan's portfolio site (arkdesigningbureau.com).
Abdul is a solo freelance CMS EXPERT and software engineer based in Karachi, Pakistan, with 8+ years of experience and 90+ projects shipped.
He builds websites on ANY platform — WordPress, WooCommerce, Shopify, Webflow, Wix, Squarespace, Framer — plus custom Astro / Next.js / React.
He also handles DevOps & hosting (WHM/cPanel, AWS, Cloudflare, domains, DNS/SSL, migrations, CI/CD), graphic design & branding, and AI + workflow automation (Claude, ChatGPT, n8n, Make, Zapier).
He works remotely for clients worldwide and is open to EU/UK relocation with visa sponsorship.
Pricing: projects start around PKR 100,000 and scale up with scope; give ballparks only and point people to the cost calculator (/estimate) for a live estimate, or to book a free 30-min strategy call (/contact).
Contact: WhatsApp/phone +92 315 9429998, email ark.educationalist@gmail.com, Calendly at /contact.
Rules: Be warm, concise (2-4 sentences), and helpful. Never invent facts, fake clients, or specific prices beyond the ranges above. When someone shows buying intent, encourage them to book a strategy call or send a project brief. Answer in the user's language.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  const key = process.env.GEMINI_API_KEY;
  if (!key) { res.status(200).json({ ok: false, error: 'no-key' }); return; }

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    body = body || {};
    const history = Array.isArray(body.history) ? body.history : [];
    const message = String(body.message || '').slice(0, 2000);
    if (!message) { res.status(400).json({ ok: false, error: 'empty' }); return; }

    // build Gemini "contents" from prior turns + the new message
    const contents = [];
    for (const m of history.slice(-8)) {
      if (!m || !m.text) continue;
      contents.push({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: String(m.text).slice(0, 2000) }] });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      res.status(200).json({ ok: false, error: 'upstream', status: r.status, detail: detail.slice(0, 300) });
      return;
    }
    const data = await r.json();
    const reply = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    if (!reply) { res.status(200).json({ ok: false, error: 'no-reply' }); return; }
    res.status(200).json({ ok: true, reply });
  } catch (e) {
    res.status(200).json({ ok: false, error: 'exception', detail: String(e).slice(0, 300) });
  }
}
