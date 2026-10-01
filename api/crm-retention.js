// Weekly CRM retention — free-tier friendly (Vercel Cron + Gmail dump).
// 1) Export rows past retention as Excel-ready CSVs
// 2) Email them to CONTACT_TO / GMAIL_USER
// 3) Only delete after a successful email (or when there is nothing to purge)
import nodemailer from 'nodemailer';
import { getAdmin, requireUser } from './_lib/supabaseAdmin.js';

const NAME = 'Abdul Rehman Khan';
const SITE = 'arkdesigningbureau.com';

const RETENTION = {
  pageViewsDays: Number(process.env.CRM_RETENTION_PAGE_VIEWS_DAYS || 90),
  chatMonths: Number(process.env.CRM_RETENTION_CHAT_MONTHS || 18),
  eventsMonths: Number(process.env.CRM_RETENTION_EVENTS_MONTHS || 12),
  emailLogsMonths: Number(process.env.CRM_RETENTION_EMAIL_LOGS_MONTHS || 12),
  visitorMonths: Number(process.env.CRM_RETENTION_VISITOR_MONTHS || 24),
};

function daysAgo(n) {
  return new Date(Date.now() - n * 864e5).toISOString();
}
function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

function csvEscape(v) {
  const s = v == null ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows) {
  if (!rows || !rows.length) return '';
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(',')];
  for (const row of rows) {
    lines.push(keys.map((k) => csvEscape(row[k])).join(','));
  }
  /* BOM so Excel opens UTF-8 correctly */
  return `\uFEFF${lines.join('\n')}`;
}

async function authorized(req) {
  const cronHeader = req.headers['x-vercel-cron'];
  if (cronHeader) return true;
  const secret = process.env.CRON_SECRET;
  const auth = String(req.headers.authorization || '');
  if (secret && auth === `Bearer ${secret}`) return true;
  /* Dashboard admin (logged-in Supabase user) may run manually */
  if (auth.startsWith('Bearer ')) {
    const user = await requireUser(req);
    if (!user.error) return true;
  }
  return false;
}

function transporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return {
    user,
    mail: nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } }),
  };
}

