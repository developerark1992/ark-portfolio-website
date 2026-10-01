// Authenticated dashboard mail — reply to one lead or broadcast to many.
import nodemailer from 'nodemailer';
import { getAdmin, requireUser } from './_lib/supabaseAdmin.js';

const NAME = 'Abdul Rehman Khan';
const SITE = 'arkdesigningbureau.com';
const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

function transporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return {
    user,
    mail: nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } }),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }

  const auth = await requireUser(req);
  if (auth.error) {
    res.status(auth.status || 401).json({ ok: false, error: auth.error });
    return;
  }

  const tx = transporter();
  const db = getAdmin();
  if (!tx) {
    res.status(200).json({ ok: false, error: 'mail-not-configured' });
    return;
  }

  try {
    let b = req.body;
    if (typeof b === 'string') b = JSON.parse(b || '{}');
    b = b || {};

    const kind = String(b.kind || 'reply').trim();
    const subject = String(b.subject || '').trim().slice(0, 200);
    const body = String(b.body || '').trim().slice(0, 8000);
    if (!subject || !body) {
      res.status(400).json({ ok: false, error: 'invalid' });
      return;
    }

    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#0B1620;font-size:15px;line-height:1.65;">
      ${esc(body).replace(/\n/g, '<br>')}
      <p style="margin-top:28px;color:#5b6b7a;font-size:13px;">— ${NAME}<br><a href="https://${SITE}" style="color:#0EA895;">${SITE}</a></p>
    </div>`;

    let recipients = [];
    if (kind === 'broadcast') {
      const ids = Array.isArray(b.leadIds) ? b.leadIds.map(String).slice(0, 100) : [];
      if (!db) {
        res.status(200).json({ ok: false, error: 'crm-not-configured' });
        return;
      }
      let q = db.from('leads').select('id,name,email').order('created_at', { ascending: false }).limit(100);
      if (ids.length) q = q.in('id', ids);
      const { data, error } = await q;
      if (error) {
        res.status(200).json({ ok: false, error: 'query-failed' });
        return;
      }
      recipients = (data || []).filter((r) => r.email);
    } else {
      const email = String(b.to || '').trim();
      const name = String(b.name || '').trim();
      const leadId = b.leadId ? String(b.leadId) : null;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ ok: false, error: 'invalid' });
        return;
      }
      recipients = [{ id: leadId, name, email }];
    }

    if (!recipients.length) {
      res.status(200).json({ ok: false, error: 'no-recipients' });
      return;
    }

    let sent = 0;
    for (const r of recipients) {
      await tx.mail.sendMail({
        from: `"${NAME}" <${tx.user}>`,
        to: r.name ? `"${r.name}" <${r.email}>` : r.email,
        replyTo: tx.user,
        subject,
        text: `${body}\n\n— ${NAME}\n${SITE}`,
        html,
      });
      sent += 1;
      if (db) {
        await db.from('email_logs').insert({
          lead_id: r.id || null,
          to_email: r.email,
          subject,
          body,
          kind,
          status: 'sent',
        });
        if (r.id && kind === 'reply') {
          await db.from('leads').update({ status: 'contacted' }).eq('id', r.id);
        }
      }
    }

    res.status(200).json({ ok: true, sent });
  } catch (e) {
    res.status(200).json({ ok: false, error: 'send-failed', detail: String((e && e.message) || e).slice(0, 200) });
  }
}
