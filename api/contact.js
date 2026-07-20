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
const WA_MSG = "Hi Abdul! I found you through your portfolio and I'd like to discuss a project.";
const CAL = 'https://calendly.com/ark-educationalist/30min';
const ASSET = `https://${SITE}/email`;
const A = '#0EA895';   // accent (readable on white)
const A2 = '#34E2C5';  // bright accent (on dark)
const DARK = '#0B0F18';
const INK = '#0B1620';
const MUT = '#5b6b7a';
const SOCIAL = [
  ['linkedin', 'https://www.linkedin.com/in/developerark/'],
  ['github', 'https://github.com/developerark1992'],
  ['whatsapp', `https://wa.me/${WA}?text=${encodeURIComponent(WA_MSG)}`],
  ['facebook', 'https://www.facebook.com/ark.aries1992'],
  ['instagram', 'https://www.instagram.com/arkkhan1992'],
  ['x', 'https://x.com/official_ark92'],
];

const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
const btn = (href, label, bg) => `<a href="${href}" class="btn-mob" style="display:inline-block;background:${bg || A};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 24px;border-radius:999px;margin:0 8px 0 0;">${label}</a>`;

function socialRow() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>${
    SOCIAL.map(([n, href]) => `<td style="padding:0 5px;"><a href="${href}" target="_blank"><img src="${ASSET}/${n}.png" width="34" height="34" alt="${n}" style="display:block;border:0;outline:none;border-radius:50%;"></a></td>`).join('')
  }</tr></table>`;
}

// designed, mobile-responsive shell — table-based + inline styles for broad client support
function shell(preheader, inner) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @media screen and (max-width:600px){
    .container{width:100%!important}
    .px{padding-left:22px!important;padding-right:22px!important}
    .btn-mob{display:block!important;width:100%!important;text-align:center!important;margin:0 0 10px 0!important;box-sizing:border-box}
    .h1{font-size:22px!important}
  }
</style></head>
<body style="margin:0;padding:0;background:#eef2f6;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;padding:26px 12px;">
    <tr><td align="center">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 44px rgba(11,22,32,.14);font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="height:5px;background:${A2};background:linear-gradient(90deg,${A2},${A});font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td class="px" bgcolor="${DARK}" style="background:${DARK};background:linear-gradient(135deg,#0B0F18 0%,#0e2a24 100%);padding:24px 30px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:46px;vertical-align:middle;"><div style="width:44px;height:44px;border-radius:50%;border:2px solid ${A2};color:${A2};text-align:center;line-height:42px;font-size:15px;font-family:Georgia,serif;">AK</div></td>
            <td style="padding-left:14px;vertical-align:middle;color:#EAF0F7;font-size:17px;font-weight:700;">${NAME}<div style="color:#8aa0b2;font-size:11px;font-weight:400;letter-spacing:.05em;margin-top:2px;">${ROLE}</div></td>
            <td align="right" style="vertical-align:middle;"><span style="display:inline-block;background:rgba(52,226,197,.14);color:${A2};font-size:10px;font-weight:600;letter-spacing:.04em;padding:6px 12px;border-radius:999px;border:1px solid rgba(52,226,197,.35);white-space:nowrap;">● Available</span></td>
          </tr></table>
        </td></tr>
        <tr><td class="px" style="padding:34px 30px 12px;">${inner}</td></tr>
        <tr><td class="px" style="padding:20px 30px 12px;border-top:1px solid #eef2f6;">
          <div style="font-size:14px;color:${INK};font-weight:700;">${NAME}</div>
          <div style="font-size:12px;color:${MUT};margin:2px 0 12px;">${ROLE}</div>
          <div style="font-size:12px;color:${MUT};line-height:1.9;">
            🌐 <a href="https://${SITE}" style="color:${A};text-decoration:none;">${SITE}</a>&nbsp;·&nbsp;💬 <a href="https://wa.me/${WA}" style="color:${A};text-decoration:none;">${PHONE}</a><br>
            ✉ <a href="mailto:${process.env.GMAIL_USER || ''}" style="color:${A};text-decoration:none;">${esc(process.env.GMAIL_USER || '')}</a>
          </div>
        </td></tr>
        <tr><td style="padding:6px 30px 26px;" align="center">${socialRow()}</td></tr>
      </table>
      <div style="color:#9aa7b5;font-size:11px;margin-top:14px;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">© ${new Date().getFullYear()} ${NAME} · ${SITE}</div>
    </td></tr>
  </table></body></html>`;
}