async function fetchBefore(db, table, column, beforeIso, limit = 2000) {
  const { data, error } = await db
    .from(table)
    .select('*')
    .lt(column, beforeIso)
    .order(column, { ascending: true })
    .limit(limit);
  if (error) throw new Error(`${table}: ${error.message}`);
  return data || [];
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }

  if (!(await authorized(req))) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  let dryParam = '';
  try {
    const u = new URL(req.url || '', 'http://localhost');
    dryParam = u.searchParams.get('dry') || '';
  } catch {}
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch { body = {}; }
  }
  body = body || {};
  const dryRun = String(dryParam || body.dry || '') === '1';
  const db = getAdmin();
  if (!db) {
    res.status(200).json({ ok: false, error: 'crm-not-configured' });
    return;
  }

  const cutoffs = {
    page_views: daysAgo(RETENTION.pageViewsDays),
    chat_sessions: monthsAgo(RETENTION.chatMonths),
    lead_events: monthsAgo(RETENTION.eventsMonths),
    email_logs: monthsAgo(RETENTION.emailLogsMonths),
    visitor_accounts: monthsAgo(RETENTION.visitorMonths),
  };

  try {
    const pageViews = await fetchBefore(db, 'page_views', 'created_at', cutoffs.page_views);
    const chatSessions = await fetchBefore(db, 'chat_sessions', 'updated_at', cutoffs.chat_sessions);
    const sessionIds = chatSessions.map((s) => s.session_id).filter(Boolean);

    let chatMessages = [];
    if (sessionIds.length) {
      /* batch in chunks of 100 */
      for (let i = 0; i < sessionIds.length; i += 100) {
        const chunk = sessionIds.slice(i, i + 100);
        const { data, error } = await db.from('chat_messages').select('*').in('session_id', chunk).limit(5000);
        if (error) throw new Error(`chat_messages: ${error.message}`);
        chatMessages = chatMessages.concat(data || []);
      }
    }

    const events = await fetchBefore(db, 'lead_events', 'created_at', cutoffs.lead_events);
    const emailLogs = await fetchBefore(db, 'email_logs', 'created_at', cutoffs.email_logs);

    /* Visitors inactive: prefer last_seen_at, fall back to created_at via filter in JS after fetch */
    const { data: visitorsRaw, error: vErr } = await db
      .from('visitor_accounts')
      .select('*')
      .or(`last_seen_at.lt.${cutoffs.visitor_accounts},and(last_seen_at.is.null,created_at.lt.${cutoffs.visitor_accounts})`)
      .limit(2000);
    if (vErr) throw new Error(`visitor_accounts: ${vErr.message}`);
    const visitors = visitorsRaw || [];

    const packs = [
      { name: 'page_views', rows: pageViews },
      { name: 'chat_sessions', rows: chatSessions },
      { name: 'chat_messages', rows: chatMessages },
      { name: 'lead_events', rows: events },
      { name: 'email_logs', rows: emailLogs },
      { name: 'visitor_accounts', rows: visitors },
    ];

    const counts = Object.fromEntries(packs.map((p) => [p.name, p.rows.length]));
    const total = packs.reduce((n, p) => n + p.rows.length, 0);

    if (total === 0) {
      res.status(200).json({
        ok: true,
        purged: false,
        dryRun,
        message: 'Nothing past retention — no email, no deletes.',
        retention: RETENTION,
        cutoffs,
        counts,
      });
      return;
    }

    if (dryRun) {
      res.status(200).json({ ok: true, dryRun: true, wouldPurge: counts, retention: RETENTION, cutoffs });
      return;
    }

    const tx = transporter();
    if (!tx) {
      res.status(200).json({
        ok: false,
        error: 'mail-not-configured',
        hint: 'Set GMAIL_USER + GMAIL_APP_PASSWORD so dumps can be emailed before delete.',
        counts,
      });
      return;
    }

    const stamp = new Date().toISOString().slice(0, 10);
    const attachments = packs
      .filter((p) => p.rows.length)
      .map((p) => ({
        filename: `ark-crm-${p.name}-${stamp}.csv`,
        content: toCsv(p.rows),
        contentType: 'text/csv; charset=utf-8',
      }));

    const summary = packs
      .filter((p) => p.rows.length)
      .map((p) => `• ${p.name}: ${p.rows.length}`)
      .join('\n');

    await tx.mail.sendMail({
      from: `"${NAME} — CRM retention" <${tx.user}>`,
      to: process.env.CONTACT_TO || tx.user,
      subject: `ARK CRM retention dump — ${stamp}`,
      text: `Weekly CRM retention for ${SITE}

These CSV files open in Excel / Google Sheets. Keep them as your long-term archive.

Rows exported (then deleted from live DB):
${summary}

Policy:
• Page views: ${RETENTION.pageViewsDays} days
• Chat transcripts: ${RETENTION.chatMonths} months
• Activity events: ${RETENTION.eventsMonths} months
• Email logs: ${RETENTION.emailLogsMonths} months
• Inactive visitor accounts: ${RETENTION.visitorMonths} months
• Leads: kept forever (not auto-deleted)

— Automated job on Vercel Cron
`,
      attachments,
    });

    /* Delete only after successful email */
    const deleted = {};

    if (pageViews.length) {
      const ids = pageViews.map((r) => r.id);
      for (let i = 0; i < ids.length; i += 200) {
        const { error } = await db.from('page_views').delete().in('id', ids.slice(i, i + 200));
        if (error) throw new Error(`delete page_views: ${error.message}`);
      }
      deleted.page_views = ids.length;
    }

    if (sessionIds.length) {
      /* messages cascade from chat_sessions.session_id FK */
      for (let i = 0; i < sessionIds.length; i += 100) {
        const { error } = await db.from('chat_sessions').delete().in('session_id', sessionIds.slice(i, i + 100));
        if (error) throw new Error(`delete chat_sessions: ${error.message}`);
      }
      deleted.chat_sessions = sessionIds.length;
      deleted.chat_messages = chatMessages.length;
    }

    if (events.length) {
      const ids = events.map((r) => r.id);
      for (let i = 0; i < ids.length; i += 200) {
        const { error } = await db.from('lead_events').delete().in('id', ids.slice(i, i + 200));
        if (error) throw new Error(`delete lead_events: ${error.message}`);
      }
      deleted.lead_events = ids.length;
    }

    if (emailLogs.length) {
      const ids = emailLogs.map((r) => r.id);
      for (let i = 0; i < ids.length; i += 200) {
        const { error } = await db.from('email_logs').delete().in('id', ids.slice(i, i + 200));
        if (error) throw new Error(`delete email_logs: ${error.message}`);
      }
      deleted.email_logs = ids.length;
    }

    if (visitors.length) {
      const ids = visitors.map((r) => r.id);
      for (let i = 0; i < ids.length; i += 200) {
        const { error } = await db.from('visitor_accounts').delete().in('id', ids.slice(i, i + 200));
        if (error) throw new Error(`delete visitor_accounts: ${error.message}`);
      }
      deleted.visitor_accounts = ids.length;
    }

    /* Best-effort audit row in email_logs */
    try {
      await db.from('email_logs').insert({
        to_email: process.env.CONTACT_TO || tx.user,
        subject: `ARK CRM retention dump — ${stamp}`,
        body: summary,
        kind: 'retention',
        status: 'sent',
      });
    } catch {}

    res.status(200).json({
      ok: true,
      emailed: true,
      deleted,
      retention: RETENTION,
      cutoffs,
      attachments: attachments.map((a) => a.filename),
    });
  } catch (e) {
    res.status(200).json({
      ok: false,
      error: 'retention-failed',
      detail: String((e && e.message) || e).slice(0, 300),
    });
  }
}
