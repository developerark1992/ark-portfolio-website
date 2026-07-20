// Generates 15 blog cover images (public/blog/*.png) + supabase/seed.sql.
// Run from the project root:  node scripts/gen-blog-seed.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const OUT_IMG = 'public/blog';
mkdirSync(OUT_IMG, { recursive: true });

const CATS = [
  ['Web Dev', 'web-dev', '#0EA895'],
  ['CMS', 'cms', '#12B39B'],
  ['AI & Automation', 'ai-automation', '#5B6CFF'],
  ['Hosting & DevOps', 'hosting-devops', '#F5B14A'],
  ['Tech', 'tech', '#34E2C5'],
  ['Gaming', 'gaming', '#8B5CF6'],
  ['Sports', 'sports', '#22C55E'],
];
const catColor = Object.fromEntries(CATS.map(([, s, c]) => [s, c]));

const P = (o) => o;
const posts = [
  P({ slug:'wordpress-vs-shopify', cat:'cms', date:'2026-07-18',
    title:'WordPress vs Shopify: which should you actually build on?',
    description:'A no-nonsense guide to picking the right platform for your business — from someone who builds on both every week.',
    keywords:'wordpress vs shopify, woocommerce, ecommerce platform, cms comparison, best platform for online store',
    body:`One of the first questions clients ask is: *"WordPress or Shopify?"* The honest answer — it depends on what you sell and how you want to run it.

## Choose WordPress (WooCommerce) if…
- You want **full control** over design, content and structure.
- Content and SEO matter as much as sales — blogs, landing pages, resources.
- Budget matters: WordPress is usually the **most affordable** build.

## Choose Shopify if…
- E-commerce is the **whole point** — orders, inventory, checkout.
- You want payments, shipping and tax handled out of the box.

## My rule of thumb
If the store *is* the business, Shopify's guardrails save time. If the website is a marketing engine that also sells, WordPress gives you room to grow. Either way I set up hosting, SEO and analytics so it launches ready to perform.` }),

  P({ slug:'automate-client-sites-with-ai', cat:'ai-automation', date:'2026-07-20',
    title:'5 ways I automate client websites with AI',
    description:'How I use Claude, ChatGPT, n8n and Zapier to remove hours of manual work from every project.',
    keywords:'ai automation, n8n, zapier, workflow automation, chatgpt, claude, business automation',
    body:`Automation isn't a buzzword on my projects — it's how I keep small teams from drowning in busywork.

## 1. Lead routing on autopilot
Form submissions get parsed, tagged and pushed into a CRM or Slack — with an instant branded auto-reply to the visitor.

## 2. AI-assisted content drafts
I wire **Claude / ChatGPT** into a content pipeline so descriptions, outlines and FAQs start as solid drafts.

## 3. Ops & reporting digests
**n8n** and **Zapier** collect the week's analytics, orders and uptime into one clean email.

## 4. Support triage
Incoming messages get classified and answered (or escalated) automatically.

## 5. Sync the tools you already use
Sheets ↔ CRM ↔ email ↔ site — the glue that stops anyone copy-pasting data by hand.` }),

  P({ slug:'your-site-is-only-as-good-as-its-hosting', cat:'hosting-devops', date:'2026-07-14',
    title:'Your beautiful site is only as good as its hosting',
    description:'Why hosting, DNS, SSL and backups quietly decide whether your website is fast, secure and actually online.',
    keywords:'web hosting, whm cpanel, dns, ssl, backups, website migration, devops',
    body:`A gorgeous design means nothing if the site is slow, keeps going down, or throws a security warning. The unglamorous layer — hosting and DevOps — keeps everything standing.

## What "good hosting" covers
- **The right environment** — WHM/cPanel or cloud (AWS, Cloudflare) matched to your traffic.
- **DNS & SSL** set up correctly, so email and the padlock both work.
- **Backups** you can actually restore from.
- **Monitoring** so problems get caught before customers notice.
- **Migrations** done without downtime.

## Why hand it to one person
When the same person builds *and* hosts your site, there's no finger-pointing when something breaks. I own it end to end — from the first commit to the DNS record to the 2am uptime alert.` }),

  P({ slug:'astro-vs-nextjs', cat:'web-dev', date:'2026-07-12',
    title:'Astro vs Next.js: choosing a modern web stack',
    description:'When I reach for Astro, when I reach for Next.js, and why the answer is usually "it depends on the interactivity".',
    keywords:'astro vs nextjs, javascript framework, static site generator, react, web performance',
    body:`Both are excellent — they just optimise for different things.

## Reach for Astro when…
- The site is **mostly content** — marketing, blogs, docs, portfolios.
- You want **near-zero JavaScript** by default and blazing load times.
- You like using React/Vue/Svelte components only where you actually need them (islands).

## Reach for Next.js when…
- The product is a **full app** — dashboards, auth, heavy interactivity.
- You need server components, streaming and a large React ecosystem.

## The short version
Content-first? Astro. App-first? Next.js. This very site is Astro — static pages that load instantly, with a few interactive islands for the calculator and chatbot.` }),

  P({ slug:'core-web-vitals', cat:'web-dev', date:'2026-07-10',
    title:'Core Web Vitals: how I make sites load fast',
    description:'A practical checklist for LCP, CLS and INP — the metrics Google (and your visitors) actually care about.',
    keywords:'core web vitals, lcp, cls, inp, page speed, web performance, seo',
    body:`Speed isn't vanity — it's conversions and rankings. Here's the checklist I run on every build.

## LCP (loading)
- Serve images as **WebP/AVIF**, correctly sized, lazy-loaded below the fold.
- Inline critical CSS; defer the rest.
- Use a CDN and cache aggressively.

## CLS (visual stability)
- Always set width/height on images and media.
- Reserve space for embeds and fonts.

## INP (interactivity)
- Ship less JavaScript. Hydrate only what needs it.
- Break up long tasks; avoid blocking the main thread.

Get these green and everything downstream — SEO, bounce rate, sales — improves.` }),

  P({ slug:'headless-cms-explained', cat:'cms', date:'2026-07-08',
    title:'Headless CMS explained (and when you actually need one)',
    description:'What "headless" means in plain English, the trade-offs, and how to tell if it fits your project.',
    keywords:'headless cms, decap, sanity, contentful, jamstack, content api',
    body:`A **headless CMS** separates *where you write content* from *where it's displayed*. The CMS stores content and exposes it via an API; your site (Astro, Next.js, etc.) fetches and renders it.

## The upside
- One content source feeding a website, app and more.
- Fast, secure front-ends with no PHP/database on the public side.
- Editors get a clean dashboard; developers get clean data.

## The trade-offs
- More moving parts than classic WordPress.
- You (or your developer) build the front-end.

## When it fits
Multi-channel content, high traffic, or a team that wants a modern stack. For a simple brochure site, classic WordPress is often still the pragmatic choice.` }),

  P({ slug:'what-is-whm-cpanel', cat:'hosting-devops', date:'2026-07-06',
    title:'What is WHM / cPanel and why it matters for hosting',
    description:'The control panel that runs a huge share of the web — what it does and how I use it to manage client sites.',
    keywords:'whm, cpanel, shared hosting, reseller hosting, email hosting, dns management',
    body:`If you've ever hosted a site, you've probably touched **cPanel**. **WHM** is the admin layer above it.

## cPanel (per-site)
- Files, databases, email accounts, SSL, subdomains, backups.
- The dashboard most hosting companies hand you.

## WHM (server/reseller)
- Creates and manages multiple cPanel accounts.
- Sets resource limits, installs certificates, tunes the server.

## Why it matters
For clients on shared or reseller hosting, WHM/cPanel is how I provision accounts, wire up email and DNS, install SSL, and take backups — without anyone needing to touch a terminal.` }),

  P({ slug:'automate-workflows-with-n8n', cat:'ai-automation', date:'2026-07-04',
    title:'How I use n8n to automate real business workflows',
    description:'A self-hosted automation platform that connects your tools — with concrete examples I ship for clients.',
    keywords:'n8n, workflow automation, self-hosted automation, api integration, zapier alternative',
    body:`**n8n** is an open-source automation tool — think Zapier you can self-host and extend.

## Flows I build often
- **New order → invoice → Slack → spreadsheet**, automatically.
- **Form → CRM → welcome email**, with the lead scored on the way in.
- **Scheduled reports** that pull analytics + sales into one digest.
- **AI steps** — pass data through Claude/GPT to summarise, classify or draft replies.

## Why n8n
Self-hosting means no per-task fees and full control of your data. It connects to hundreds of apps, and where it can't, a single HTTP node talks to any API. Most of my clients save several hours a week within the first month.` }),

  P({ slug:'website-migration-zero-downtime', cat:'hosting-devops', date:'2026-07-02',
    title:'How to migrate a website with zero downtime',
    description:'My step-by-step process for moving hosts or platforms without visitors ever seeing a hiccup.',
    keywords:'website migration, zero downtime, dns cutover, hosting migration, ssl, wordpress migration',
    body:`Migrations scare people because they picture the site going dark. Done right, nobody notices.

## The process
1. **Stage a full copy** on the new host and test it on a temporary URL.
2. **Lower DNS TTL** a day ahead so the switch propagates fast.
3. **Freeze content**, do a final sync of the database and uploads.
4. **Point DNS** to the new host; the old one keeps serving until propagation finishes.
5. **Issue SSL**, verify email/DNS records, and monitor.
6. **Keep the old host live** for a few days as a safety net.

The result: a clean cutover, no broken links, no lost orders, no downtime.` }),

  P({ slug:'accessibility-basics', cat:'web-dev', date:'2026-06-30',
    title:'Accessibility basics every website should have',
    description:'Small, high-impact changes that make your site usable for everyone — and better for SEO too.',
    keywords:'web accessibility, a11y, wcag, alt text, keyboard navigation, inclusive design',
    body:`Accessibility isn't a "nice to have" — it's how a real chunk of your audience uses the web, and it overlaps heavily with good SEO.

## The high-impact basics
- **Alt text** on meaningful images.
- **Real headings** in order (one h1, then h2s…).
- **Keyboard navigation** — everything reachable and visible on focus.
- **Colour contrast** that passes WCAG AA.
- **Labels** on every form field.
- **Respect reduced motion** for animations.

None of these are hard, and together they make your site work for screen readers, keyboard users, and everyone on a phone in bright sunlight.` }),

  P({ slug:'ai-coding-assistants-workflow', cat:'tech', date:'2026-06-28',
    title:'AI coding assistants: how they changed my workflow',
    description:'Where AI genuinely speeds me up, where it doesn\'t, and how I keep quality high while shipping faster.',
    keywords:'ai coding assistant, claude, copilot, developer productivity, pair programming, llm',
    body:`AI assistants are now part of how I build — but the win isn't "AI writes my app". It's removing friction.

## Where it helps most
- **Boilerplate & glue code** — forms, API handlers, config.
- **Explaining unfamiliar code** and legacy projects fast.
- **Refactors and tests** I'd otherwise put off.
- **First drafts** of docs and content.

## Where I stay hands-on
- Architecture and data modelling.
- Anything security-sensitive.
- Reviewing every line before it ships.

Used well, it's like a fast junior pair-programmer — you still own the thinking, you just move quicker.` }),

  P({ slug:'web-dev-trends-2026', cat:'tech', date:'2026-06-25',
    title:'The web development trends I\'m watching in 2026',
    description:'Islands architecture, AI in the stack, edge rendering and the quiet comeback of simplicity.',
    keywords:'web development trends 2026, islands architecture, edge rendering, ai development, jamstack',
    body:`A quick look at what's actually shaping how I build this year.

## 1. Islands & "ship less JS"
Frameworks like Astro proved most pages don't need a full SPA. Static HTML + targeted interactivity is winning.

## 2. AI in the stack, not just the editor
Chatbots, search, content generation and support — increasingly wired straight into sites via serverless functions.

## 3. Edge rendering
Running code close to users for personalisation without sacrificing speed.

## 4. Simplicity as a feature
After years of heavy tooling, teams are choosing boring, maintainable stacks on purpose. I'm all for it.` }),

  P({ slug:'every-fifa-world-cup-winner', cat:'sports', date:'2026-06-22',
    title:'Every FIFA World Cup winner (1930–2022)',
    description:'The complete list of football World Cup champions, from Uruguay 1930 to Argentina 2022.',
    keywords:'fifa world cup winners, world cup champions list, football history, argentina 2022, brazil world cup',
    body:`The FIFA World Cup is the biggest prize in football. Here's every champion from the first tournament to the most recent.

## The full list
- **1930** Uruguay · **1934** Italy · **1938** Italy
- **1950** Uruguay · **1954** West Germany · **1958** Brazil
- **1962** Brazil · **1966** England · **1970** Brazil
- **1974** West Germany · **1978** Argentina · **1982** Italy
- **1986** Argentina · **1990** West Germany · **1994** Brazil
- **1998** France · **2002** Brazil · **2006** Italy
- **2010** Spain · **2014** Germany · **2018** France
- **2022** Argentina

## Most titles
**Brazil** leads with five. **Germany** and **Italy** have four each; **Argentina**, **Uruguay** and **France** have two apiece. The 2026 edition — hosted across the USA, Canada and Mexico — expands the tournament to 48 teams.` }),

  P({ slug:'most-successful-football-clubs', cat:'sports', date:'2026-06-18',
    title:'The most successful clubs in football history',
    description:'From Real Madrid\'s European dominance to South America\'s giants — a look at the trophy cabinets that define the sport.',
    keywords:'most successful football clubs, real madrid champions league, ac milan, boca juniors, club football history',
    body:`Club football's history is written in trophies. A few names sit above the rest.

## Europe
- **Real Madrid** — record holders in the European Cup / Champions League, with a trophy count no one has matched.
- **AC Milan** and **Bayern Munich** — Europe's next most-decorated on the continental stage.
- **Barcelona**, **Liverpool** and **Manchester United** — domestic dynasties with multiple European crowns.

## South America
- **Boca Juniors** and **Independiente** of Argentina, and Brazil's giants, dominate the Copa Libertadores roll of honour.

Trophy counts are one lens — but combine them with fan culture and iconic players, and these clubs are the sport's living history.` }),

  P({ slug:'short-history-of-video-games', cat:'gaming', date:'2026-06-15',
    title:'From pixels to open worlds: a short history of video games',
    description:'How gaming went from Pong to photorealistic open worlds — the eras, the leaps, and what comes next.',
    keywords:'history of video games, gaming eras, arcade, console generations, open world games, esports',
    body:`Few industries have moved as fast as video games. A whirlwind tour:

## The early days
- **1970s** — arcades and *Pong* turn "electronic games" into a phenomenon.
- **1980s** — the home console era (and the crash, then Nintendo's revival).

## Going 3D
- **1990s** — polygons, CD-ROMs and franchises that still run today.
- **2000s** — online multiplayer becomes the default; consoles go HD.

## The modern era
- **2010s–now** — vast open worlds, indie golden age, cloud gaming, and **esports** filling stadiums.

Gaming is now the biggest entertainment medium on earth — bigger than film and music combined — and AI-driven worlds are the next frontier.` }),

  P({ slug:'esports-goes-mainstream', cat:'gaming', date:'2026-06-12',
    title:'Esports: how competitive gaming went mainstream',
    description:'Sold-out arenas, million-dollar prize pools and university scholarships — inside gaming\'s rise as a spectator sport.',
    keywords:'esports, competitive gaming, gaming tournaments, twitch, prize pools, esports careers',
    body:`Not long ago, "professional gamer" sounded like a joke. Today it's a career path with arenas, sponsors and scholarships.

## What drove it
- **Streaming** (Twitch, YouTube) turned play into a spectator sport.
- **Prize pools** climbed into the millions.
- **Publishers** built official leagues around their biggest titles.

## The ecosystem now
- Players, coaches, analysts, casters, event crews — whole careers around the games.
- Universities offer esports scholarships and degrees.
- Traditional sports clubs own esports teams.

Whatever you think of it, competitive gaming is a global industry with a fiercely engaged, young audience — and it's still growing.` }),
];

