// site/src/templates.js — HTML 模板与 SEO/OGP/JSON-LD 生成
// 所有文案面向波兰市场；构建时由 build.js 调用
import {
  SITE,
  SITE_NAME,
  VAPEPL,
  VAPEPL_RETURNS,
  IMG_CDN,
  BRANDS,
  BRAND_ORDER,
  FLAVOR_CATS,
  REVIEWS,
  DISCOUNT_TIERS,
  HOME_FAQ,
  WHY_US,
  CONTACT,
  STATS,
  flavorAngle,
  recommendProductsFor,
  relatedArticlesFor,
  productFaq,
  categoryFaq,
  flavorFaq,
  flavorGroups,
  flavorKey,
  pluralModels,
  pluralProducts,
  PUFF_BANDS,
  puffBandsFor,
  flavorLandingFaq,
  bandFaq,
  scenariosFor,
  priceBandsFor,
  comparisonPairsFor,
  comparisonFaq,
} from './content.js';

// ---------- 基础工具 ----------
const esc = (s) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

// ---------- SVG 图标（内联，currentColor，1.5px 线性，24 视口）----------
const ICONS = {
  'shield-check': '<path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z"/><path d="M9.2 12.2l2 2 3.6-4"/>',
  truck: '<path d="M3 7h11v8H3z"/><path d="M14 10h4l3 3v2h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>',
  percent: '<path d="M19 5L5 19"/><circle cx="7.5" cy="7.5" r="2.2"/><circle cx="16.5" cy="16.5" r="2.2"/>',
  phone: '<path d="M5 4h4l1.5 4.5L8 10a12 12 0 0 0 6 6l1.5-2.5L20 15v4a2 2 0 0 1-2 2A14 14 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  message: '<path d="M4 5h16v11H8l-4 4z"/>',
  send: '<path d="M4 12l16-8-6 16-3-6-7-2z"/><path d="M20 4l-9 9"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  droplet: '<path d="M12 3s6 6.4 6 10.2a6 6 0 1 1-12 0C6 9.4 12 3 12 3z"/>',
  snowflake: '<path d="M12 2v20M4 6l16 12M20 6L4 18M12 2l-2 3h4l-2-3zm0 20l-2-3h4l-2 3z"/>',
  candy: '<circle cx="12" cy="12" r="5"/><path d="M7.5 7.5L4 4m0 5l5-5m9 8l3.5 3.5M20 12l-5 5m5-11l-3.5 3.5"/>',
  leaf: '<path d="M5 20c0-8 4-13 14-14-1 10-6 14-14 14z"/><path d="M5 20c3-5 6-8 10-10"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v4M16 3v4M9.5 14.5l2 2 3.5-4"/>',
  ban: '<circle cx="12" cy="12" r="8.5"/><path d="M6.2 6.2l11.6 11.6"/>',
  banknote: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  package: '<path d="M3 8l9-4.5L21 8v8l-9 4.5L3 16z"/><path d="M3 8l9 4.5L21 8M12 12.5v8"/>',
};
const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ''}</svg>`;
// 星级（5 枚，filled 星 + 空星）
const starRow = (filled) =>
  [1, 2, 3, 4, 5]
    .map((i) =>
      i <= filled
        ? `<svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z"/></svg>`
        : `<svg class="icon is-empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z"/></svg>`,
    )
    .join('');

export const fmtPuffs = (n) => (n ? new Intl.NumberFormat('pl-PL').format(n) : null);
export const fmtZl = (n) =>
  n === null || n === undefined
    ? ''
    : new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2 }).format(n) + ' zł';
export const discountPct = (p) =>
  p.onSale && p.regularPrice > p.price
    ? Math.round((1 - p.price / p.regularPrice) * 100)
    : null;

// 畅销榜：按抓取时的 WooCommerce 累计销量（data.topSellers）实时排序取前 8
export function topProducts(data, n = 8) {
  const bySlug = new Map(data.products.map((p) => [p.slug, p]));
  return (data.topSellers ?? [])
    .map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .slice(0, n);
}

// 面包屑（可见导航 + 同时作为结构化数据）
export function breadcrumbs(items) {
  const trail = [{ label: 'Strona główna', url: '/' }, ...items];
  const html = `
    <nav class="breadcrumbs" aria-label="Ścieżka nawigacji">
      <div class="container">
        <ol>${trail
          .map((b, i) =>
            i === trail.length - 1
              ? `<li aria-current="page">${esc(b.label)}</li>`
              : `<li><a href="${esc(b.url)}">${esc(b.label)}</a></li>`,
          )
          .join('')}</ol>
      </div>
    </nav>`;
  const ld = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.label,
        item: SITE + b.url,
      })),
    },
  ];
  return { html, ld, trail };
}

// ---------- 页头/页脚 ----------
function header() {
  const link = (url, label) =>
    `<a class="nav-link" href="${esc(url)}">${esc(label)}</a>`;
  const brandCats = BRAND_ORDER.map((slug) => ({
    slug,
    name: BRANDS[slug]?.name ?? slug,
  }));
  const flavorCats = Object.entries(FLAVOR_CATS).map(([slug, c]) => ({
    slug,
    name: c.name,
  }));
  const brandSubs = brandCats
    .map((c) => `<a class="nav-sub" href="/kategoria/${c.slug}/">${esc(c.name)}</a>`)
    .join('');
  const flavorSubs = flavorCats
    .map((c) => `<a class="nav-sub" href="/kategoria/${c.slug}/">${esc(c.name)}</a>`)
    .join('');
  return `
  <a class="skip-link" href="#tresc">Przejdź do treści</a>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/" aria-label="${SITE_NAME} — strona główna">
        <span class="brand-mark">V</span><span class="brand-name">${SITE_NAME}</span>
      </a>
      <nav class="site-nav" aria-label="Nawigacja główna">
        <ul class="nav-top">
          <li>${link('/', 'Start')}</li>
          <li>${link('/sklep/', 'Sklep')}</li>
          <li class="has-sub">
            <a class="nav-link" href="/kategoria/hifancy/">Marki</a>
            <div class="nav-dropdown">${brandSubs}</div>
          </li>
          <li class="has-sub">
            <a class="nav-link" href="/kategoria/fruity/">Smaki</a>
            <div class="nav-dropdown">${flavorSubs}</div>
          </li>
          <li>${link('/kontakt/', 'Kontakt')}</li>
          <li>${link('/zwroty/', 'Zwroty')}</li>
        </ul>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu">
          <span></span><span></span><span></span>
          <span class="sr-only">Menu</span>
        </button>
        <div id="mobile-menu" class="mobile-menu">
          ${link('/sklep/', 'Sklep')}
          <div class="nav-group">
            <span class="nav-group-title">Marki</span>
            ${brandSubs}
          </div>
          <div class="nav-group">
            <span class="nav-group-title">Smaki</span>
            ${flavorSubs}
          </div>
          ${link('/kontakt/', 'Kontakt')}
          ${link('/zwroty/', 'Zwroty')}
        </div>
      </nav>
      <a class="btn btn-cta" href="/sklep/">Kup teraz</a>
    </div>
  </header>`;
}

function footer() {
  return `
  <footer class="site-footer">
    <div class="container footer-bar">
      <p>© ${STATS.since}–2026 ${SITE_NAME} · Sprzedaż wyłącznie dla osób 18+.</p>
      <p><a href="${VAPEPL}" rel="nofollow">vapepl.com</a> · <a href="${VAPEPL_RETURNS}" rel="nofollow">Polityka zwrotów</a> · <a href="/zwroty/">Zwroty</a></p>
    </div>
  </footer>
  <div class="age-note" role="note"><strong>18+</strong> · Produkty tytoniowe i e-papierosy przeznaczone wyłącznie dla osób pełnoletnich (18+).</div>`;
}

