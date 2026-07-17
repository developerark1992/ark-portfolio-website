# Abdul Rehman Khan — Portfolio (Astro)

Fast, static, multi-page portfolio: Home · About · Projects · Services · Estimate (cost calculator) · Contact — plus a concierge chatbot. Auto-updates from a MEGA folder via a scheduled GitHub Action.

## Local development
```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs static site to dist/
npm run sync       # pull new projects from MEGA (needs `megatools` installed)
```

## Deploy to Vercel (one time)
1. Push this folder to a **new GitHub repo**:
   ```bash
   git init && git add -A && git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/developerark1992/personal-portfolio.git
   git push -u origin main
   ```
2. Go to **vercel.com/new** → **Import** the repo. Vercel auto-detects Astro (build `astro build`, output `dist`). Click **Deploy**.
3. Add your **custom domain** in Vercel → Settings → Domains.

Every push (including the automated MEGA sync) redeploys automatically.

## Auto-add projects from MEGA (the cron)
`.github/workflows/sync-mega.yml` runs **hourly** (and on-demand from the Actions tab):
1. Installs `megatools`, pulls your public MEGA folder.
2. Optimizes any **new** screenshots to WebP and appends them to `src/data/projects.json`.
3. Commits the changes → Vercel redeploys → the new project appears on the site.

**Folder link:** set as repo secret `MEGA_FOLDER` (Settings → Secrets → Actions), or it falls back to the default in the workflow. The folder must remain a public MEGA link.

### Best-looking auto-imports (optional)
New screenshots get a title/category/platform guessed from the filename. For a polished card, name files in MEGA like:
```
Healthcare ~ Galaxy Pharma ~ https://galaxypharma.com.png
```
(You can also just edit `src/data/projects.json` any time — it's plain data.)

## Editing content
- **Projects:** `src/data/projects.json`
- **Experience / skills / services:** frontmatter of `src/pages/about.astro` and `services.astro`
- **Calculator pricing:** the `initCalc` config in `src/layouts/Base.astro`
- **Résumé:** replace `public/Abdul-Rehman-Khan-CV.pdf`
- **Photo / avatar:** `public/images/photo.webp`, `public/images/avatar.webp`

## Stack
Astro 5 (static output, view transitions), vanilla JS, WebP images, sharp for the sync pipeline. No runtime framework — near-zero JS shipped.
