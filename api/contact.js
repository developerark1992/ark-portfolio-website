// Vercel serverless function — delivers contact/enquiry submissions via Gmail SMTP
// and sends the visitor a branded auto-reply. Credentials live ONLY in Vercel env
// vars, never in git:
//   GMAIL_USER          the Gmail address that owns the app password
//   GMAIL_APP_PASSWORD  a 16-char Google App Password (NOT the account password)
//   CONTACT_TO          (optional) admin inbox; defaults to GMAIL_USER
// Returns ok:false on any failure so the client can fall back to mailto/WhatsApp.
import nodemailer from 'nodemailer';

const SITE = 'arkdesigningbureau.com';
const NAME = 'Abdul Rehman Khan';
const ROLE = 'CMS Expert · Software Engineer';
const PHONE = '+92 315 9429998';
const WA = '923159429998';
const CAL = 'https://calendly.com/ark-educationalist/30min';
const A = '#0EA895';   // accent (readable on white)
const INK = '#0B1620';
const MUT = '#5b6b7a';

const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');

// email shell — table-based + inline styles for broad client support
function shell(preheader, inner) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#eef2f6;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="background:#0B0F18;padding:22px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:40px;"><div style="width:38px;height:38px;border-radius:50%;border:1.5px solid ${A};color:${A};text-align:center;line-height:38px;font-size:14px;font-family:Georgia,serif;">AK</div></td>
            <td style="padding-left:12px;color:#EAF0F7;font-size:16px;font-weight:600;">${NAME}<div style="color:#8aa0b2;font-size:11px;font-weight:400;letter-spacing:.04em;">${ROLE}</div></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px 28px 8px;">${inner}</td></tr>
        <tr><td style="padding:20px 28px 30px;border-top:1px solid #eef2f6;">
          <div style="font-size:13px;color:${INK};font-weight:600;">${NAME}</div>
          <div style="font-size:12px;color:${MUT};margin:2px 0 10px;">${ROLE}</div>
          <div style="font-size:12px;color:${MUT};line-height:1.9;">
            🌐 <a href="https://${SITE}" style="color:${A};text-decoration:none;">${SITE}</a>&nbsp;&nbsp;·&nbsp;&nbsp;
            💬 <a href="https://wa.me/${WA}" style="color:${A};text-decoration:none;">WhatsApp ${PHONE}</a><br>
            ✉ <a href="mailto:${process.env.GMAIL_USER || ''}" style="color:${A};text-decoration:none;">${esc(process.env.GMAIL_USER || '')}</a>
          </div>
        </td></tr>
      </table>
      <div style="color:#9aa7b5;font-size:11px;margin-top:14px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">Sent from the contact form on ${SITE}</div>
    </td></tr>
  </table></body></html>`;
}

function detailRows(rows) {
  return rows.filter(([, v]) => v && String(v).trim() && String(v).trim() !== '-')
    .map(([k, v]) => `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f3f7;color:${MUT};font-size:13px;width:130px;vertical-align:top;">${esc(k)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f3f7;color:${INK};font-size:14px;">${esc(v)}</td></tr>`).join('');
}
const btn = (href, label) => `<a href="${href}" style="display:inline-block;background:${A};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:999px;">${label}</a>`;

export function adminHtml(d) {
  const rows = detailRows([
    ['Name', d.name], ['Email', d.email], ['Phone', d.phone], ['Company', d.company],
    ['Project type', d.type], ['Budget', d.budget], ['Timeline', d.timeline],
  ]);
  return shell(`New enquiry from ${d.name}`, `
    <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${A};font-weight:600;">New enquiry</div>
    <h1 style="margin:6px 0 18px;font-size:24px;color:${INK};">${esc(d.name)} sent a project brief</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    <div style="margin:20px 0 6px;color:${MUT};font-size:13px;">Message</div>
    <div style="background:#f6f9fb;border-left:3px solid ${A};border-radius:0 8px 8px 0;padding:14px 16px;color:${INK};font-size:14px;line-height:1.6;">${nl2br(d.message)}</div>
    <div style="margin-top:24px;">${btn('mailto:' + encodeURIComponent(d.email) + '?subject=' + encodeURIComponent('Re: your enquiry'), 'Reply to ' + esc(d.name.split(' ')[0]))}</div>`);
}

export function userHtml(d) {
  const first = esc((d.name || '').split(' ')[0] || 'there');
  const recap = detailRows([['Project type', d.type], ['Budget', d.budget], ['Timeline', d.timeline]]);
  return shell(`Thanks ${first} — I've received your message`, `
    <h1 style="margin:0 0 14px;font-size:24px;color:${INK};">Thanks, ${first}! 👋</h1>
    <p style="font-size:15px;color:${INK};line-height:1.65;margin:0 0 14px;">I've received your enquiry and I'll personally get back to you <b>within one business day</b>. If it's urgent, message me on WhatsApp and I'll reply faster.</p>
    <p style="font-size:15px;color:${INK};line-height:1.65;margin:0 0 20px;">Want to skip the wait? Grab a free 30-minute strategy call and we'll map out your project together.</p>
    <div style="margin:0 0 26px;">${btn(CAL, 'Book a free strategy call')}&nbsp;&nbsp;<a href="https://wa.me/${WA}" style="display:inline-block;background:#25D366;color:#04140c;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:999px;">WhatsApp me</a></div>
    <div style="color:${MUT};font-size:12px;margin-bottom:6px;">Here's a copy of what you sent:</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${recap}</table>
    <div style="background:#f6f9fb;border-left:3px solid ${A};border-radius:0 8px 8px 0;padding:14px 16px;color:${INK};font-size:14px;line-height:1.6;margin-top:10px;">${nl2br(d.message)}</div>
    <p style="font-size:14px;color:${INK};margin:22px 0 0;">Talk soon,<br><b>${NAME}</b></p>`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  const user = process.env.GMAIL_USER, pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) { res.status(200).json({ ok: false, error: 'not-configured' }); return; }

  try {
    let b = req.body;
    if (typeof b === 'string') b = JSON.parse(b || '{}');
    b = b || {};
    if (b._gotcha) { res.status(200).json({ ok: true }); return; } // honeypot

    const d = {
      name: String(b.name || '').trim().slice(0, 120),
      email: String(b.email || '').trim().slice(0, 160),
      phone: String(b.phone || '').trim().slice(0, 60),
      company: String(b.company || '').trim().slice(0, 120),
      type: String(b.type || '').trim().slice(0, 80),
      budget: String(b.budget || '').trim().slice(0, 80),
      timeline: String(b.timeline || '').trim().slice(0, 80),
      message: String(b.message || '').trim().slice(0, 5000),
    };
    if (!d.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || !d.message) {
      res.status(400).json({ ok: false, error: 'invalid' }); return;
    }

    const transporter = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });

    // 1) admin notification (the important one — must succeed for ok:true)
    await transporter.sendMail({
      from: `"${NAME} — Portfolio" <${user}>`,
      to: process.env.CONTACT_TO || user,
      replyTo: `"${d.name}" <${d.email}>`,
      subject: `New enquiry — ${d.name}${d.type ? ' (' + d.type + ')' : ''}`,
      html: adminHtml(d),
      text: `New enquiry from ${d.name} <${d.email}>\nPhone: ${d.phone || '-'}\nCompany: ${d.company || '-'}\nType: ${d.type}\nBudget: ${d.budget}\nTimeline: ${d.timeline}\n\n${d.message}`,
    });

    // 2) visitor auto-reply (best-effort — don't fail the request if this bounces)
    let replied = true;
    try {
      await transporter.sendMail({
        from: `"${NAME}" <${user}>`,
        to: `"${d.name}" <${d.email}>`,
        replyTo: user,
        subject: `Thanks for reaching out — ${NAME}`,
        html: userHtml(d),
        text: `Hi ${d.name.split(' ')[0]},\n\nThanks for reaching out — I've received your enquiry and I'll get back to you within one business day.\nBook a free strategy call: ${CAL}\nWhatsApp: https://wa.me/${WA}\n\nTalk soon,\n${NAME}\n${SITE}`,
      });
    } catch { replied = false; }

    res.status(200).json({ ok: true, replied });
  } catch (e) {
    res.status(200).json({ ok: false, error: 'send-failed', detail: String((e && e.message) || e).slice(0, 200) });
  }
}
