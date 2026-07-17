import {
  siWordpress, siWoocommerce, siShopify, siWebflow, siWix,
  siHtml5, siCss, siJavascript, siReact, siTailwindcss,
  siPhp, siMysql, siDotnet, siPostgresql, siFirebase,
  siGit, siN8n, siMake, siZapier, siFigma,
} from 'simple-icons';

// AWS/cloud isn't available as a brand mark — use a clean filled cloud glyph.
const cloud = 'M6.8 19.5A4.8 4.8 0 0 1 6 10a6.2 6.2 0 0 1 12-1.1 4.9 4.9 0 0 1-.6 9.6H6.8Z';

const I = (icon, label) => ({ label: label || icon.title, path: icon.path });

export const groups = [
  { n: '01', t: 'CMS & E-commerce', items: [I(siWordpress), I(siWoocommerce,'WooCommerce'), I(siShopify), I(siWebflow), I(siWix)] },
  { n: '02', t: 'Frontend',         items: [I(siHtml5,'HTML5'), I(siCss,'CSS3'), I(siJavascript,'JavaScript'), I(siReact), I(siTailwindcss,'Tailwind')] },
  { n: '03', t: 'Backend & Data',   items: [I(siPhp), I(siMysql), I(siDotnet,'.NET / C#'), I(siPostgresql,'PostgreSQL'), I(siFirebase)] },
  { n: '04', t: 'DevOps & Automation', items: [{ label:'AWS', path: cloud }, I(siGit), I(siN8n,'n8n'), I(siMake), I(siZapier)] },
];

// flat list for the marquee
export const allTech = groups.flatMap((g) => g.items).concat([I(siFigma)]);
