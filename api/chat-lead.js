// Vercel serverless — emails chat leads + transcripts via Gmail SMTP
// (same credentials as /api/contact: GMAIL_USER, GMAIL_APP_PASSWORD, CONTACT_TO)
import nodemailer from 'nodemailer';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }

  const tx = transporter();
  if (!tx) {
    res.status(200).json({ ok: false, error: 'not-configured' });
    return;
  }

  try {
    let b = req.body;
    if (typeof b === 'string') b = JSON.parse(b || '{}');
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

    const to = process.env.CONTACT_TO || tx.user;
    const lines = Array.isArray(b.messages)
      ? b.messages.slice(0, 80).map((m) => ({
          role: m && m.role === 'user' ? 'user' : 'bot',
          text: String((m && m.text) || '').trim().slice(0, 2000),
          name: d.name,
        })).filter((m) => m.text)
      : [];

    if (d.action === 'transcript') {
      if (!lines.length) {
        res.status(200).json({ ok: true, skipped: true });
        return;
      }
      await tx.mail.sendMail({
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
          <p style="margin-top:20px;"><a href="mailto:${encodeURIComponent(d.email)}" style="display:inline-block;background:#0EA895;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600;">Reply to ${esc(d.name.split(' ')[0])} →</a></p>
        </div>`,
      });
      res.status(200).json({ ok: true });
      return;
    }

    /* Default: new chat started */
    await tx.mail.sendMail({
      from: `"${NAME} — Chat" <${tx.user}>`,
      to,
      replyTo: `"${d.name}" <${d.email}>`,
      subject: `New chat started — ${d.name}`,
      text: `Someone started a chat on ${SITE}\n\n${leadBlock(d)}\n\nYou'll get another email with the transcript when they leave.`,
      html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
        <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0EA895;font-weight:700;">New chat lead</div>
        <h1 style="font-size:22px;margin:8px 0 16px;color:#0B1620;">${esc(d.name)} started a chat</h1>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#5b6b7a;width:90px;">Email</td><td style="padding:8px 0;"><a href="mailto:${esc(d.email)}">${esc(d.email)}</a></td></tr>
          <tr><td style="padding:8px 0;color:#5b6b7a;">Phone</td><td style="padding:8px 0;"><a href="tel:${esc(d.phone)}">${esc(d.phone)}</a></td></tr>
          <tr><td style="padding:8px 0;color:#5b6b7a;">Page</td><td style="padding:8px 0;">${esc(d.page || '-')}</td></tr>
        </table>
        <p style="color:#5b6b7a;font-size:13px;margin:18px 0 0;">A full transcript will email when they close the chat or leave the page.</p>
        <p style="margin-top:18px;"><a href="mailto:${encodeURIComponent(d.email)}" style="display:inline-block;background:#0EA895;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600;">Reply →</a>
        &nbsp;<a href="https://wa.me/${String(d.phone).replace(/\D/g, '')}" style="display:inline-block;background:#25D366;color:#04130f;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600;">WhatsApp →</a></p>
      </div>`,
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, error: 'send-failed', detail: String((e && e.message) || e).slice(0, 200) });
  }
}