// ---- cover generation ----
function wrap(title, maxLen) {
  const words = title.split(' ');
  const lines = []; let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxLen) { lines.push(line.trim()); line = w; }
    else line += ' ' + w;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 4);
}
const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

async function cover(p) {
  const color = catColor[p.cat] || '#34E2C5';
  const catName = (CATS.find((c) => c[1] === p.cat) || [])[0] || 'Blog';
  const lines = wrap(p.title, 26);
  const fs = lines.length > 3 ? 58 : 66;
  const startY = 300 - ((lines.length - 1) * fs) / 2;
  const tspans = lines.map((l, i) => `<tspan x="80" y="${startY + i * (fs + 8)}">${esc(l)}</tspan>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <radialGradient id="g" cx="78%" cy="22%" r="80%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.42"/>
        <stop offset="55%" stop-color="${color}" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="#0B0F18" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="#0B0F18"/>
    <rect width="1200" height="630" fill="url(#g)"/>
    <rect x="0" y="0" width="1200" height="8" fill="${color}"/>
    <text x="80" y="120" font-family="Georgia, serif" font-size="34" fill="${color}">◆</text>
    <text x="120" y="122" font-family="-apple-system, Segoe UI, Arial, sans-serif" font-size="22" fill="#8aa0b2" letter-spacing="2">ARK · ${esc(catName.toUpperCase())}</text>
    <text font-family="-apple-system, Segoe UI, Arial, sans-serif" font-weight="800" font-size="${fs}" fill="#EAF0F7" letter-spacing="-1">${tspans}</text>
    <text x="80" y="560" font-family="ui-monospace, Menlo, monospace" font-size="24" fill="${color}">arkdesigningbureau.com</text>
  </svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(`${OUT_IMG}/${p.slug}.png`, buf);
}

// ---- SQL ----
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);

let sql = `-- Seed categories + 15 published posts. Run AFTER schema.sql.\n`;
sql += `insert into public.categories (name, slug) values\n`;
sql += CATS.map(([n, s]) => `  (${q(n)}, ${q(s)})`).join(',\n') + `\n  on conflict (slug) do nothing;\n\n`;

for (const p of posts) {
  await cover(p);
  const mt = `${p.title} — Abdul Rehman Khan`;
  sql += `insert into public.posts (slug, title, description, meta_title, meta_description, keywords, cover, category_id, published, created_at, body) values (\n`;
  sql += `  ${q(p.slug)}, ${q(p.title)}, ${q(p.description)}, ${q(mt)}, ${q(p.description)}, ${q(p.keywords)},\n`;
  sql += `  ${q('/blog/' + p.slug + '.png')}, (select id from public.categories where slug=${q(p.cat)}), true, ${q(p.date)},\n`;
  sql += `  $md$${p.body}$md$\n) on conflict (slug) do nothing;\n\n`;
}

writeFileSync('supabase/seed.sql', sql);
console.log(`Generated ${posts.length} covers in ${OUT_IMG}/ and supabase/seed.sql`);
