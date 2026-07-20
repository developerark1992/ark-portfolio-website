// Vercel serverless function — delivers contact/enquiry submissions to Abdul's
// inbox via Gmail SMTP. Credentials live ONLY in Vercel env vars, never in git:
//   GMAIL_USER          the Gmail address that owns the app password
//   GMAIL_APP_PASSWORD  a 16-char Google App Password (NOT the account password)
//   CONTACT_TO          (optional) where mail is delivered; defaults to GMAIL_USER
// On any failure it returns ok:false so the client can fall back to mailto/WhatsApp.
import nodemailer from 'nodemailer';

const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  const user = process.env.GMAIL_USER, pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) { res.status(200).json({ ok: false, error: 'not-configured' }); return; }

  try {
    let b = req.body;
    if (typeof b === 'string') b = JSON.parse(b || '{}');
    b = b || {};
    if (b._gotcha) { res.status(200).json({ ok: true }); return; } // honeypot: silently accept bots

    const name = String(b.name || '').trim().slice(0, 120);
    const email = String(b.email || '').trim().slice(0, 160);
    const message = String(b.message || '').trim().slice(0, 5000);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
      res.status(400).json({ ok: false, error: 'invalid' }); return;
    }
    const fields = {
      Phone: b.phone, Company: b.company, 'Project type': b.type,
      Budget: b.budget, Timeline: b.timeline,
    };
    const lines = Object.entries(fields)
      .filter(([, v]) => v && String(v).trim() && String(v).trim() !== '-')
      .map(([k, v]) => `${k}: ${String(v).trim().slice(0, 200)}`);

    const text = `New enquiry from arkdesigningbureau.com\n\nName: ${name}\nEmail: ${email}\n${lines.join('\n')}\n\nMessage:\n${message}`;
    const html = `<h2 style="margin:0 0 12px">New enquiry — arkdesigningbureau.com</h2>
      <p><b>Name:</b> ${esc(name)}<br><b>Email:</b> <a href="mailto:${esc(email)}">${esc(email)}</a>
      ${lines.map((l) => '<br><b>' + esc(l.split(': ')[0]) + ':</b> ' + esc(l.split(': ').slice(1).join(': '))).join('')}</p>
      <p style="white-space:pre-wrap;border-left:3px solid #34E2C5;padding-left:12px">${esc(message)}</p>`;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"Portfolio enquiry" <${user}>`,
      to: process.env.CONTACT_TO || user,
      replyTo: `"${name}" <${email}>`,
      subject: `New enquiry — ${name}${b.type ? ' (' + String(b.type).slice(0, 60) + ')' : ''}`,
      text, html,
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, error: 'send-failed', detail: String(e && e.message || e).slice(0, 200) });
  }
}
