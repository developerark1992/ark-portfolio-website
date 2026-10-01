# ARK Portfolio Website — Session Handoff

**Date:** 2026-10-01  
**Repo:** `developerark1992/ark-portfolio-website`  
**Live:** https://arkdesigningbureau.com  
**Dashboard:** https://arkdesigningbureau.com/dashboard  

---

## Current status

| Area | Status |
|------|--------|
| Chat open / responsive UI | **Done** (inline boot in `Base.astro`) |
| Quick questions + contextual “Suggested next” chips | **Done** (in-chat cluster; no floating bubbles) |
| Mandatory lead gate (name, phone, email) | **Done** |
| Visitor name in chat header + on bubbles | **Done** |
| Email on chat start + transcript on leave | **Done** (`/api/chat-lead`) |
| Persist leads / transcripts / page views in Supabase | **Done** (needs CRM SQL + service role) |
| Command center UI (`/dashboard`) | **Done** (logo, mobile drawer, full-bleed) |
| Direct reply + broadcast email | **Done** (`/api/dash-mail`) |
| Site visit tracking | **Done** (`/api/track` + beacon in `Base.astro`) |
| Free AI replies (Groq → Gemini) | **Done** (`/api/chat`) |

Latest main tip (at handoff time): top-gap fix for dashboard (`section` padding removed). Hard-refresh after Vercel deploy.

---

## What was built this session

### Chatbot (`src/layouts/Base.astro` + `src/styles/global.css`)
- Inline `bootChat` so open works even if `site.js` is slow.
- Lead form before chat; details stored in `sessionStorage`.
- Contextual suggestion chips under conversation.
- On start → email + Supabase lead; on close/pagehide → transcript email + messages stored.

### APIs
| Path | Role |
|------|------|
| `api/chat.js` | Groq then Gemini AI answers |
| `api/chat-lead.js` | Lead notify + transcript email + CRM upsert |
| `api/track.js` | Anonymous page views |
| `api/dash-mail.js` | Authenticated reply / broadcast |
| `api/contact.js` | Existing contact form mail (unchanged) |
| `api/_lib/supabaseAdmin.js` | Service-role client + auth check |

### Dashboard (`src/pages/dashboard.astro`)
Tabs: **Overview · Leads · Chats · Visitors · Outreach · Blog**  
- Uses existing Supabase Auth login.
- `chrome={false}` on `Base` → no site nav/footer/chat chrome (no top/bottom white gaps).
- Brand logo on login + sidebar; hamburger drawer on mobile.

### Supabase SQL
- Blog (existing): `supabase/schema.sql`
- CRM (run in SQL Editor): `supabase/crm.sql`  
  Creates `leads`, `chat_sessions`, `chat_messages`, `page_views`, `email_logs` + RLS for authenticated admin.  
  Includes `touch_updated_at()` so it runs standalone.

---

## Vercel env vars (required)

| Variable | Purpose |
|----------|---------|
| `PUBLIC_SUPABASE_URL` | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Legacy **anon** key (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy **service_role** key (server writes) |
| `GMAIL_USER` | SMTP from-address |
| `GMAIL_APP_PASSWORD` | Gmail app password |
| `CONTACT_TO` | Optional inbox override |
| `GROQ_API_KEY` | Free typed AI (preferred) |
| `GEMINI_API_KEY` | AI fallback |

**Supabase keys:** Settings → API Keys → tab **Legacy anon, service_role API keys** (not the new `sb_publishable_` / `sb_secret_` keys).

After adding `SUPABASE_SERVICE_ROLE_KEY`, redeploy.

---

## One-time setup checklist

1. [x] Run `supabase/crm.sql` in Supabase SQL Editor (Success / no rows = OK).
2. [ ] Run `supabase/crm-visitors.sql` (visitor signup + Activity notifications).
3. [x] Add `SUPABASE_SERVICE_ROLE_KEY` on Vercel (Production).
4. [ ] Confirm redirect URL for password reset:  
      Supabase → Authentication → URL Configuration → Redirect URLs →  
      `https://arkdesigningbureau.com/dashboard`
5. [ ] Sign in at `/dashboard` (Forgot password if needed, or set user under Authentication → Users).
6. [ ] Test: Guest start chat → lead appears instantly → End session → transcript in Chats.  
      Sign up once → return later via Sign in → Activity shows “returned”.

### Chat behaviour (2026-10-01 update)
- **Guest / Sign in / Sign up** tabs on the lead gate.
- Guest details are **saved to Leads immediately** on Start.
- **End** button ends the session and stores the transcript (close / leave page also flushes transcript).
- Signed-up visitors skip the form next time; dashboard **Activity** shows return visits.

---

## Key files

```
api/chat-lead.js
api/track.js
api/dash-mail.js
api/_lib/supabaseAdmin.js
supabase/crm.sql
src/pages/dashboard.astro
src/layouts/Base.astro          # chat + tracker + chrome={false} support
src/styles/global.css           # .crm-* command center styles
src/lib/supabase.ts
README.md                       # Command center section
```

---

## Known notes / next ideas

- Zeros on Overview until real traffic + a completed chat after CRM SQL + service key deploy.
- Broadcast sends up to 100 leads per run via Gmail SMTP — fine for light use; for large lists later use Resend/Mailchimp.
- Visitor IDs are anonymous (`localStorage`); linked to leads when the same browser session starts chat.
- Dashboard password: use **Forgot password** on `/dashboard`, or reset in Supabase Auth → Users.

---

## Quick verify commands

```bash
git log -5 --oneline
git status -sb
# Live: hard-refresh https://arkdesigningbureau.com/dashboard
```

When continuing on another machine: clone/pull `main`, ensure Vercel env vars match, and keep `supabase/crm.sql` applied on the same Supabase project.
