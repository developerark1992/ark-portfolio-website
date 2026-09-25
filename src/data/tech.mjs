import {
  siWordpress, siWoocommerce, siShopify, siWebflow, siWix,
  siHtml5, siCss, siJavascript, siReact, siTailwindcss, siSass,
  siPhp, siMysql, siDotnet, siPostgresql, siFirebase,
  siGit, siN8n, siMake, siZapier, siFigma, siCpanel,
} from 'simple-icons';

const cloud = 'M6.8 19.5A4.8 4.8 0 0 1 6 10a6.2 6.2 0 0 1 12-1.1 4.9 4.9 0 0 1-.6 9.6H6.8Z';
const api = 'M5 8h14v2H5V8zm0 4h10v2H5v-2zm0 4h12v2H5v-2z';
const cicd = 'M4 12h4l2-6 4 12 2-6h4';
const dns = 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-1 5h2v8h-2v-8z';
const es6 = 'M4 4h16v16H4V4zm3 4h4v2H9v6H7V8zm6 0h4c1.1 0 2 .9 2 2v1.5c0 1.1-.9 2-2 2h-2V16h-2V8zm2 2v1.5h2V10h-2z';
const cart = 'M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3 3h2.4l.6 2h13.5l-1.8 8H7.2L6 6H3V3zm4.4 10h8.2l1-4.5H7.9L7.4 13z';
const brush = 'M7 21c-1.5 0-3-1.2-3-3 0-2.2 2.8-5.5 5-8.2C11.2 7.5 14 4 16.5 4 18.4 4 20 5.6 20 7.5c0 2.5-3.5 5.3-5.8 7.5C11.5 17.7 9.2 21 7 21zm9.2-14.8c-.7 0-2.4 1.3-4.2 3.5 1.9 1.7 3.7 2.9 4.8 2.9.8 0 1.7-.7 1.7-1.6 0-1.8-1.1-4.8-2.3-4.8z';
const palette = 'M12 2a10 10 0 0 0-1 19.95V18a2 2 0 0 1 2-2h.5a3.5 3.5 0 1 0 0-7H12a1 1 0 1 1 0-2h4a1 1 0 1 0 0-2h-1.1A10 10 0 0 0 12 2zm-5.5 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm3-3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z';
const layout = 'M3 4h18v4H3V4zm0 6h8v10H3V10zm10 0h8v4h-8v-4zm0 6h8v4h-8v-4z';
const server = 'M4 4h16a2 2 0 0 1 2 2v3H2V6a2 2 0 0 1 2-2zm0 7h18v3H2v-3zm0 5h18v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3zm3-11.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2z';
const mail = 'M3 6h18v12H3V6zm1.5 1.5 7.5 5 7.5-5v1.2l-7.5 5-7.5-5V7.5z';
const migrate = 'M7 7h7V4l6 5-6 5v-3H7V7zm10 10H10v3l-6-5 6-5v3h7v4z';

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
  {
    n: '06', t: 'Design & Creative', tone: 'violet',
    items: [
      I(siFigma), C('Adobe Photoshop', brush), C('Illustrator', brush),
      C('Adobe XD', layout), C('Canva', palette), C('Logo & brand identity', palette), C('UI/UX', layout),
    ],
  },
  {
    n: '07', t: 'Hosting & Domains', tone: 'cyan',
    items: [
      C('WHM', server), I(siCpanel, 'cPanel'), C('Shared / VPS hosting', server),
      C('Domain registration', dns), C('DNS & SSL', dns), C('Email setup', mail), C('Site migrations', migrate),
    ],
  },
];

export const marqueeTech = [
  I(siWordpress), I(siWoocommerce, 'WooCommerce'), I(siShopify), I(siWebflow),
  C('AWS', cloud), I(siN8n, 'n8n'), I(siReact), I(siPhp),
];

export const allTech = groups.flatMap((g) => g.items);
