import { getAdmin } from './_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false });
    return;
  }

  const db = getAdmin();
  if (!db) {
    res.status(200).json({ ok: false, error: 'not-configured' });
    return;
  }

  try {
    let b = req.body;
    if (typeof b === 'string') b = JSON.parse(b || '{}');
    b = b || {};

    const path = String(b.path || '/').trim().slice(0, 300) || '/';
    if (path.startsWith('/dashboard') || path.startsWith('/api')) {
      res.status(200).json({ ok: true, skipped: true });
      return;
    }

    const visitorId = String(b.visitorId || '').trim().slice(0, 80);
    if (!visitorId || visitorId.length < 8) {
      res.status(400).json({ ok: false, error: 'invalid' });
      return;
    }

    await db.from('page_views').insert({
      visitor_id: visitorId,
      session_id: String(b.sessionId || '').trim().slice(0, 80) || null,
      path,
      referrer: String(b.referrer || '').trim().slice(0, 500) || null,
      title: String(b.title || '').trim().slice(0, 200) || null,
      user_agent: String(req.headers['user-agent'] || '').slice(0, 300) || null,
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, error: 'failed' });
  }
}
