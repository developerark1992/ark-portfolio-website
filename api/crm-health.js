// Quick CRM config check — does not expose secrets.
import { getAdmin } from './_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }

  const hasUrl = !!(process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const hasService =
    !!(process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE);
  const hasAnon = !!(process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);

  const db = getAdmin();
  if (!db) {
    res.status(200).json({
      ok: false,
      configured: false,
      hasUrl,
      hasService,
      hasAnon,
      error: 'crm-not-configured',
      hint: 'Set SUPABASE_SERVICE_ROLE_KEY on Vercel (Legacy service_role key) and redeploy.',
    });
    return;
  }

  try {
    const { error } = await db.from('leads').select('id', { count: 'exact', head: true });
    if (error) {
      res.status(200).json({
        ok: false,
        configured: true,
        hasUrl,
        hasService,
        hasAnon,
        error: error.message,
        hint:
          error.message && /api key/i.test(error.message)
            ? 'SUPABASE_SERVICE_ROLE_KEY is wrong. In Supabase → Project Settings → API → Legacy API keys, copy service_role (secret), paste into Vercel env, redeploy.'
            : error.message && /relation|does not exist/i.test(error.message)
              ? 'Run supabase/crm.sql in the Supabase SQL Editor.'
              : 'Check Supabase tables and RLS; service_role should bypass RLS.',
      });
      return;
    }
    res.status(200).json({ ok: true, configured: true, hasUrl, hasService, hasAnon, leadsTable: true });
  } catch (e) {
    res.status(200).json({
      ok: false,
      configured: true,
      error: String((e && e.message) || e).slice(0, 200),
    });
  }
}
