import { previewPolicy } from '../preview/policy.mjs';

export const brand = 'Comos';

const navigation = {
  main: [['home', 'Home'], ['lore', 'Lore'], ['characters', 'Characters']],
  public: [['signin', 'Sign in'], ['signup', 'Sign up']],
  wizard: [['create-source', 'Sources'], ['create-identity', 'Identity'], ['create-race', 'Race'], ['create-class', 'Class & level']],
  admin: [['admin', 'Character controls'], ['admin-items', 'Item controls'], ['admin-groups', 'Groups']],
  sheet: [['sheet', 'Overview'], ['sheet-inventory', 'Inventory'], ['sheet-abilities', 'Abilities'], ['sheet-shop', 'Shop']],
};

const labels = { wizard: 'Character creation', admin: 'Admin panel', sheet: 'Character sheet' };
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function nav(kind, current, className, label) {
  return `<nav class="${className}" aria-label="${label}">${navigation[kind].map(([id, text]) => `<a href="${id}.html"${id === current ? ' aria-current="page"' : ''}>${escape(text)}</a>`).join('')}</nav>`;
}

const back = '<a class="back" href="characters.html">← Characters</a>';
const account = '<a class="account" href="account.html"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/></svg><span class="sr-only">Account</span></a>';

function header(page) {
  if (page.layout === 'sheet') return `<header>${back}<span class="sheet-title">${brand}</span></header>`;
  const logo = `<a class="brand" href="index.html"><span class="mark" aria-hidden="true">✦</span><span>${brand}</span></a>`;
  return `<header>${logo}${page.layout === 'public' ? nav('public', page.id, 'public-nav', 'Account') : nav('main', page.activeMain, 'main-nav', 'Main') + account}</header>`;
}

export function renderPage(page, { policy = previewPolicy, scripts = ['preview/runtime.mjs', ...(page.auth ? ['auth/preview.mjs'] : [])] } = {}) {
  if (!['public', 'app', 'sheet'].includes(page.layout)) throw new Error(`Unknown layout for ${page.id}`);
  if (page.section && !labels[page.section]) throw new Error(`Unknown section for ${page.id}`);
  const section = page.section ? (page.section === 'sheet' ? '' : back) + nav(page.section, page.id, 'tabs', labels[page.section]) : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${escape(policy)}"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="color-scheme" content="dark">${page.description ? `<meta name="description" content="${escape(page.description)}">` : ''}<title>${escape(page.title)}</title><link rel="stylesheet" href="assets/site.css">${scripts.map(src => `<script type="module" src="${escape(src)}"></script>`).join('')}</head>
<body class="${escape(page.bodyClass)}"><a class="skip" href="#main">Skip to content</a>${header(page)}<main id="main" tabindex="-1">${section}${page.content}</main></body></html>
`;
}
