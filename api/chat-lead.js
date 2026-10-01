// Vercel serverless — emails chat leads + transcripts via Gmail SMTP
// and persists them to Supabase CRM when SUPABASE_SERVICE_ROLE_KEY is set.
import nodemailer from 'nodemailer';
import { getAdmin } from './_lib/supabaseAdmin.js';

const NAME = 'Abdul Rehman Khan';
const SITE = 'arkdesigningbureau.com';

const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function phoneOk(v) {
  return String(v || '').replace(/\D/g, '').length >= 7;
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

function leadBlock(d) {
  return `Name: ${d.name}\nEmail: ${d.email}\nPhone: ${d.phone}\nPage: ${d.page || '-'}\nSession: ${d.sessionId || '-'}`;
}

function transcriptText(lines) {
  if (!lines || !lines.length) return '(no messages yet)';
  return lines.map((m) => {
    const who = m.role === 'user' ? (m.name || 'Visitor') : 'Assistant';
    return `${who}: ${String(m.text || '').replace(/\s+/g, ' ').trim()}`;
  }).join('\n\n');
}

function transcriptHtml(lines, visitorName) {
  if (!lines || !lines.length) return '<p style="color:#5b6b7a;">(no messages yet)</p>';
  return lines.map((m) => {
    const isUser = m.role === 'user';
    const who = isUser ? esc(m.name || visitorName || 'Visitor') : 'Assistant';
    const bg = isUser ? '#0EA895' : '#f6f9fb';
    const color = isUser ? '#fff' : '#0B1620';
    const align = isUser ? 'margin-left:18%;' : 'margin-right:18%;';
    return `<div style="margin:0 0 10px;${align}">
      <div style="font-size:11px;color:#5b6b7a;margin:0 0 4px;">${who}</div>
      <div style="background:${bg};color:${color};padding:10px 12px;border-radius:12px;font-size:14px;line-height:1.5;">${esc(m.text).replace(/\n/g, '<br>')}</div>
    </div>`;
  }).join('');
}

async function addEvent(db, leadId, eventType, title, detail) {
  if (!db || !leadId) return;
  const { error } = await db.from('lead_events').insert({
    lead_id: leadId,
    event_type: eventType,
    title,
    detail: detail || '',
  });
  return error ? error.message : null;
}

async function upsertLead(db, d) {
  if (!db) return { id: null, isNew: false, error: 'crm-not-configured' };

  let leadId = null;
  if (d.sessionId) {
    const { data: bySession, error: sErr } = await db
      .from('leads')
      .select('id')
      .eq('session_id', d.sessionId)
      .limit(1);
    if (sErr) return { id: null, isNew: false, error: sErr.message };
    if (bySession && bySession[0]) leadId = bySession[0].id;
  }

  if (!leadId) {
    const { data: byEmail, error: eErr } = await db
      .from('leads')
      .select('id')
      .ilike('email', d.email)
      .order('created_at', { ascending: false })
      .limit(1);
    if (eErr) return { id: null, isNew: false, error: eErr.message };
    if (byEmail && byEmail[0]) leadId = byEmail[0].id;
  }

  const row = {
    name: d.name,
    email: d.email,
    phone: d.phone,
    page: d.page || null,
    session_id: d.sessionId || null,
    source: 'chat',
    updated_at: new Date().toISOString(),
  };

  if (leadId) {
    const { error } = await db.from('leads').update(row).eq('id', leadId);
    if (error) return { id: null, isNew: false, error: error.message };
    return { id: leadId, isNew: false, error: null };
  }

  const { data, error } = await db.from('leads').insert({ ...row, status: 'new' }).select('id').single();
  if (error) return { id: null, isNew: false, error: error.message };
  return { id: data?.id || null, isNew: true, error: null };
}

async function upsertSession(db, d, leadId, lines) {
  if (!db || !d.sessionId) return null;
  const payload = {
    session_id: d.sessionId,
    lead_id: leadId,
    page: d.page || null,
    visitor_name: d.name,
    visitor_email: d.email,
    visitor_phone: d.phone,
    message_count: Array.isArray(lines) ? lines.length : 0,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: findErr } = await db
    .from('chat_sessions')
    .select('id')
    .eq('session_id', d.sessionId)
    .limit(1);
  if (findErr) return findErr.message;

  if (existing && existing[0]) {
    const { error } = await db.from('chat_sessions').update(payload).eq('id', existing[0].id);
    if (error) return error.message;
  } else {
    const { error } = await db.from('chat_sessions').insert(payload);
    if (error) return error.message;
  }

  if (lines && lines.length) {
    await db.from('chat_messages').delete().eq('session_id', d.sessionId);
    const { error: msgErr } = await db.from('chat_messages').insert(
      lines.map((m) => ({
        session_id: d.sessionId,
        role: m.role === 'user' ? 'user' : 'bot',
        body: m.text,
      }))
    );
    if (msgErr) return msgErr.message;
    const lastUser = [...lines].reverse().find((m) => m.role === 'user');
    if (leadId && lastUser) {
      await db.from('leads').update({ last_message: lastUser.text.slice(0, 500) }).eq('id', leadId);
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }

  try {
    let b = req.body;
    if (typeof b === 'string') {
      try { b = JSON.parse(b || '{}'); } catch { b = {}; }
    }
    /* sendBeacon sometimes arrives as raw / Buffer */
    if (b && Buffer.isBuffer(b)) {
      try { b = JSON.parse(b.toString('utf8') || '{}'); } catch { b = {}; }
    }
    b = b || {};

    const d = {
      name: String(b.name || '').trim().slice(0, 120),
      email: String(b.email || '').trim().slice(0, 160),
      phone: String(b.phone || '').trim().slice(0, 60),
      page: String(b.page || '').trim().slice(0, 300),
      sessionId: String(b.sessionId || '').trim().slice(0, 80),
      action: String(b.action || 'start').trim(),
    };

    if (!d.name || !isEmail(d.email) || !phoneOk(d.phone)) {
      res.status(400).json({ ok: false, error: 'invalid' });
      return;
    }

    const lines = Array.isArray(b.messages)
      ? b.messages.slice(0, 80).map((m) => ({
          role: m && m.role === 'user' ? 'user' : 'bot',
          text: String((m && m.text) || '').trim().slice(0, 2000),
          name: d.name,
        })).filter((m) => m.text)
      : [];

    const db = getAdmin();
    let leadId = null;
    let isNewLead = false;
    let storeError = null;

    if (!db) {
      storeError = 'crm-not-configured';
    } else {
      const up = await upsertLead(db, d);
      leadId = up.id;
      isNewLead = !!up.isNew;
      if (up.error) storeError = up.error;

      if (leadId) {
        const saveMessages = d.action === 'transcript' || d.action === 'end' || d.action === 'sync';
        const sessErr = await upsertSession(db, d, leadId, saveMessages ? lines : []);
        if (sessErr) storeError = storeError || sessErr;

        if (d.action === 'start' || d.action === 'return') {
          await addEvent(
            db,
            leadId,
            d.action === 'return' ? 'returned' : (isNewLead ? 'new_lead' : 'chat_started'),
            d.action === 'return'
              ? `${d.name} signed in / returned`
              : (isNewLead ? `${d.name} became a lead` : `${d.name} started a chat`),
            `${d.email} · ${d.phone}`
          );
        }
        if (d.action === 'transcript' || d.action === 'end') {
          await addEvent(
            db,
            leadId,
            'transcript',
            `${d.name} ended a chat session`,
            `${lines.length} messages saved`
          );
        }
      }
    }

    /* Mid-chat sync — store only, no email */
    if (d.action === 'sync') {
      res.status(200).json({ ok: !!leadId, stored: !!leadId, leadId, error: storeError });
      return;
    }

    const tx = transporter();
    const to = tx ? (process.env.CONTACT_TO || tx.user) : null;

    async function mailSafe(opts) {
      if (!tx) return false;
      try {
        await tx.mail.sendMail(opts);
        return true;
      } catch {
        return false;
      }
    }

    if (d.action === 'return') {
      const emailed = await mailSafe({
        from: `"${NAME} — Chat" <${tx.user}>`,
        to,
        replyTo: `"${d.name}" <${d.email}>`,
        subject: `Returning visitor — ${d.name}`,
        text: `Existing visitor returned to chat on ${SITE}\n\n${leadBlock(d)}`,
        html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
          <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0EA895;font-weight:700;">Returning visitor</div>
          <h1 style="font-size:22px;margin:8px 0 16px;color:#0B1620;">${esc(d.name)} signed in again</h1>
          <p style="font-size:14px;color:#5b6b7a;line-height:1.6;">${esc(d.email)} · ${esc(d.phone)}<br>${esc(d.page || SITE)}</p>
        </div>`,
      });
      res.status(200).json({ ok: !!leadId, stored: !!leadId, emailed, leadId, returning: true, error: storeError });
      return;
    }

    if (d.action === 'transcript' || d.action === 'end') {
      if (!lines.length) {
        res.status(200).json({ ok: !!leadId, skipped: true, stored: !!leadId, leadId, error: storeError });
        return;
      }
      const emailed = await mailSafe({
        from: `"${NAME} — Chat" <${tx.user}>`,
        to,
        replyTo: `"${d.name}" <${d.email}>`,
        subject: `Chat transcript — ${d.name}`,
        text: `Chat transcript from ${SITE}\n\n${leadBlock(d)}\n\n———\n\n${transcriptText(lines)}`,
        html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
          <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0EA895;font-weight:700;">Chat transcript</div>
          <h1 style="font-size:22px;margin:8px 0 16px;color:#0B1620;">${esc(d.name)}</h1>
          <p style="font-size:14px;color:#5b6b7a;line-height:1.6;margin:0 0 18px;">
            <b style="color:#0B1620;">${esc(d.email)}</b><br>
            ${esc(d.phone)}<br>
            ${esc(d.page || SITE)}
          </p>
          <div style="border-top:1px solid #eef2f6;padding-top:16px;">${transcriptHtml(lines, d.name)}</div>
        </div>`,
      });
      res.status(200).json({ ok: !!leadId, stored: !!leadId, emailed, leadId, error: storeError });
      return;
    }

    /* Default: start — lead stored above; email is best-effort */
    const emailed = await mailSafe({
      from: `"${NAME} — Chat" <${tx && tx.user}>`,
      to,
      replyTo: `"${d.name}" <${d.email}>`,
      subject: `New chat started — ${d.name}`,
      text: `Someone started a chat on ${SITE}\n\n${leadBlock(d)}\n\nYou'll get another email with the transcript when they leave.`,
      html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
        <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0EA895;font-weight:700;">New chat lead</div>
        <h1 style="font-size:22px;margin:8px 0 16px;color:#0B1620;">${esc(d.name)} started a chat</h1>
        <p style="font-size:14px;color:#5b6b7a;line-height:1.6;">${esc(d.email)} · ${esc(d.phone)}<br>${esc(d.page || SITE)}</p>
      </div>`,
    });

    res.status(200).json({
      ok: !!leadId || (!db && emailed),
      stored: !!leadId,
      emailed,
      leadId,
      error: storeError,
    });
  } catch (e) {
    res.status(200).json({ ok: false, error: 'send-failed', detail: String((e && e.message) || e).slice(0, 200) });
  }
}
