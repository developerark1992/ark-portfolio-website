// Visitor signup / sign-in for chat — scrypt passwords, CRM lead + return events.
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import nodemailer from 'nodemailer';
import { getAdmin } from './_lib/supabaseAdmin.js';

const NAME = 'Abdul Rehman Khan';
const SITE = 'arkdesigningbureau.com';

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function phoneOk(v) {
  return String(v || '').replace(/\D/g, '').length >= 7;
}
function hashPass(pass) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(pass), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPass(pass, stored) {
  try {
    const [salt, hash] = String(stored || '').split(':');
    if (!salt || !hash) return false;
    const next = scryptSync(String(pass), salt, 64);
    const prev = Buffer.from(hash, 'hex');
    if (prev.length !== next.length) return false;
    return timingSafeEqual(prev, next);
  } catch {
    return false;
  }
}
function newToken() {
  return randomBytes(24).toString('hex');
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

async function upsertLead(db, d) {
  const email = d.email.toLowerCase();
  const { data: existing } = await db.from('leads').select('id').ilike('email', email).order('created_at', { ascending: false }).limit(1).maybeSingle();
  const row = {
    name: d.name,
    email: d.email,
    phone: d.phone,
    page: d.page || null,
    session_id: d.sessionId || null,
    source: d.source || 'chat',
    updated_at: new Date().toISOString(),
  };
  if (existing?.id) {
    await db.from('leads').update(row).eq('id', existing.id);
    return existing.id;
  }
  const { data, error } = await db.from('leads').insert({ ...row, status: 'new' }).select('id').single();
  if (error) throw error;
  return data.id;
}

async function addEvent(db, leadId, eventType, title, detail) {
  if (!db || !leadId) return;
  await db.from('lead_events').insert({
    lead_id: leadId,
    event_type: eventType,
    title,
    detail: detail || '',
  });
}

async function mailAdmin(subject, text) {
  const tx = transporter();
  if (!tx) return false;
  await tx.mail.sendMail({
    from: `"${NAME} — Chat" <${tx.user}>`,
    to: process.env.CONTACT_TO || tx.user,
    subject,
    text,
  });
  return true;
}

function publicVisitor(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    token: row.session_token,
    leadId: row.lead_id,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }

  const db = getAdmin();
  if (!db) {
    res.status(200).json({ ok: false, error: 'crm-not-configured' });
    return;
  }

  try {
    let b = req.body;
    if (typeof b === 'string') b = JSON.parse(b || '{}');
    b = b || {};
    const action = String(b.action || '').trim();
    const page = String(b.page || '').trim().slice(0, 300);
    const sessionId = String(b.sessionId || '').trim().slice(0, 80);

    if (action === 'signup') {
      const name = String(b.name || '').trim().slice(0, 120);
      const email = String(b.email || '').trim().slice(0, 160).toLowerCase();
      const phone = String(b.phone || '').trim().slice(0, 60);
      const password = String(b.password || '');
      if (!name || !isEmail(email) || !phoneOk(phone) || password.length < 6) {
        res.status(400).json({ ok: false, error: 'invalid' });
        return;
      }
      const { data: exists } = await db.from('visitor_accounts').select('id').eq('email', email).maybeSingle();
      if (exists?.id) {
        res.status(200).json({ ok: false, error: 'exists' });
        return;
      }
      const leadId = await upsertLead(db, { name, email, phone, page, sessionId, source: 'chat-signup' });
      const token = newToken();
      const { data: acc, error } = await db.from('visitor_accounts').insert({
        email,
        password_hash: hashPass(password),
        name,
        phone,
        lead_id: leadId,
        session_token: token,
        last_seen_at: new Date().toISOString(),
      }).select('*').single();
      if (error) {
        res.status(200).json({ ok: false, error: 'signup-failed' });
        return;
      }
      await addEvent(db, leadId, 'signup', `${name} created a chat account`, email);
      await mailAdmin(
        `New chat signup — ${name}`,
        `A visitor signed up for chat on ${SITE}\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nPage: ${page || '-'}`
      );
      res.status(200).json({ ok: true, visitor: publicVisitor(acc), leadId });
      return;
    }

    if (action === 'login') {
      const email = String(b.email || '').trim().slice(0, 160).toLowerCase();
      const password = String(b.password || '');
      if (!isEmail(email) || !password) {
        res.status(400).json({ ok: false, error: 'invalid' });
        return;
      }
      const { data: acc } = await db.from('visitor_accounts').select('*').eq('email', email).maybeSingle();
      if (!acc || !verifyPass(password, acc.password_hash)) {
        res.status(200).json({ ok: false, error: 'bad-credentials' });
        return;
      }
      const token = newToken();
      const leadId = await upsertLead(db, {
        name: acc.name,
        email: acc.email,
        phone: acc.phone,
        page,
        sessionId,
        source: 'chat-return',
      });
      await db.from('visitor_accounts').update({
        session_token: token,
        lead_id: leadId,
        last_seen_at: new Date().toISOString(),
      }).eq('id', acc.id);
      await addEvent(db, leadId, 'returned', `${acc.name} signed in again`, `${acc.email} visited chat`);
      await mailAdmin(
        `Returning visitor signed in — ${acc.name}`,
        `An existing chat visitor signed in on ${SITE}\n\nName: ${acc.name}\nEmail: ${acc.email}\nPhone: ${acc.phone}\nPage: ${page || '-'}`
      );
      res.status(200).json({
        ok: true,
        returning: true,
        visitor: publicVisitor({ ...acc, session_token: token, lead_id: leadId }),
        leadId,
      });
      return;
    }

    if (action === 'session') {
      const token = String(b.token || '').trim();
      if (!token || token.length < 16) {
        res.status(400).json({ ok: false, error: 'invalid' });
        return;
      }
      const { data: acc } = await db.from('visitor_accounts').select('*').eq('session_token', token).maybeSingle();
      if (!acc) {
        res.status(200).json({ ok: false, error: 'expired' });
        return;
      }
      const leadId = await upsertLead(db, {
        name: acc.name,
        email: acc.email,
        phone: acc.phone,
        page,
        sessionId,
        source: 'chat-return',
      });
      await db.from('visitor_accounts').update({
        lead_id: leadId,
        last_seen_at: new Date().toISOString(),
      }).eq('id', acc.id);
      await addEvent(db, leadId, 'returned', `${acc.name} returned to chat`, `${acc.email} opened chat (saved account)`);
      await mailAdmin(
        `Existing visitor returned — ${acc.name}`,
        `Saved chat visitor opened the assistant on ${SITE}\n\nName: ${acc.name}\nEmail: ${acc.email}\nPhone: ${acc.phone}\nPage: ${page || '-'}`
      );
      res.status(200).json({
        ok: true,
        returning: true,
        visitor: publicVisitor({ ...acc, lead_id: leadId }),
        leadId,
      });
      return;
    }

    res.status(400).json({ ok: false, error: 'unknown-action' });
  } catch (e) {
    res.status(200).json({ ok: false, error: 'failed', detail: String((e && e.message) || e).slice(0, 200) });
  }
}
