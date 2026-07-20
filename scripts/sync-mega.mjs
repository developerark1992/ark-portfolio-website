#!/usr/bin/env node
/**
 * MEGA → projects sync.
 * Pulls the public MEGA folder, finds screenshots not yet imported,
 * optimizes them to WebP, parses metadata from the filename, and appends
 * them to src/data/projects.json. Run by GitHub Actions on a schedule.
 *
 * Requires `megatools` (megadl) on PATH — the CI workflow installs it.
 * Set MEGA_FOLDER to override the folder link.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MEGA_FOLDER = process.env.MEGA_FOLDER || 'https://mega.nz/folder/9j5mmTKZ#Zd5VWalc9TK58Zkg57ZzsA';
const CACHE = path.join(ROOT, 'mega-cache');
const OUT = path.join(ROOT, 'public/images/projects');
const DATA = path.join(ROOT, 'src/data/projects.json');
const MANIFEST = path.join(ROOT, 'src/data/manifest.json');

const TLDS = new Set(['pk','ca','com','ai','co','io','net','org','ae','us','uk','me','app','dev']);
const OVERRIDE = {
  'prescott uae':'https://prescott.ae','hepius':'https://hepius.ae','steeline':'https://steeline.pk',
  'dr umer pain relief clinic':'https://drumerpainrelief.pk','accessibility partners':'https://accessibilitypartners.ca',
  'boatique staffing':'https://boatiquestaffing.com','evad':'https://evad-me.com',
};
const CATS = [
  ['Healthcare & Dental',['pharma','clinic','pain','medical','health','hepius','dental','dentist','dentique','orthodont','pediatric','rapidmd','surrogacy','schein','physio','therapy','wellness']],
  ['E-commerce',['shop','store','shopify','ecommerce','protein','oats','grip','clay','cosmetic','lubricant','merch','boutique']],
  ['Real Estate & Construction',['real','estate','construction','costruction','steel','prescott','station','property','realty','colinas','madinat','builder']],
  ['Finance & Legal',['asset','credit','capital','takada','stakzz','numerix','law','legal','attorney','accounting','bookkeep','tax','insurance']],
  ['Education & Publishing',['wedding','wiki','school','uni','publish','publisher','media','taiko','tutoring','academy','learn','course','stem']],
  ['AI & Technology',['\\bai\\b','tech','data','clatter','roach','vanguard','epsilon','krystosoft','saas','software','collab','platform']],
  ['Hospitality & Lifestyle',['nail','salon','spa','laundry','laundromate','yacht','restaurant','cafe','hotel','travel','fitness','beauty','event']],
];
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const titlecase = (s) => s.split(' ').map(w => w.toUpperCase()===w ? w : (w.charAt(0).toUpperCase()+w.slice(1))).join(' ');
const category = (n) => { n=n.toLowerCase(); for (const [c,ks] of CATS) if (ks.some(k=>new RegExp(k).test(n))) return c; return 'Agency & Business'; };
const platform = (n) => { n=n.toLowerCase(); if(n.includes('shopify'))return 'Shopify'; if(n.includes('wix'))return 'Wix'; if(n.includes('webflow'))return 'Webflow'; if(n.includes('squarespace'))return 'Squarespace'; if(n.includes('framer'))return 'Framer'; return 'WordPress'; };

function parse(fn){
  const raw = fn.replace(/\.(png|jpe?g|webp)$/i,'');
  let live=null, title;
  const m = raw.match(/^screencapture-(.+?)-\d{4}-\d{2}-\d{2}/);
  if (m){
    const segs = m[1].split('-');
    if (segs.length>=2 && TLDS.has(segs[segs.length-1])){
      live = 'https://'+segs.slice(0,-1).join('-')+'.'+segs[segs.length-1];
      title = titlecase(segs.slice(0,-1).join(' ').replace(/-/g,' '));
    } else title = titlecase(m[1].replace(/-/g,' '));
  } else {
    title = raw.replace(/\s*\(\d+\)$/,'').replace(/\s*-\s*(Shopify|Wix|Webflow)$/i,'').trim();
  }
  const key = title.toLowerCase().trim();
  if (OVERRIDE[key]) live = OVERRIDE[key];
  return { title: title.trim(), platform: platform(raw), category: category(raw), live };
}

async function main(){
  if (existsSync(CACHE)) rmSync(CACHE, { recursive:true, force:true });
  mkdirSync(CACHE, { recursive:true });
  mkdirSync(OUT, { recursive:true });
  console.log('Downloading MEGA folder…');
  execSync(`megadl --no-progress --path "${CACHE}" "${MEGA_FOLDER}"`, { stdio:'inherit' });

  const projects = existsSync(DATA) ? JSON.parse(readFileSync(DATA,'utf8')) : [];
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST,'utf8')) : { seen: [] };
  const seen = new Set(manifest.seen);

  const files = readdirSync(CACHE).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).sort();
  let added = 0;
  for (const fn of files){
    const meta = parse(fn);
    const slug = slugify(meta.title);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    // optimize
    const buf = await sharpResize(path.join(CACHE, fn));
    writeFileSync(path.join(OUT, slug+'.webp'), buf);
    projects.push({ slug, title: meta.title, platform: meta.platform, category: meta.category, live: meta.live, img: '/images/projects/'+slug+'.webp', added: new Date().toISOString() });
    added++;
    console.log('  + '+meta.title+'  ['+meta.category+']');
  }
  writeFileSync(DATA, JSON.stringify(projects, null, 1));
  writeFileSync(MANIFEST, JSON.stringify({ seen:[...seen] }));
  rmSync(CACHE, { recursive:true, force:true });
  console.log(added ? `Added ${added} new project(s).` : 'No new projects.');
  // signal to CI whether anything changed
  if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `added=${added}\n`, { flag:'a' });
}

async function sharpResize(file){
  const img = sharp(file).rotate();
  const md = await img.metadata();
  const W = 1440;                       // hi-res so the full-screen lightbox stays crisp
  const MAXH = 5200;                     // cap absurdly tall full-page grabs
  // never upscale beyond the source width
  const targetW = Math.min(W, md.width || W);
  let pipeline = sharp(file).resize({ width: targetW });
  const scaledH = Math.round((md.height||1) * (targetW/(md.width||targetW)));
  if (scaledH > MAXH) pipeline = sharp(file).resize({ width: targetW }).extract({ left:0, top:0, width:targetW, height:MAXH });
  return pipeline.webp({ quality:80 }).toBuffer();
}

main().catch((e) => { console.error(e); process.exit(1); });
