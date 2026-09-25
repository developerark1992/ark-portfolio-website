import {
  siWordpress, siWoocommerce, siShopify, siWebflow, siWix,
  siHtml5, siCss, siJavascript, siReact, siTailwindcss, siSass,
  siPhp, siMysql, siDotnet, siPostgresql, siFirebase,
  siGit, siN8n, siMake, siZapier,
} from 'simple-icons';

const cloud = 'M6.8 19.5A4.8 4.8 0 0 1 6 10a6.2 6.2 0 0 1 12-1.1 4.9 4.9 0 0 1-.6 9.6H6.8Z';
const api = 'M5 8h14v2H5V8zm0 4h10v2H5v-2zm0 4h12v2H5v-2z';
const cicd = 'M4 12h4l2-6 4 12 2-6h4';
const dns = 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-1 5h2v8h-2v-8z';
const es6 = 'M4 4h16v16H4V4zm3 4h4v2H9v6H7V8zm6 0h4c1.1 0 2 .9 2 2v1.5c0 1.1-.9 2-2 2h-2V16h-2V8zm2 2v1.5h2V10h-2z';
const cart = 'M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3 3h2.4l.6 2h13.5l-1.8 8H7.2L6 6H3V3zm4.4 10h8.2l1-4.5H7.9L7.4 13z';

const I = (icon, label) => ({ label: label || icon.title, path: icon.path });
const C = (label, path) => ({ label, path });

export const groups = [
  {
    n: '01', t: 'CMS & E-Commerce', tone: 'cyan',
    items: [I(siWordpress), I(siWoocommerce, 'WooCommerce'), I(siShopify), I(siWebflow), I(siWix), C('OpenCart', cart)],
  },
  {
    n: '02', t: 'Frontend & Core', tone: 'violet',
    items: [I(siHtml5, 'HTML5'), I(siCss, 'CSS3'), I(siJavascript, 'JavaScript'), C('ES6+', es6), I(siReact), I(siTailwindcss, 'Tailwind CSS'), I(siSass, 'SASS')],
  },
  {
    n: '03', t: 'Backend & Infrastructure', tone: 'cyan',
    items: [I(siPhp), I(siMysql), I(siDotnet, 'C# / .NET'), I(siPostgresql, 'PostgreSQL'), C('REST APIs', api), I(siFirebase)],
  },
  {
    n: '04', t: 'DevOps & Cloud', tone: 'violet',
    items: [C('AWS', cloud), C('EC2 / Lightsail', cloud), C('Route 53', dns), I(siGit), C('CI/CD', cicd), C('DNS / SSL', dns)],
  },
  {
    n: '05', t: 'Automation & Workflows', tone: 'cyan',
    items: [I(siN8n, 'n8n'), I(siMake), I(siZapier), C('API integrations', api)],
  },
];

export const marqueeTech = [
  I(siWordpress), I(siWoocommerce, 'WooCommerce'), I(siShopify), I(siWebflow),
  C('AWS', cloud), I(siN8n, 'n8n'), I(siReact), I(siPhp),
];

export const allTech = groups.flatMap((g) => g.items);
