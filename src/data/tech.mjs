import {
  siWordpress, siWoocommerce, siShopify, siWebflow, siWix, siSquarespace, siFramer,
  siHtml5, siCss, siJavascript, siReact, siNextdotjs, siAstro, siTailwindcss,
  siPhp, siMysql, siDotnet, siPostgresql, siFirebase,
  siCpanel, siCloudflare, siGit, siDocker, siVercel,
  siClaude, siN8n, siMake, siZapier, siFigma,
} from 'simple-icons';

// A few marks aren't in simple-icons (AWS, OpenAI, WHM) — clean, filled 24×24 glyphs.
const cloud = 'M6.8 19.5A4.8 4.8 0 0 1 6 10a6.2 6.2 0 0 1 12-1.1 4.9 4.9 0 0 1-.6 9.6H6.8Z';
const spark = 'M12 2c.5 4.2 2.6 6.3 6.8 6.8-4.2.5-6.3 2.6-6.8 6.8-.5-4.2-2.6-6.3-6.8-6.8C9.4 8.3 11.5 6.2 12 2Zm7 12c.2 1.9 1.1 2.8 3 3-1.9.2-2.8 1.1-3 3-.2-1.9-1.1-2.8-3-3 1.9-.2 2.8-1.1 3-3Z';

const I = (icon, label) => ({ label: label || icon.title, path: icon.path });
const C = (label, path) => ({ label, path });

export const groups = [
  { n: '01', t: 'CMS & Website Platforms', items: [I(siWordpress), I(siWoocommerce,'WooCommerce'), I(siShopify), I(siWebflow), I(siWix), I(siSquarespace), I(siFramer)] },
  { n: '02', t: 'Code & Frameworks',       items: [I(siHtml5,'HTML5'), I(siCss,'CSS3'), I(siJavascript,'JavaScript'), I(siReact), I(siNextdotjs,'Next.js'), I(siAstro), I(siTailwindcss,'Tailwind')] },
  { n: '03', t: 'Backend & Data',          items: [I(siPhp), I(siMysql), I(siDotnet,'.NET / C#'), I(siPostgresql,'PostgreSQL'), I(siFirebase)] },
  { n: '04', t: 'DevOps, Hosting & Cloud', items: [C('AWS', cloud), I(siCpanel,'cPanel / WHM'), I(siCloudflare), I(siGit), I(siDocker), I(siVercel)] },
  { n: '05', t: 'AI & Automation',         items: [I(siClaude), C('ChatGPT', spark), I(siN8n,'n8n'), I(siMake), I(siZapier)] },
];

// flat list for the marquee (adds Figma for the design side)
export const allTech = groups.flatMap((g) => g.items).concat([I(siFigma)]);