// ---------- 页面骨架 ----------
export function page({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  jsonld = [],
  body,
  noFollow = false,
  lcpImage = '',
}) {
  const ldScripts = jsonld
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join('\n');
  const image = ogImage || '';
  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="${IMG_CDN}">
  ${lcpImage ? `<link rel="preload" as="image" fetchpriority="high" href="${esc(lcpImage)}">` : ''}
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:type" content="${esc(ogType)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  ${image ? `<meta property="og:image" content="${esc(image)}">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n` : ''}
  <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  ${image ? `<meta name="twitter:image" content="${esc(image)}">\n` : ''}
  <meta name="robots" content="${noFollow ? 'noindex, follow' : 'index, follow'}">
  <meta name="theme-color" content="#070b14">
  <meta name="format-detection" content="telephone=yes">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%2322d3ee'/><text x='16' y='22' font-family='sans-serif' font-size='18' font-weight='800' fill='%2304141a' text-anchor='middle'>V</text></svg>">
  <link rel="stylesheet" href="/style.css">
  ${ldScripts}
  <script src="/script.js" defer></script>
  <script>if(!/^zh/i.test(navigator.language||navigator.userLanguage||'')){var s=document.createElement('script');s.defer=1;s.src='https://dash.cfworks.vip/script.js';s.dataset.websiteId='a1186f5a-71a5-40a2-a9c9-8ff3ed37ca3b';s.dataset.cfasync='false';document.head.appendChild(s)}</script>
</head>
<body>
${header()}
<main id="tresc">
${body}
</main>
${footer()}
</body>
</html>
`;
}

// ---------- 结构化数据 ----------
export function productLd({ product, flavor, image }) {
  const name = flavor ? `${product.name} — smak ${flavor.name}` : product.name;
  const offers =
    !flavor && product.flavors.length > 0
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'PLN',
          lowPrice: String(product.price),
          highPrice: String(product.price),
          offerCount: product.flavors.length,
          availability: 'https://schema.org/InStock',
          url: product.permalink,
        }
      : {
          '@type': 'Offer',
          price: String(product.price),
          priceCurrency: 'PLN',
          availability: 'https://schema.org/InStock',
          url: flavor ? flavor.buyUrl : product.permalink,
        };
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image,
    description: flavor
      ? `${product.name} w smaku ${flavor.name} — jednorazowy e-papieros o wydajności ${fmtPuffs(product.puffs)} puffs.`
      : product.shortDescription ||
        `${product.name} — jednorazowy e-papieros, ${fmtPuffs(product.puffs)} puffs, ${product.flavors.length} smaków.`,
    brand: { '@type': 'Brand', name: product.brand },
    sku: `${product.slug}${flavor ? '-' + flavor.slug : ''}`,
    offers,
  };
}

export function itemListLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  };
}

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: VAPEPL,
    foundingDate: String(STATS.since),
    description: `Sklep z jednorazówkami i e-papierosami w Polsce — ${STATS.brandsLabel} marek, ${STATS.productsLabel} produktów.`,
    sameAs: [VAPEPL, CONTACT.whatsapp, CONTACT.telegram.href],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: CONTACT.phone,
      email: CONTACT.email,
      contactType: 'customer support',
      availableLanguage: ['pl'],
    },
  };
}

export function faqLd(questions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

// ---------- 共享区块 ----------
// 原生 <details>/<summary> 手风琴（零 JS）。openFirst=true 时首条默认展开（首页用）。
export function faqBlock(questions, limit, openFirst = false) {
  const list = limit ? questions.slice(0, limit) : questions;
  return `
  <section class="section faq section--center" aria-labelledby="faq-title">
    <div class="container">
      <h2 id="faq-title">Najczęstsze pytania</h2>
      <div class="faq-list">
        ${list
          .map(
            (f, i) => `
      <details class="faq-item"${i === 0 && openFirst ? ' open' : ''}>
        <summary>
          <span class="faq-q">${esc(f.q)}</span>
          <span class="faq-chevron" aria-hidden="true"></span>
        </summary>
        <div class="faq-a"><p>${esc(f.a)}</p></div>
      </details>`,
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

export function discountBlock() {
  const lastIdx = DISCOUNT_TIERS.length - 1;
  return `
  <section class="section discount section--center" aria-labelledby="discount-title">
    <div class="container">
      <h2 id="discount-title">Rabat ilościowy</h2>
      <p>Kupując kilka sztuk tego samego produktu, automatycznie otrzymujesz rabat progowy — bez kodów:</p>
      <div class="discount-tiers">
        ${DISCOUNT_TIERS.map((t, i) => `
        <div class="discount-tier${i === lastIdx ? ' is-featured' : ''}">
          ${i === lastIdx ? '<span class="tier-badge">Najlepsza stawka</span>' : ''}
          <span class="tier-qty">${esc(t.qty)}</span>
          <b class="tier-off">${esc(t.off)}</b>
        </div>`).join('')}
      </div>
      <div class="discount-cta">
        <a class="btn btn-primary btn-lg" href="/sklep/">Zobacz sklep</a>
      </div>
    </div>
  </section>`;
}

export function trustStrip() {
  return `
  <section class="trust-strip" aria-label="Nasze atuty">
    <div class="container">
      ${WHY_US.map(
        (w) => `
      <div class="trust-item">
        ${icon(w.icon)}
        <b>${esc(w.title)}</b>
      </div>`,
      )
        .join('')}
    </div>
  </section>`;
}

export function reviewsBlock() {
  return `
  <section class="section reviews section--center" aria-labelledby="reviews-title">
    <div class="container">
      <h2 id="reviews-title">Opinie klientów</h2>
      <div class="reviews-grid">
        ${REVIEWS.map(
          (r) => `
      <blockquote class="review">
        <p class="review-stars" aria-label="Ocena: ${r.stars} z 5">${starRow(r.stars)}</p>
        <p>„${esc(r.text)}”</p>
        <footer>— ${esc(r.author)}</footer>
      </blockquote>`,
        )
          .join('')}
      </div>
    </div>
  </section>`;
}

export function productCard(product, rank, target = null) {
  const pct = discountPct(product);
  // target: { url, buyUrl } — 文章推荐位覆盖内部链接（口味页）与外跳购买链接
  const cardUrl = target?.url ?? `/produkt/${product.slug}/`;
  const buyUrl = target?.buyUrl ?? product.permalink;
  return `
  <article class="product-card">
    ${rank ? `<span class="card-rank" aria-label="Pozycja ${rank}">#${rank}</span>` : ''}
    ${pct ? `<span class="card-badge">-${pct}%</span>` : ''}
    <a class="card-media" href="${esc(cardUrl)}">
      ${product.image ? `<img src="${esc(product.image)}" alt="${esc(product.name)}" loading="lazy">` : ''}
    </a>
    <div class="card-body">
      <p class="card-brand">${esc(product.brand)}</p>
      <h3 class="card-title"><a href="${esc(cardUrl)}">${esc(product.name)}</a></h3>
      <p class="card-meta">${fmtPuffs(product.puffs)} puffs · ${product.flavors.length} smaków</p>
      <p class="card-price">
        ${product.onSale ? `<s>${fmtZl(product.regularPrice)}</s>` : ''}
        <strong>${fmtZl(product.price)}</strong>
      </p>
      <div class="card-actions">
        <a class="btn btn-ghost" href="${esc(cardUrl)}">Szczegóły</a>
        <a class="btn btn-primary" href="${esc(buyUrl)}" rel="nofollow">Kup</a>
      </div>
    </div>
  </article>`;
}

export function flavorChip(product, flavor, active = false) {
  return `<a class="flavor-chip${active ? ' is-active' : ''}" href="/produkt/${esc(product.slug)}/${esc(flavor.slug)}/">${esc(flavor.name)}</a>`;
}

// ---------- 文章（vapepl.com 精选文章镜像 + 关联推荐） ----------
// 文章卡片：站内文章页链接 + 外跳 vapepl.com 阅读原文（nofollow）
export function articleCard(guide) {
  return `
  <article class="article-card">
    <h3 class="article-title"><a href="/artykul/${esc(guide.id)}/">${esc(guide.title)}</a></h3>
    <p class="article-summary">${esc(guide.summary)}</p>
    <div class="article-actions">
      <a class="btn btn-ghost" href="/artykul/${esc(guide.id)}/">Czytaj</a>
      <a class="btn btn-ghost" href="${esc(guide.url)}" rel="nofollow" target="_blank">Pełna wersja →</a>
    </div>
  </article>`;
}

// 文章列表模块：全页复用，内容来自 data.guides（generate-guides.mjs 生成，50 篇数据驱动）。
// heading 非空时渲染可视 h2（首页/商品页/文章页），其余页面用 sr-only 标题避免与
// "相关文章"区块撞名；intro 为可信 HTML（含链接），不转义；exclude 排除已展示的
// 相关文章；limit 限制卡片数（50 篇全渲染会过重），hub 页传 12
export function articlesBlock(data, heading = '', intro = '', exclude = [], limit = 8) {
  const excluded = new Set(exclude.map((g) => g.id));
  const list = (data.guides ?? []).filter((g) => !excluded.has(g.id)).slice(0, limit);
  if (list.length === 0) return '';
  const h2 = heading
    ? `<h2 id="guides-title">${esc(heading)}</h2>
        ${intro ? `<p>${intro}</p>` : ''}`
    : '<h2 id="guides-title" class="sr-only">Wiedza o e-papierosach</h2>';
  const centered = heading ? ' section--center' : '';
  return `
  <section class="section guides${centered}" aria-labelledby="guides-title">
    <div class="container">
      ${h2}
      <div class="article-grid">
        ${list.map((g) => articleCard(g)).join('')}
      </div>
    </div>
  </section>`;
}

// 商品页 → 相关文章区块（相关文章为空时整块省略）
// precomputed: 调用方先算好的推荐列表（复用给 articlesBlock 的 exclude，避免重复计算）
export function relatedArticlesBlock(data, product, flavor, precomputed = null) {
  const list = (precomputed ?? relatedArticlesFor(data, product, flavor, data.guides)).slice(0, 4);
  if (!list.length) return '';
  const subject = flavor ? `${product.name} · smak ${flavor.name}` : `modelu ${product.name}`;
  return `
  <section class="section guides section--center" aria-labelledby="related-guides-title">
    <div class="container">
      <div class="section-head">
        <h2 id="related-guides-title">Poradnik do ${esc(subject)}</h2>
        <p>Zobacz, jak ten model radzi sobie w praktyce — wybrane artykuły z vapepl.com.</p>
      </div>
      <div class="article-grid">
        ${list.map((g) => articleCard(g)).join('')}
      </div>
    </div>
  </section>`;
}

// 数据条：4 格小卡（图标 + 数值 + 标签），数值由调用处按页型传入 → 页面间数字各不相同
export function statStrip(items) {
  if (!items.length) return '';
  return `
  <section class="stat-strip" aria-label="W liczbach">
    <div class="container">
      ${items
        .map(
          (s) => `
    <div class="stat-item">
      ${icon(s.icon ?? 'percent')}
      <b>${esc(s.value)}</b>
      <span>${esc(s.label)}</span>
    </div>`,
        )
        .join('')}
    </div>
  </section>`;
}

// 品牌分类页模型对比表：puffs/口味数/现价，按 puffs 降序，最大模型行高亮
export function compareTable(products) {
  if (products.length < 2) return '';
  const rows = [...products].sort((a, b) => (b.puffs ?? 0) - (a.puffs ?? 0));
  const topSlug = rows[0].slug;
  return `
  <section class="section section--center" aria-labelledby="compare-title">
    <div class="container">
      <h2 id="compare-title">Porównanie modeli</h2>
      <div class="table-scroll">
      <table class="compare-table">
        <thead>
          <tr><th scope="col">Model</th><th scope="col">Puffs</th><th scope="col">Smaki</th><th scope="col">Cena</th></tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (p) => `
          <tr${p.slug === topSlug ? ' class="is-top"' : ''}>
            <th scope="row"><a href="/produkt/${esc(p.slug)}/">${esc(p.name)}</a>${p.slug === topSlug ? ' <span class="row-badge">Największy</span>' : ''}</th>
            <td>${fmtPuffs(p.puffs)}</td>
            <td>${p.flavors.length}</td>
            <td>${fmtZl(p.price)}</td>
          </tr>`,
            )
            .join('')}
        </tbody>
      </table>
      </div>
    </div>
  </section>`;
}

export function renderArticle(data, guide) {
  const rec = recommendProductsFor(data, guide)[0];
  const crumb = breadcrumbs([{ label: 'Poradniki', url: '/' }, { label: guide.title, url: `/artykul/${guide.id}/` }]);
  const recCard = rec
    ? `
  <section class="section section--center" aria-labelledby="rec-title">
    <div class="container">
      <h2 id="rec-title">Zalecany produkt</h2>
      <p class="rec-intro">Do tego poradnika pasuje:</p>
      ${productCard(rec.product, null, { url: rec.url, buyUrl: rec.buyUrl })}
    </div>
  </section>`
    : '';
  const jsonld = [
    organizationLd(),
    crumb.ld,
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.summary,
      url: SITE + `/artykul/${guide.id}/`,
      mainEntityOfPage: SITE + `/artykul/${guide.id}/`,
      publisher: { '@type': 'Organization', name: SITE_NAME, url: VAPEPL },
      datePublished: guide.datePublished ?? '2026-01-01',
    },
    ...(rec
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: guide.title,
            about: {
              '@type': 'Product',
              name: rec.name,
              url: SITE + rec.url,
              brand: { '@type': 'Brand', name: rec.product.brand },
              offers: {
                '@type': 'Offer',
                price: String(rec.product.price),
                priceCurrency: 'PLN',
                url: rec.product.permalink,
              },
            },
          },
        ]
      : []),
  ];
  const body = `
  ${crumb.html}
  <section class="page-hero">
    <div class="container article-hero">
      <p class="article-kicker">Poradnik · źródło: <a href="${esc(guide.url)}" rel="nofollow" target="_blank">vapepl.com</a></p>
      <h1>${esc(guide.title)}</h1>
      <p>${esc(guide.summary)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="${esc(guide.url)}" rel="nofollow" target="_blank">Przeczytaj pełny artykuł →</a>
        ${rec ? `<a class="btn btn-ghost" href="${esc(rec.url)}">Zalecany produkt</a>` : ''}
      </div>
    </div>
  </section>
  ${recCard}
  ${articlesBlock(data, 'Wszystkie poradniki', '', [], 12)}`;
  return page({
    title: `${guide.title} | ${SITE_NAME}`,
    description: `${guide.summary} Pełna wersja poradnika na vapepl.com.`,
    canonical: SITE + `/artykul/${guide.id}/`,
    ogImage: rec?.product.image,
    jsonld,
    body,
  });
}

// ---------- 页面渲染 ----------
export function renderHome(data) {
  const bySlug = new Map(data.products.map((p) => [p.slug, p]));
  const top = topProducts(data);
  const flavorCats = Object.entries(FLAVOR_CATS).map(([slug, c]) => ({
    slug,
    ...c,
    count: data.categories.find((x) => x.slug === slug)?.count ?? 0,
  }));
  // 口味榜数据化：站内口味频次实时排序（flavorGroups 已按频次降序），
  // 有落地页（≥3 款）的口味名链到 /smak/<slug>/
  const topFlavors = flavorGroups(data, 1).slice(0, 12).map((g, i) => ({
    ...g,
    rank: i + 1,
  }));
  const heroImage = bySlug.get('stag-bar-6in1-180000-puffs')?.image;
  const jsonld = [
    organizationLd(),
    faqLd(HOME_FAQ),
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE,
      description: 'Oferta jednorazówek i e-papierosów — kierunek vapepl.com',
    },
    itemListLd(
      top.map((p) => ({ name: p.name, url: SITE + `/produkt/${p.slug}/` })),
    ),
  ];
  const body = `
  <section class="hero">
    <div class="container hero-grid">
      <div class="hero-copy">
        <p class="hero-kicker">Jednorazówki · Pody · E-papierosy</p>
        <h1>${SITE_NAME} — ${STATS.productsLabel} modeli od ${STATS.brandsLabel} marek, do <strong>−20%</strong> rabatu</h1>
        <p>Od roku ${STATS.since} sprzedajemy wyselekcjonowane jednorazówki w Polsce. Wybierz model na tej stronie, a zakup sfinalizujesz w sklepie <a href="${VAPEPL}" rel="nofollow">vapepl.com</a> — polski magazyn, Paczkomaty InPost i kurier DPD.</p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" href="/sklep/">Przeglądaj sklep</a>
          <a class="btn btn-ghost btn-lg" href="/kontakt/">Kontakt</a>
        </div>
        <ul class="hero-stats" aria-label="Statystyki sklepu">
          <li><b>${STATS.productsLabel}</b><span>produktów</span></li>
          <li><b>${STATS.brandsLabel}</b><span>marek</span></li>
          <li><b>${fmtZl(Math.min(...data.products.map((p) => p.price)))}</b><span>ceny od</span></li>
          <li><b>${STATS.ratingLabel}</b><span>opinie</span></li>
        </ul>
      </div>
      ${heroImage ? `
      <figure class="hero-media">
        <img src="${esc(heroImage)}" alt="STAG BAR 6IN1 180000 puffs — flagowy model 6 w 1" fetchpriority="high">
        <figcaption>Flagowiec STAG BAR 6IN1 — do 180 000 puffs w jednym urządzeniu</figcaption>
      </figure>` : ''}
    </div>
  </section>
  ${discountBlock()}
  ${trustStrip()}
  <section class="section section--center" aria-labelledby="top-title">
    <div class="container">
      <div class="section-head">
        <h2 id="top-title">Topowe trendy</h2>
        <p>Najczęściej kupowane modele — z miejscami na podium.</p>
      </div>
      <div class="product-grid">
        ${top.map((p, i) => productCard(p, i + 1)).join('')}
      </div>
    </div>
  </section>
  <section class="section brands section--center" aria-labelledby="brands-title">
    <div class="container">
      <h2 id="brands-title">Nasze marki</h2>
      <div class="brand-grid">
        ${data.categories
          .filter((c) => c.kind === 'brand')
          .sort((a, b) => BRAND_ORDER.indexOf(a.slug) - BRAND_ORDER.indexOf(b.slug))
          .map(
            (c) => `
      <a class="brand-card" href="/kategoria/${esc(c.slug)}/">
        <span class="brand-initial" aria-hidden="true">${esc((BRANDS[c.slug]?.name ?? c.name).charAt(0))}</span>
        <b>${esc(c.name)}</b>
        <span>${c.count} produkt${c.count === 1 ? '' : 'y'}</span>
        <i class="sr-only">${esc(BRANDS[c.slug]?.blurb ?? '')}</i>
      </a>`,
          )
          .join('')}
      </div>
    </div>
  </section>
  <section class="section flavors section--center" aria-labelledby="flavor-title">
    <div class="container">
      <h2 id="flavor-title">Kategorie smaków</h2>
      <div class="flavor-grid">
        ${flavorCats
          .map(
            (c) => `
      <a class="flavor-card" href="/kategoria/${esc(c.slug)}/">
        ${icon(c.icon)}
        <b>${esc(c.name)}</b>
        <span>${c.count} produktów</span>
      </a>`,
          )
          .join('')}
      </div>
      <h3 class="subhead">Najpopularniejsze smaki</h3>
      <ul class="top-flavors">
        ${topFlavors
          .map(
            (f) => `
      <li>
        <span class="flavor-rank${f.rank <= 3 ? ` top-${f.rank}` : ''}" aria-hidden="true">${f.rank}</span>
        ${f.models >= 3
          ? `<a href="/smak/${esc(f.slug)}/">${esc(f.name)}</a>`
          : esc(f.name)}
        <span class="flavor-cnt">${f.models} ${pluralModels(f.models)}</span>
      </li>`,
          )
          .join('')}
      </ul>
    </div>
  </section>
  ${reviewsBlock()}
  ${articlesBlock(
    data,
    'Wiedza o e-papierosach',
    `Poradniki z <a href="${VAPEPL}" rel="nofollow">vapepl.com</a> — wybrane artykuły z zalecanymi produktami:`,
  )}
  ${faqBlock(HOME_FAQ, undefined, true)}`;
  return page({
    title: `Jednorazówki i e-papierosy — ${STATS.productsLabel} modeli, 7 marek | ${SITE_NAME}`,
    description: `Oferta ${STATS.productsLabel} jednorazówek od ${STATS.brandsLabel} marek (ceny od ${fmtZl(
      Math.min(...data.products.map((p) => p.price)),
    )}). Polski magazyn, rabaty do −20%, 14 dni na zwrot. Kup na vapepl.com.`,
    canonical: SITE + '/',
    ogImage: heroImage,
    jsonld,
    body,
    lcpImage: heroImage ?? '',
  });
}

export function renderShop(data) {
  const top = topProducts(data);
  const crumb = breadcrumbs([{ label: 'Sklep', url: '/sklep/' }]);
  const flavorsTotal = data.products.reduce((s, p) => s + p.flavors.length, 0);
  const minPrice = Math.min(...data.products.map((p) => p.price));
  const bands = puffBandsFor(data).filter((b) => b.products.length > 0);
  const scenarios = scenariosFor(data);
  const priceBands = priceBandsFor(data).filter((b) => b.products.length > 0);
  const stats = [
    { icon: 'leaf', value: String(data.products.length), label: `${pluralModels(data.products.length)} w ofercie` },
    { icon: 'droplet', value: String(flavorsTotal), label: 'smaków do wyboru' },
    { icon: 'banknote', value: fmtZl(minPrice), label: 'ceny od' },
    { icon: 'percent', value: '−20%', label: 'rabat ilościowy' },
  ];
  const body = `
  ${crumb.html}
  <div class="container page-title-row">
    <h1>Sklep — wszystkie ${data.products.length} modeli</h1>
  </div>
  ${statStrip(stats)}
  ${discountBlock()}
  ${trustStrip()}
  ${bands.length ? `
  <div class="container">
    <h2 class="subhead" id="band-title">Wydajność w puffsach</h2>
    <div class="flavor-chips">
      ${bands
        .map(
          (b) =>
            `<a class="flavor-chip" href="/kategoria/puffs-${esc(b.id)}/">${esc(b.label)}</a>`,
        )
        .join('')}
    </div>
  </div>` : ''}
  <div class="container">
    <h2 class="subhead" id="filter-title">Przeglądaj według</h2>
    <div class="flavor-chips">
      ${scenarios
        .map((s) => `<a class="flavor-chip" href="/scenariusz/${esc(s.id)}/">${esc(s.name)}</a>`)
        .join('')}
      ${priceBands
        .map((b) => `<a class="flavor-chip is-muted" href="/kategoria/cena-${esc(b.id)}/">${esc(b.label)}</a>`)
        .join('')}
    </div>
  </div>
  <section class="section section--center" aria-labelledby="top-title">
    <div class="container">
      <h2 id="top-title">Bestselleri</h2>
      <div class="product-grid">
        ${top.map((p, i) => productCard(p, i + 1)).join('')}
      </div>
    </div>
  </section>
  <section class="section section--center" aria-labelledby="catalog-title">
      <div class="container product-grid">
      <h2 id="catalog-title">Pełna oferta</h2>
      ${data.products.map((p) => productCard(p)).join('')}
    </div>
  </section>
  ${articlesBlock(data)}
  ${faqBlock(HOME_FAQ, 4)}`;
  const jsonld = [
    organizationLd(),
    crumb.ld,
    itemListLd(data.products.map((p) => ({ name: p.name, url: SITE + `/produkt/${p.slug}/` }))),
  ];
  return page({
    title: `Sklep z jednorazówkami i e-papierosami — ${data.products.length} modeli | ${SITE_NAME}`,
    description: `Pełna oferta ${data.products.length} jednorazówek w promocji: ceny od ${fmtZl(
      Math.min(...data.products.map((p) => p.price)),
    )}, 220 smaków do wyboru. Rabat ilościowy do −20%. Zakup na vapepl.com.`,
    canonical: SITE + '/sklep/',
    jsonld,
    body,
  });
}

export function renderCategory(data, category) {
  // 分类成员优先用 categoryMembers（分类接口权威映射，覆盖产品侧标签与分类
  // count 不一致的情况，如 tobacco）；缺失时回退到产品自带分类
  const members = data.categoryMembers?.[category.slug];
  const products = members
    ? data.products.filter((p) => members.includes(p.slug))
    : data.products.filter((p) => p.categories.some((c) => c.slug === category.slug));
  const meta =
    category.kind === 'brand'
      ? BRANDS[category.slug] ?? { name: category.name, blurb: '' }
      : FLAVOR_CATS[category.slug] ?? { name: category.name, blurb: '' };
  // 子口味导航：flavor 类分类页内产品口味频次 Top 8，链到口味落地页（有 ≥3 款的才出页）
  const landingSlugs = new Set(flavorGroups(data, 2).map((g) => g.slug));
  const subFlavors =
    category.kind === 'flavor'
      ? (() => {
          const freq = new Map();
          for (const p of products)
            for (const f of p.flavors) {
              const key = f.name.trim().toLowerCase().replace(/&/g, ' ');
              freq.set(key, (freq.get(key) ?? 0) + 1);
            }
          return [...freq.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([key, n]) => {
              const slug = key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
              return {
                key,
                n,
                slug,
                hasLanding: landingSlugs.has(slug),
              };
            });
        })()
      : [];
  const title =
    category.kind === 'brand'
      ? `Marka ${category.name} — jednorazówki i pody | ${SITE_NAME}`
      : `Smaki ${category.name} — jednorazówki ${category.count} produktów | ${SITE_NAME}`;
  const desc =
    category.kind === 'brand'
      ? `${meta.blurb || `Wszystkie produkty marki ${category.name}.`} Ceny od ${fmtZl(
          products.length ? Math.min(...products.map((p) => p.price)) : 0,
        )} — zakup na vapepl.com.`
      : `Kategoria smaków ${category.name}: ${products.length} produktów, od ${fmtZl(
          products.length ? Math.min(...products.map((p) => p.price)) : 0,
        )}. Zobacz wszystkie smaki i kup na vapepl.com.`;
  const crumb = breadcrumbs([
    { label: 'Sklep', url: '/sklep/' },
    { label: category.name, url: `/kategoria/${category.slug}/` },
  ]);
  const categoryFaqs = categoryFaq(data, category, products);
  const jsonld = [
    organizationLd(),
    crumb.ld,
    itemListLd(products.map((p) => ({ name: p.name, url: SITE + `/produkt/${p.slug}/` }))),
    faqLd(categoryFaqs),
  ];
  // 统计条：分类级数值（产品数/口味数/价格区间/最低单千 puff 成本），逐页不同
  const stats = products.length
    ? (() => {
        const minP = Math.min(...products.map((p) => p.price));
        const maxP = Math.max(...products.map((p) => p.price));
        const flavorsTotal = products.reduce((s, p) => s + p.flavors.length, 0);
        const eff = products
          .filter((p) => p.puffs > 0)
          .map((p) => (p.price / p.puffs) * 1000);
        const bestEff = eff.length ? Math.min(...eff) : null;
        return [
          { icon: 'leaf', value: String(products.length), label: category.kind === 'brand' ? `${pluralModels(products.length)} marki` : `${pluralProducts(products.length)} w smaku` },
          { icon: 'droplet', value: String(flavorsTotal), label: 'smaków łącznie' },
          {
            icon: 'banknote',
            value:
              minP === maxP
                ? fmtZl(minP)
                : `${fmtZl(minP)} – ${fmtZl(maxP)}`,
            label: 'zakres cen',
          },
          bestEff === null
            ? { icon: 'percent', value: '—', label: 'zł / 1000 puffs' }
            : {
                icon: 'percent',
                value:
                  new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(bestEff) +
                  ' zł',
                label: 'najtańszy puffs kosztuje',
              },
        ];
      })()
    : [];
  const body = `
  ${crumb.html}
  <section class="page-hero">
    <div class="container">
      <h1>${category.kind === 'brand' ? `Marka ${category.name}` : `Smaki: ${category.name}`}</h1>
      <p>${esc(meta.blurb || `Wybierz model, porównaj smaki i przejdź do zakupu na vapepl.com.`)} W tej kategorii: <strong>${products.length}</strong> ${pluralProducts(products.length)}${
        category.count && products.length !== category.count ? ` (na sklepie ${category.count} w tym smaku)` : ''
      }.</p>
    </div>
  </section>
  ${discountBlock()}
  <section class="section">
    <div class="container product-grid">
      ${products.length ? products.map((p) => productCard(p)).join('') : '<p>Brak produktów w tej kategorii.</p>'}
    </div>
  </section>
  ${statStrip(stats)}
  ${subFlavors.length ? `
  <section class="section section--center" aria-labelledby="subflav-title">
    <div class="container">
      <div class="section-head">
        <h2 id="subflav-title">Często kupowane smaki</h2>
        <p>Wybrane aromaty dostępne w tej kategorii — kliknij, by porównać warianty.</p>
      </div>
      <div class="flavor-chips">
        ${subFlavors
          .map(
            (s) =>
              s.hasLanding
                ? `<a class="flavor-chip" href="/smak/${esc(s.slug)}/">${esc(s.key.charAt(0).toUpperCase() + s.key.slice(1))}</a>`
                : `<span class="flavor-chip is-disabled">${esc(s.key.charAt(0).toUpperCase() + s.key.slice(1))}</span>`,
          )
          .join('')}
      </div>
    </div>
  </section>` : ''}
  ${category.kind === 'brand' ? compareTable(products) : ''}
  ${faqBlock(categoryFaqs)}
  ${articlesBlock(data)}`;
  return page({
    title,
    description: desc,
    canonical: SITE + `/kategoria/${category.slug}/`,
    ogImage: products[0]?.image ?? category.image,
    jsonld,
    body,
  });
}

// 品牌分类（用于面包屑与品牌页），由 data.categories 推导
export const brandSlugFor = (data, product) =>
  data.categories.find((c) => c.kind === 'brand' && c.name === product.brand)?.slug ?? null;

export function renderProduct(data, product) {
  const flavors = product.flavors;
  const brandSlug = brandSlugFor(data, product);
  const crumb = breadcrumbs([
    { label: 'Sklep', url: '/sklep/' },
    ...(brandSlug
      ? [{ label: product.brand, url: `/kategoria/${brandSlug}/` }]
      : []),
    { label: product.name, url: `/produkt/${product.slug}/` },
  ]);
  const image = product.image ?? '';
  const desc = product.shortDescription ||
    `${product.name} — jednorazowy e-papieros ${fmtPuffs(product.puffs)} puffs, ${flavors.length} smaków. W promocji: ${fmtZl(product.price)}.`;
  const faqs = productFaq(product, data);
  const related = relatedArticlesFor(data, product, null, data.guides).slice(0, 4);
  const jsonld = [
    organizationLd(),
    crumb.ld,
    productLd({ product, flavor: null, image }),
    faqLd(faqs),
  ];
  const specs = [
    ['Marka', product.brand],
    ['Wydajność', `${fmtPuffs(product.puffs)} puffs`],
    ['Liczba smaków', String(flavors.length)],
    ['Cena', fmtZl(product.price)],
    ['Cena przed promocją', product.onSale ? fmtZl(product.regularPrice) : null],
    ['Status', product.onSale ? 'W promocji' : 'W ofercie'],
  ];
  const body = `
  ${crumb.html}
  <section class="section product-detail">
    <div class="container product-layout">
      <figure class="product-media">
        ${product.image ? `<img src="${esc(product.image)}" alt="${esc(product.name)}" fetchpriority="high">` : ''}
        <figcaption>${esc(product.name)}</figcaption>
      </figure>
      <div class="product-info">
        <p class="product-brand">${esc(product.brand)}</p>
        <h1>${esc(product.name)}</h1>
        ${flavors.length ? `<p class="product-flavor-count">${flavors.length} dostępnych smaków</p>` : ''}
        <p class="product-price">
          ${product.onSale ? `<s>${fmtZl(product.regularPrice)}</s>` : ''}
          <strong>${fmtZl(product.price)}</strong>
        </p>
        <p class="product-desc">${esc(desc)}</p>
        <div class="product-cta">
          <a class="btn btn-primary btn-lg" href="${esc(product.permalink)}" rel="nofollow">Kup na vapepl.com →</a>
          <a class="btn btn-ghost" href="/sklep/">Wróć do sklepu</a>
        </div>
        <table class="specs">
          ${specs
            .filter(([, v]) => v)
            .map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`)
            .join('')}
        </table>
      </div>
    </div>
  </section>
  ${discountBlock()}
  ${flavors.length ? `
  <section class="section flavors-list section--center" aria-labelledby="flavors-title">
    <div class="container">
      <h2 id="flavors-title">Wybierz smak</h2>
      <p>Każdy smak ma swoją stronę — porównaj i kup wybrany wariant na vapepl.com.</p>
      <div class="flavor-chips">
        ${flavors.map((f) => flavorChip(product, f)).join('')}
      </div>
    </div>
  </section>` : ''}
  ${relatedArticlesBlock(data, product, null, related)}
  ${faqBlock(faqs)}
  ${articlesBlock(data, 'Wszystkie poradniki', '', related)}`;
  return page({
    title: `${product.name} — ${fmtPuffs(product.puffs)} puffs, ${fmtZl(product.price)} | ${SITE_NAME}`,
    description: desc,
    canonical: SITE + `/produkt/${product.slug}/`,
    ogImage: image,
    ogType: 'product',
    jsonld,
    body,
    lcpImage: image ?? '',
  });
}

export function renderFlavor(data, product, flavor) {
  const brandSlug = brandSlugFor(data, product);
  const crumb = breadcrumbs([
    { label: 'Sklep', url: '/sklep/' },
    ...(brandSlug
      ? [{ label: product.brand, url: `/kategoria/${brandSlug}/` }]
      : []),
    { label: product.name, url: `/produkt/${product.slug}/` },
    { label: flavor.name, url: `/produkt/${product.slug}/${flavor.slug}/` },
  ]);
  const angle = flavorAngle(flavor.name);
  const title = `${product.name} — smak ${flavor.name} | ${SITE_NAME}`;
  const desc = `${product.name} w smaku ${flavor.name} — ${angle}. Wydajność ${fmtPuffs(
    product.puffs,
  )} puffs, cena ${fmtZl(product.price)} (w promocji, wcześniej ${fmtZl(product.regularPrice)}). Zakup na vapepl.com.`;
  const faqs = flavorFaq(product, flavor, angle);
  const related = relatedArticlesFor(data, product, flavor, data.guides).slice(0, 4);
  // 跨模型互推：归一化匹配同口味的其他模型（排除当前模型），逐口味页不同
  const myKey = flavorKey(flavor.name);
  const crossModels = data.products
    .filter((p) => p.slug !== product.slug)
    .filter((p) => p.flavors.some((f) => flavorKey(f.name) === myKey))
    .slice(0, 8);
  const jsonld = [
    organizationLd(),
    crumb.ld,
    productLd({ product, flavor, image: product.image ?? '' }),
    faqLd(faqs),
  ];
  const body = `
  ${crumb.html}
  <section class="section product-detail">
    <div class="container product-layout">
      <figure class="product-media">
        ${product.image ? `<img src="${esc(product.image)}" alt="${esc(product.name)} — smak ${esc(flavor.name)}" fetchpriority="high">` : ''}
        <figcaption>${esc(product.name)} · smak ${esc(flavor.name)}</figcaption>
      </figure>
      <div class="product-info">
        <p class="product-brand">${esc(product.brand)}</p>
        <h1>${esc(product.name)} — smak ${esc(flavor.name)}</h1>
        <p class="product-desc">
          ${esc(
            `${product.name} w wersji ${flavor.name} to ${angle}. Urządzenie oferuje ${fmtPuffs(product.puffs)} puffs w przystępnej cenie ${fmtZl(product.price)}. Wybierz smak, dodaj do koszyka na vapepl.com i odbierz w Paczkomacie lub kurierem DPD.`,
          )}
        </p>
        <p class="product-price">
          <s>${fmtZl(product.regularPrice)}</s>
          <strong>${fmtZl(product.price)}</strong>
        </p>
        <div class="product-cta">
          <a class="btn btn-primary btn-lg" href="${esc(flavor.buyUrl)}" rel="nofollow">Kup smak ${esc(flavor.name)} →</a>
          <a class="btn btn-ghost" href="/produkt/${esc(product.slug)}/">Wszystkie smaki</a>
        </div>
        <table class="specs">
          <tr><th scope="row">Smak</th><td>${esc(flavor.name)}</td></tr>
          <tr><th scope="row">Marka</th><td>${esc(product.brand)}</td></tr>
          <tr><th scope="row">Wydajność</th><td>${fmtPuffs(product.puffs)} puffs</td></tr>
          <tr><th scope="row">Cena</th><td>${fmtZl(product.price)}</td></tr>
          <tr><th scope="row">W promocji</th><td>${product.onSale ? 'Tak' : 'Nie'}</td></tr>
          <tr><th scope="row">Zakres smaków w tym modelu</th><td>${product.flavors.length}</td></tr>
        </table>
      </div>
    </div>
  </section>
  ${discountBlock()}
  <section class="section section--center" aria-labelledby="related-title">
    <div class="container">
      <h2 id="related-title">Inne smaki modelu ${esc(product.name)}</h2>
      <div class="flavor-chips">
        ${product.flavors.map((f) => flavorChip(product, f, f.slug === flavor.slug)).join('')}
      </div>
    </div>
  </section>
  ${crossModels.length ? `
  <section class="section section--center" aria-labelledby="cross-title">
    <div class="container">
      <div class="section-head">
        <h2 id="cross-title">Ten smak w innych modelach</h2>
        <p>${
          crossModels.length === 1
            ? `Smak ${esc(flavor.name)} kupisz też w 1 innym modelu — kliknij, by porównać warianty.`
            : `Smak ${esc(flavor.name)} kupisz też w ${crossModels.length} innych modelach — kliknij, by porównać warianty.`
        }</p>
      </div>
      <div class="flavor-chips">
        ${crossModels
          .map((p) => {
            const f = p.flavors.find((x) => flavorKey(x.name) === myKey);
            const tip = `${p.name} · ${f.name} · ${fmtPuffs(p.puffs)} puffs · ${fmtZl(p.price)}`;
            return `<a class="flavor-chip" href="/produkt/${esc(p.slug)}/${esc(f.slug)}/" title="${esc(tip)}">${esc(p.name)}</a>`;
          })
          .join('')}
      </div>
    </div>
  </section>` : ''}
  ${relatedArticlesBlock(data, product, flavor, related)}
  ${faqBlock(faqs)}
  ${articlesBlock(data, 'Wszystkie poradniki', '', related)}`;
  return page({
    title,
    description: desc,
    canonical: SITE + `/produkt/${product.slug}/${flavor.slug}/`,
    ogImage: product.image,
    ogType: 'product',
    jsonld,
    body,
    lcpImage: product.image ?? '',
  });
}

// ---------- 口味落地页（/smak/<slug>/）：跨模型聚合同一口味，直购 + 数据条 + 定制 FAQ ----------
export function renderFlavorLanding(data, group) {
  const angle = flavorAngle(group.name);
  const crumb = breadcrumbs([
    { label: 'Sklep', url: '/sklep/' },
    { label: `Smak: ${group.name}`, url: `/smak/${group.slug}/` },
  ]);
  // 相关文章：组内各模型的相关文章并集去重，取前 4
  const relatedUnion = [];
  for (const { product } of group.products) {
    for (const g of relatedArticlesFor(data, product, null)) {
      if (!relatedUnion.some((x) => x.id === g.id)) relatedUnion.push(g);
    }
  }
  const related = relatedUnion.slice(0, 4);
  const faqs = flavorLandingFaq(group);
  const jsonld = [
    organizationLd(),
    crumb.ld,
    itemListLd(
      group.products.map((x) => ({
        name: `${x.product.name} — ${x.flavor.name}`,
        url: SITE + `/produkt/${x.product.slug}/${x.flavor.slug}/`,
      })),
    ),
    faqLd(faqs),
  ];
  const stats = [
    { icon: 'leaf', value: String(group.models), label: `${pluralModels(group.models)} z tym smakiem` },
    { icon: 'droplet', value: String(group.count), label: 'opcji zakupu' },
    {
      icon: 'banknote',
      value:
        group.minPrice === group.maxPrice
          ? fmtZl(group.minPrice)
          : `${fmtZl(group.minPrice)} – ${fmtZl(group.maxPrice)}`,
      label: 'zakres cen',
    },
    { icon: 'percent', value: fmtZl(group.minPrice), label: 'ceny od' },
  ];
  const buyCard = (x) => `
  <article class="product-card flavor-buy">
    <a class="card-media" href="/produkt/${esc(x.product.slug)}/${esc(x.flavor.slug)}/">
      ${x.product.image ? `<img src="${esc(x.product.image)}" alt="${esc(x.product.name)} — smak ${esc(x.flavor.name)}" loading="lazy">` : ''}
    </a>
    <div class="card-body">
      <p class="card-brand">${esc(x.product.brand)}</p>
      <h3 class="card-title"><a href="/produkt/${esc(x.product.slug)}/${esc(x.flavor.slug)}/">${esc(x.product.name)} — ${esc(x.flavor.name)}</a></h3>
      <p class="card-meta">${fmtPuffs(x.product.puffs)} puffs</p>
      <p class="card-price"><strong>${fmtZl(x.product.price)}</strong></p>
      <div class="card-actions">
        <a class="btn btn-ghost" href="/produkt/${esc(x.product.slug)}/${esc(x.flavor.slug)}/">Szczegóły</a>
        <a class="btn btn-primary" href="${esc(x.flavor.buyUrl)}" rel="nofollow">Kup</a>
      </div>
    </div>
  </article>`;
  const body = `
  ${crumb.html}
  <section class="page-hero">
    <div class="container">
      <h1>Smak: ${esc(group.name)}</h1>
      <p>${esc(
        `${group.name} to ${angle}. Dostępny w ${group.models} modelach — porównaj warianty i kup wybrany na vapepl.com.`,
      )}</p>
    </div>
  </section>
  ${statStrip(stats)}
  <section class="section section--center" aria-labelledby="buy-title">
    <div class="container">
      <div class="section-head">
        <h2 id="buy-title">Kup smak ${esc(group.name)}</h2>
        <p>Każdy wariant prowadzi do strony smaku z wybranym wariantem w koszyku vapepl.com.</p>
      </div>
      <div class="product-grid">
        ${group.products.map(buyCard).join('')}
      </div>
    </div>
  </section>
  <section class="section section--center" aria-labelledby="carriers-title">
    <div class="container">
      <h2 id="carriers-title">Modele z tym smakiem</h2>
      <div class="product-grid">
        ${[...new Map(group.products.map((x) => [x.product.slug, x.product])).values()].map((p) => productCard(p)).join('')}
      </div>
    </div>
  </section>
  ${related.length ? relatedArticlesFromList(related) : ''}
  ${faqBlock(faqs)}
  ${articlesBlock(data, 'Wszystkie poradniki', '', related)}`;
  return page({
    title: `Smak ${group.name} — ${group.models} modeli, od ${fmtZl(group.minPrice)} | ${SITE_NAME}`,
    description: `Smak ${group.name} (${angle}) w ${group.models} modelach, od ${fmtZl(
      group.minPrice,
    )}. Porównaj warianty i kup na vapepl.com.`,
    canonical: SITE + `/smak/${group.slug}/`,
    ogImage: group.products[0]?.product.image,
    jsonld,
    body,
  });
}

// 相关文章区块（可传入预先算好的文章列表，避免重复调用评分）
export function relatedArticlesFromList(list) {
  if (!list.length) return '';
  return `
  <section class="section guides section--center" aria-labelledby="related-guides-title">
    <div class="container">
      <div class="section-head">
        <h2 id="related-guides-title">Zobacz, jak smaki radzą sobie w praktyce</h2>
        <p>Wybrane artykuły z vapepl.com.</p>
      </div>
      <div class="article-grid">
        ${list.map((g) => articleCard(g)).join('')}
      </div>
    </div>
  </section>`;
}

// ---------- puffs 段分类页（/kategoria/puffs-<id>/）：按 puffs 区间切"品类" ----------
// 段/场景页共用的数据条数值（款数/puffs 区间/价格区间/最低单千 puff 成本）
function bandStats(products, countLabel) {
  if (!products.length) return [];
  const minP = Math.min(...products.map((p) => p.price));
  const maxP = Math.max(...products.map((p) => p.price));
  const eff = products
    .filter((p) => p.puffs > 0)
    .map((p) => (p.price / p.puffs) * 1000);
  const best = eff.length ? Math.min(...eff) : null;
  return [
    { icon: 'leaf', value: String(products.length), label: countLabel },
    {
      icon: 'droplet',
      value: `${fmtPuffs(Math.min(...products.map((p) => p.puffs)))} – ${fmtPuffs(
        Math.max(...products.map((p) => p.puffs)),
      )} puffs`,
      label: 'zakres wydajności',
    },
    {
      icon: 'banknote',
      value:
        minP === maxP
          ? fmtZl(minP)
          : `${fmtZl(minP)} – ${fmtZl(maxP)}`,
      label: 'zakres cen',
    },
    {
      icon: 'percent',
      value:
        best === null
          ? '—'
          : new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(best) +
            ' zł',
      label: 'najtańszy puffs kosztuje',
    },
  ];
}

export function renderPuffsBand(data, band) {
  const products = band.products;
  const crumb = breadcrumbs([
    { label: 'Sklep', url: '/sklep/' },
    { label: `Puffs: ${band.label}`, url: `/kategoria/puffs-${band.id}/` },
  ]);
  const faqs = bandFaq(band.label, products);
  const jsonld = [
    organizationLd(),
    crumb.ld,
    itemListLd(products.map((p) => ({ name: p.name, url: SITE + `/produkt/${p.slug}/` }))),
    faqLd(faqs),
  ];
  const stats = bandStats(products, 'modeli w segmencie');
  const body = `
  ${crumb.html}
  <section class="page-hero">
    <div class="container">
      <h1>Puffs: ${esc(band.label)}</h1>
      <p>Wybierz wydajność dopasowaną do Twoich potrzeb — ${esc(
        band.id === '100k-plus'
          ? 'najdłużej działające modele, idealne dla osób szukających urządzenia na miesiące.'
          : band.id === 'do-20k'
            ? 'kompaktowe, lekkie modele na start i w podróży.'
            : 'złoty środek: solidna liczba puffs bez kompromisów w rozmiarze.',
      )}</p>
    </div>
  </section>
  ${statStrip(stats)}
  <section class="section">
    <div class="container product-grid">
      ${products.length ? products.map((p) => productCard(p)).join('') : '<p>Brak produktów w tym segmencie.</p>'}
    </div>
  </section>
  ${compareTable(products)}
  ${faqBlock(faqs)}
  ${articlesBlock(data)}`;
  return page({
    title: `Jednorazówki ${band.label} — ${products.length} modeli | ${SITE_NAME}`,
    description: `Modele z wydajnością ${band.label}: ${products.length} produktów, porównaj puffs i ceny i kup na vapepl.com.`,
    canonical: SITE + `/kategoria/puffs-${band.id}/`,
    ogImage: products[0]?.image,
    jsonld,
    body,
  });
}

// ---------- 使用场景页（/scenariusz/<id>/）：4 个数据驱动场景，top 4 命中集互异 ----------
export function renderScenario(data, scenario) {
  const products = scenario.products;
  const crumb = breadcrumbs([
    { label: 'Sklep', url: '/sklep/' },
    { label: scenario.name, url: `/scenariusz/${scenario.id}/` },
  ]);
  const faqs = bandFaq(scenario.name, products);
  const jsonld = [
    organizationLd(),
    crumb.ld,
    itemListLd(products.map((p) => ({ name: p.name, url: SITE + `/produkt/${p.slug}/` }))),
    faqLd(faqs),
  ];
  const stats = bandStats(products, 'modeli w tym scenariuszu');
  // 数量自适应：n=4 时与旧版逐字一致（保住既有场景页 lastmod），其余场景按实际款数
  const countWord = products.length === 3 ? 'Trzy' : 'Cztery';
  const body = `
  ${crumb.html}
  <section class="page-hero">
    <div class="container">
      <h1>${esc(scenario.name)}</h1>
      <p>${esc(scenario.blurb)}</p>
    </div>
  </section>
  ${statStrip(stats)}
  <section class="section section--center" aria-labelledby="top4-title">
    <div class="container">
      <div class="section-head">
        <h2 id="top4-title">Nasze top ${products.length} — ${esc(scenario.name.toLowerCase())}</h2>
        <p>${countWord} modele wybrane pod ten scenariusz, w kolejności rekomendowanej.</p>
      </div>
      <div class="product-grid">
        ${products.map((p, i) => productCard(p, i + 1)).join('')}
      </div>
    </div>
  </section>
  ${compareTable(products)}
  ${faqBlock(faqs)}
  ${articlesBlock(data, 'Wszystkie poradniki')}`;
  return page({
    title: `${scenario.name} — top ${products.length} modeli | ${SITE_NAME}`,
    description: `${scenario.name}: ${products.map((p) => p.name).join(', ')}. Porównaj i kup na vapepl.com.`,
    canonical: SITE + `/scenariusz/${scenario.id}/`,
    ogImage: products[0]?.image,
    jsonld,
    body,
  });
}

// ---------- 价格段页（/kategoria/cena-<id>/）：按价格区间切"品类" ----------
export function renderPriceBand(data, band) {
  const products = band.products;
  const crumb = breadcrumbs([
    { label: 'Sklep', url: '/sklep/' },
    { label: `Cena: ${band.label}`, url: `/kategoria/cena-${band.id}/` },
  ]);
  const faqs = bandFaq(band.label, products);
  const jsonld = [
    organizationLd(),
    crumb.ld,
    itemListLd(products.map((p) => ({ name: p.name, url: SITE + `/produkt/${p.slug}/` }))),
    faqLd(faqs),
  ];
  const stats = bandStats(products, 'modeli w tym przedziale');
  const body = `
  ${crumb.html}
  <section class="page-hero">
    <div class="container">
      <h1>Cena: ${esc(band.label)}</h1>
      <p>Modele w przedziale cenowym ${esc(band.label)} — ${esc(
        band.id === 'do-70'
          ? 'najtańsza półka: sprawdź, ile puffs daje się w tej cenie.'
          : band.id === '71-100'
            ? 'środkowa półka: najlepszy stosunek ceny do liczby puffs.'
            : 'najwydajniejsze urządzenia w ofercie — płacisz więcej, ale puffs starcza na miesiące.',
      )}</p>
    </div>
  </section>
  ${statStrip(stats)}
  <section class="section">
    <div class="container product-grid">
      ${products.length ? products.map((p) => productCard(p)).join('') : '<p>Brak produktów w tym przedziale.</p>'}
    </div>
  </section>
  ${compareTable(products)}
  ${faqBlock(faqs)}
  ${articlesBlock(data)}`;
  return page({
    title: `Jednorazówki ${band.label} — ${products.length} modeli | ${SITE_NAME}`,
    description: `Modele w przedziale ${band.label}: ${products.length} produktów w promocji. Porównaj i kup na vapepl.com.`,
    canonical: SITE + `/kategoria/cena-${band.id}/`,
    ogImage: products[0]?.image,
    jsonld,
    body,
  });
}

// ---------- 型号对比页（/porownanie/<a>-vs-<b>/）：X vs Y 参数矩阵 + 数值化 FAQ ----------
// 矩阵为"指标为行、两款为列"的转置表，胜者列在指标行打 row-badge，避免与 compareTable 复用样式冲突
const effPer1000 = (p) => (p.puffs > 0 ? (p.price / p.puffs) * 1000 : null);

function comparisonMatrix(pair) {
  const { a, b } = pair;
  // 每项指标给两侧打胜者标记（'more' 越大越好，'less' 越小越好，'tie' 无胜者）
  const rows = [
    { label: 'Puffs', fa: a.puffs ?? 0, fb: b.puffs ?? 0, better: 'more', fmt: fmtPuffs, unit: 'puffs' },
    { label: 'Cena', fa: a.price, fb: b.price, better: 'less', fmt: fmtZl },
    { label: 'Smaki', fa: a.flavors.length, fb: b.flavors.length, better: 'more', fmt: (n) => String(n), unit: 'smaków' },
    {
      label: 'Zł / 1000 puffs',
      fa: effPer1000(a),
      fb: effPer1000(b),
      better: 'less',
      fmt: (n) =>
        n == null
          ? '—'
          : new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' zł',
    },
  ];
  const badge = (isWin, note) => (isWin ? `<span class="row-badge">${esc(note)}</span>` : '');
  const win = (row) =>
    row.fa === row.fb ? null : row.better === 'more' ? (row.fa > row.fb ? 'a' : 'b') : row.fa < row.fb ? 'a' : 'b';
  return `
  <div class="table-scroll">
  <table class="compare-table">
    <thead>
      <tr><th scope="col">Parametr</th><th scope="col">${esc(a.name)}</th><th scope="col">${esc(b.name)}</th></tr>
    </thead>
    <tbody>
      ${rows
        .map((row) => {
          const w = win(row);
          const note = w === 'a' ? 'Lepiej' : w === 'b' ? 'Lepiej' : 'Remis';
          return `
          <tr>
            <th scope="row">${esc(row.label)}</th>
            <td>${esc(row.fmt(row.fa))}${badge(w === 'a', note)}</td>
            <td>${esc(row.fmt(row.fb))}${badge(w === 'b', note)}</td>
          </tr>`;
        })
        .join('')}
    </tbody>
  </table>
  </div>`;
}

export function renderComparison(data, pair) {
  const { a, b } = pair;
  const crumb = breadcrumbs([
    { label: 'Sklep', url: '/sklep/' },
    { label: pair.name, url: pair.url },
  ]);
  const faqs = comparisonFaq(pair);
  const jsonld = [
    organizationLd(),
    crumb.ld,
    faqLd(faqs),
    itemListLd([
      { name: a.name, url: SITE + `/produkt/${a.slug}/` },
      { name: b.name, url: SITE + `/produkt/${b.slug}/` },
    ]),
  ];
  const body = `
  ${crumb.html}
  <section class="page-hero">
    <div class="container">
      <h1>${esc(pair.name)} — który lepszy?</h1>
      <p>${esc(pair.blurb)}</p>
    </div>
  </section>
  <section class="section section--center" aria-labelledby="cmp-title">
    <div class="container">
      <div class="section-head">
        <h2 id="cmp-title">${esc(a.name)} a ${esc(b.name)} w liczbach</h2>
      </div>
      ${comparisonMatrix(pair)}
    </div>
  </section>
  <section class="section section--center" aria-labelledby="cards-title">
    <div class="container">
      <div class="section-head">
        <h2 id="cards-title">Sprawdź w sklepie</h2>
      </div>
      <div class="product-grid">
        ${[a, b].map((p, i) => productCard(p, i + 1)).join('')}
      </div>
    </div>
  </section>
  ${faqBlock(faqs)}
  ${articlesBlock(data, 'Wszystkie poradniki')}`;
  return page({
    title: `${pair.name} — porównanie | ${SITE_NAME}`,
    description: `${pair.name}: puffs, ceny i smaków w jednym. Sprawdź, który model ma lepszy stosunek ceny do wydajności.`,
    canonical: SITE + pair.url,
    ogImage: a.image,
    jsonld,
    body,
  });
}

export function renderContact(data) {
  const crumb = breadcrumbs([{ label: 'Kontakt', url: '/kontakt/' }]);
  const jsonld = [
    organizationLd(),
    crumb.ld,
    faqLd(HOME_FAQ.slice(-2)),
  ];
  const body = `
  ${crumb.html}
  <section class="page-hero">
    <div class="container">
      <h1>Kontakt</h1>
      <p>Napisz lub zadzwoń — odpowiadamy zwykle w ciągu jednego dnia roboczego. Godziny: <strong>${esc(CONTACT.hours)}</strong>.</p>
    </div>
  </section>
  <section class="section contact">
    <div class="container contact-grid">
      <a class="contact-card" href="${CONTACT.phoneHref}">
        ${icon('phone')}
        <b>Telefon</b>
        <span>${esc(CONTACT.phone)}</span>
      </a>
      <a class="contact-card" href="${esc(CONTACT.whatsapp)}" rel="nofollow">
        ${icon('message')}
        <b>WhatsApp</b>
        <span>${esc(CONTACT.phone)}</span>
      </a>
      <a class="contact-card" href="${esc(CONTACT.telegram.href)}" rel="nofollow">
        ${icon('send')}
        <b>Telegram</b>
        <span>${esc(CONTACT.telegram.label)}</span>
      </a>
      <a class="contact-card" href="mailto:${esc(CONTACT.email)}">
        ${icon('mail')}
        <b>E-mail</b>
        <span>${esc(CONTACT.email)}</span>
      </a>
    </div>
    <div class="container">
      <h2>Pytania o zamówienie</h2>
      <p>Status zamówienia i numer śledzenia wysyłamy w e-mailu potwierdzającym po nadaniu paczki. Jeśli potrzebujesz pomocy, napisz przez WhatsApp lub Telegram i podaj numer zamówienia — zajmiemy się sprawą zwykle w ciągu jednego dnia roboczego.</p>
    </div>
  </section>
  ${faqBlock(HOME_FAQ.slice(-2))}`;
  return page({
    title: `Kontakt — ${SITE_NAME}`,
    description: `Skontaktuj się z obsługą: telefon ${CONTACT.phone}, WhatsApp, Telegram ${CONTACT.telegram.label} lub e-mail ${CONTACT.email}. Godziny ${CONTACT.hours}.`,
    canonical: SITE + '/kontakt/',
    jsonld,
    body,
  });
}

export function renderReturns(data) {
  const crumb = breadcrumbs([{ label: 'Zwroty', url: '/zwroty/' }]);
  const jsonld = [organizationLd(), crumb.ld];
  const cards = [
    {
      icon: 'calendar',
      title: 'Prawo odstąpienia od umowy',
      body: `Masz <strong>14 dni</strong> na odstąpienie od umowy bez podania przyczyny. Wymagania: produkt nienaruszony i w oryginalnym opakowaniu oraz dowód zakupu (faktura/rachunek) do zidentyfikowania zamówienia.`,
    },
    {
      icon: 'ban',
      title: 'Wyłączenia',
      body: 'Produktom higienicznym (otwarte liquidy, użyte wkłady, otwarte opakowania jednorazówek) prawo odstąpienia nie przysługuje — zasady wynikają z polskiego prawa konsumenckiego.',
    },
    {
      icon: 'banknote',
      title: 'Zwrot kosztów i termin',
      body: `Zwrot następuje tą samą metodą płatności w ciągu <strong>14 dni</strong> od otrzymania przesyłki zwrotnej. Koszty zwrotu ponosi kupujący, chyba że błąd jest po stronie sklepu.`,
    },
    {
      icon: 'package',
      title: 'Wysyłka zwrotna',
      body: 'Paczkę nadasz <strong>InPost Paczkomatem</strong> lub <strong>DPD Pickup</strong>. W paczce dołącz dowód zakupu i krótką notatkę z powodem zwrotu.',
    },
    {
      icon: 'shield-check',
      title: 'Rękojmia',
      body: 'Wadliwy towar rozpatrujemy w ramach rękojmi — zgłoś reklamację ze zdjęciami. Sklep zweryfikuje produkt w terminie 14 dni: naprawa, wymiana lub zwrot.',
    },
    {
      icon: 'phone',
      title: 'Masz pytania?',
      body: `Problem z przesyłką zwrotną? Napisz przez WhatsApp lub Telegram (${esc(CONTACT.telegram.label)}) — odpowiadamy zwykle w ciągu jednego dnia roboczego.`,
      cta: `<a class="returns-card-link" href="/kontakt/">Dane kontaktowe →</a>`,
    },
  ];
  const body = `
  ${crumb.html}
  <section class="page-hero">
    <div class="container">
      <h1>Polityka zwrotów</h1>
      <p>Nasze zasady zwrotów i reklamacji w skrócie — wszystkie informacje, których potrzebujesz, znajdziesz na tej stronie.</p>
    </div>
  </section>
  <section class="section returns section--center" aria-labelledby="returns-title">
    <div class="container">
      <h2 id="returns-title">Jak działają zwroty</h2>
      <p>Skrócone zasady: 14 dni na odstąpienie od umowy, zwrot kosztów i rękojmia w jednym miejscu.</p>
      <div class="returns-grid">
        ${cards
          .map(
            (c) => `
        <div class="returns-card">
          ${icon(c.icon)}
          <h3>${esc(c.title)}</h3>
          <p>${c.body}</p>
          ${c.cta ?? ''}
        </div>`,
          )
          .join('')}
      </div>
    </div>
  </section>`;
  return page({
    title: `Polityka zwrotów — 14 dni na odstąpienie | ${SITE_NAME}`,
    description: 'Polityka zwrotów: 14 dni na odstąpienie od umowy bez podania przyczyny. Wymagania, wyłączenia i zasady rękojmi w jednym miejscu.',
    canonical: SITE + '/zwroty/',
    jsonld,
    body,
  });
}

export function render404(data) {
  const body = `
  <section class="page-hero">
    <div class="container">
      <h1>Strona nie znaleziona</h1>
      <p>Nie mamy tej podstrony. Wróć do sklepu lub sprawdź listę produktów.</p>
    </div>
  </section>
  <section class="section not-found section--center">
    <div class="container">
      <a class="btn btn-primary btn-lg" href="/sklep/">Wróć do sklepu</a>
      <a class="btn btn-ghost btn-lg" href="/">Strona główna</a>
    </div>
  </section>
  ${articlesBlock(data)}`;
  return page({
    title: `Nie znaleziono — ${SITE_NAME}`,
    description: 'Ta podstrona nie istnieje. Wróć do sklepu z jednorazówkami i e-papierosami.',
    canonical: SITE + '/404.html',
    jsonld: [organizationLd()],
    body,
    noFollow: true,
  });
}