function detailRows(rows) {
  return rows.filter(([, v]) => v && String(v).trim() && String(v).trim() !== '-')
    .map(([k, v]) => `<tr>
      <td style="padding:9px 0;border-bottom:1px solid #f0f3f7;color:${MUT};font-size:13px;width:130px;vertical-align:top;">${esc(k)}</td>
      <td style="padding:9px 0;border-bottom:1px solid #f0f3f7;color:${INK};font-size:14px;font-weight:500;">${esc(v)}</td></tr>`).join('');
}

export function adminHtml(d) {
  const rows = detailRows([
    ['Name', d.name], ['Email', d.email], ['Phone', d.phone], ['Company', d.company],
    ['Project type', d.type], ['Budget', d.budget], ['Timeline', d.timeline],
  ]);
  return shell(`New enquiry from ${d.name}`, `
    <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${A};font-weight:700;">✦ New enquiry</div>
    <h1 class="h1" style="margin:8px 0 20px;font-size:25px;color:${INK};line-height:1.2;">${esc(d.name)} sent a project brief</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    <div style="margin:22px 0 8px;color:${MUT};font-size:13px;font-weight:600;">Message</div>
    <div style="background:#f6f9fb;border-left:3px solid ${A};border-radius:0 10px 10px 0;padding:15px 17px;color:${INK};font-size:14px;line-height:1.65;">${nl2br(d.message)}</div>
    <div style="margin-top:24px;">${btn('mailto:' + encodeURIComponent(d.email) + '?subject=' + encodeURIComponent('Re: your enquiry'), 'Reply to ' + esc(d.name.split(' ')[0]) + ' →')}</div>`);
}

export function userHtml(d) {
  const first = esc((d.name || '').split(' ')[0] || 'there');
  const recap = detailRows([['Project type', d.type], ['Budget', d.budget], ['Timeline', d.timeline]]);
  const waHref = `https://wa.me/${WA}?text=${encodeURIComponent(WA_MSG)}`;
  return shell(`Thanks ${first} — I've received your message`, `
    <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${A};font-weight:700;">✦ Message received</div>
    <h1 class="h1" style="margin:8px 0 16px;font-size:26px;color:${INK};line-height:1.2;">Thanks, ${first}! 👋</h1>
    <p style="font-size:15px;color:${INK};line-height:1.65;margin:0 0 14px;">I've got your enquiry and I'll personally reply <b>within one business day</b>. If it's urgent, ping me on WhatsApp and I'll get back faster.</p>
    <p style="font-size:15px;color:${INK};line-height:1.65;margin:0 0 22px;">Want to skip the wait? Grab a free 30-minute strategy call and we'll map out your project together.</p>
    <div style="margin:0 0 28px;">${btn(CAL, '📅 Book a strategy call')}${btn(waHref, '💬 WhatsApp me', '#25D366')}</div>
    <div style="color:${MUT};font-size:12px;font-weight:600;margin-bottom:6px;">Here's a copy of what you sent</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${recap}</table>
    <div style="background:#f6f9fb;border-left:3px solid ${A};border-radius:0 10px 10px 0;padding:15px 17px;color:${INK};font-size:14px;line-height:1.65;margin-top:12px;">${nl2br(d.message)}</div>
    <p style="font-size:14px;color:${INK};margin:24px 0 0;">Talk soon,<br><b>${NAME}</b></p>`);
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

    // 1) admin notification (must succeed for ok:true)
    await transporter.sendMail({
      from: `"${NAME} — Portfolio" <${user}>`,
      to: process.env.CONTACT_TO || user,
      replyTo: `"${d.name}" <${d.email}>`,
      subject: `New enquiry — ${d.name}${d.type ? ' (' + d.type + ')' : ''}`,
      html: adminHtml(d),
      text: `New enquiry from ${d.name} <${d.email}>\nPhone: ${d.phone || '-'}\nCompany: ${d.company || '-'}\nType: ${d.type}\nBudget: ${d.budget}\nTimeline: ${d.timeline}\n\n${d.message}`,
    });

    // 2) visitor auto-reply (best-effort)
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
