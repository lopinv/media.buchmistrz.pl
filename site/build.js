// site/build.js — 静态站构建入口：读 data/products.json + 模板 → dist/
// 零依赖，需 Node >= 18。用法: node site/build.js
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  readdirSync,
  existsSync,
} from 'node:fs';
import { dirname, join, relative, posix } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { SITE, SITE_NAME, CNAME, flavorGroups, puffBandsFor, scenariosFor, priceBandsFor, comparisonPairsFor } from './src/content.js';
import {
  renderHome,
  renderShop,
  renderCategory,
  renderProduct,
  renderFlavor,
  renderContact,
  renderReturns,
  render404,
  renderArticle,
  renderFlavorLanding,
  renderPuffsBand,
  renderScenario,
  renderPriceBand,
  renderComparison,
} from './src/templates.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const MANIFEST_FILE = join(ROOT, 'data', 'page-manifest.json');
const today = new Date().toISOString().slice(0, 10);
const data = JSON.parse(readFileSync(join(ROOT, 'data', 'products.json'), 'utf8'));
// 文章库（generate-guides.mjs 生成的数据驱动清单；缺失时退回空库）
data.guides = existsSync(join(ROOT, 'data', 'guides.json'))
  ? JSON.parse(readFileSync(join(ROOT, 'data', 'guides.json'), 'utf8'))
  : [];

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

function out(rel, html) {
  const full = join(DIST, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html);
}

// 框架页
out('index.html', renderHome(data));
out('sklep/index.html', renderShop(data));
out('kontakt/index.html', renderContact(data));
out('zwroty/index.html', renderReturns(data));
out('404.html', render404(data));

// 分类页
for (const cat of data.categories) out(`kategoria/${cat.slug}/index.html`, renderCategory(data, cat));

// puffs 段分类页（按 puffs 区间切分，数据驱动，仅出有产品的段）
for (const band of puffBandsFor(data)) {
  if (band.products.length) out(`kategoria/puffs-${band.id}/index.html`, renderPuffsBand(data, band));
}

// 口味落地页（同一口味在 ≥3 款产品中可选才出页，/smak/<slug>/ 独立命名空间）
for (const group of flavorGroups(data, 2)) out(`smak/${group.slug}/index.html`, renderFlavorLanding(data, group));

// 价格段页（按价格区间切分，数据驱动，仅出有产品的段）
for (const band of priceBandsFor(data)) {
  if (band.products.length) out(`kategoria/cena-${band.id}/index.html`, renderPriceBand(data, band));
}

// 使用场景页（数据驱动场景，命中集互异）
for (const s of scenariosFor(data)) out(`scenariusz/${s.id}/index.html`, renderScenario(data, s));

// 型号对比页（锚定式配对 /porownanie/<a>-vs-<b>/）
for (const pair of comparisonPairsFor(data)) out(`porownanie/${pair.slug}/index.html`, renderComparison(data, pair));

// 商品聚合页 + 每个口味变体页
for (const product of data.products) {
  out(`produkt/${product.slug}/index.html`, renderProduct(data, product));
  for (const flavor of product.flavors) {
    out(`produkt/${product.slug}/${flavor.slug}/index.html`, renderFlavor(data, product, flavor));
  }
}

// 文章页（vapepl.com 精选文章站内镜像）
for (const guide of data.guides) out(`artykul/${guide.id}/index.html`, renderArticle(data, guide));

// 旧文章 URL 301 重定向：这几个 slug 已被数据驱动文章库取代、不再有站内链接，
// 但作为历史 URL（外链/搜索收录）保留入口，按「就近匹配」指向新文章或回落 /sklep/。
// 页面位于 /artykul/<slug>/（相对站点根深度 2），目标用站点根绝对路径书写，
// 此处换算成与深度匹配的相对写法（根目录预览与 GitHub Pages 子目录双兼容，同 /produkt/ 先例）。
const LEGACY_ARTICLE_REDIRECTS = [
  ['najlepsza-jednorazowka-5-scenariuszy', '/artykul/najlepsze-jednorazowki-tornado-lux-i-stag/'],
  ['randm-tornado-9000-poradnik', '/artykul/jednorazowka-cena-dni-uzycia-tornado-9k-lux-i-stag-bar/'],
  ['co-zamiast-jednorazowek', '/artykul/liquid-pl-dla-poczatkujacych-dream-lux-i-stag-krok-po-kroku/'],
  ['iqos-vs-papieros', '/sklep/'],
  ['e-papieros-vs-papieros', '/sklep/'],
  ['jednorazowka-50mg', '/sklep/'],
];
for (const [slug, target] of LEGACY_ARTICLE_REDIRECTS) {
  // 深度 2 相对换算：同目录 artykul/ 兄弟用 ../<slug>/，其余用 ../../<target 去根>
  const relTarget = target.startsWith('/artykul/')
    ? `../${target.slice('/artykul/'.length)}`
    : `../../${target.slice(1)}`;
  out(
    `artykul/${slug}/index.html`,
    `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=${relTarget}">
  <link rel="canonical" href="${SITE}${target}">
  <meta name="robots" content="noindex">
  <title>Przekierowanie — ${SITE_NAME}</title>
  <script>location.replace('${relTarget}');</script>
  <script>if(!/^zh/i.test(navigator.language||navigator.userLanguage||'')){var s=document.createElement('script');s.defer=1;s.src='https://dash.cfworks.vip/script.js';s.dataset.websiteId='a1186f5a-71a5-40a2-a9c9-8ff3ed37ca3b';s.dataset.cfasync='false';document.head.appendChild(s)}</script>
</head>
<body>
  <p>Przekierowanie… <a href="${relTarget}">Przejdź dalej</a></p>
</body>
</html>
`,
  );
}

// 旧分段 URL 301 重定向：分段细化后旧段被新段取代（puffs-20-50k→20-30k/30-50k 等），
// 保留历史入口指向重叠度最大的新段，避免旧 URL 404。位于 /kategoria/（深度 2），
// 同目录兄弟段用 ../<newSlug>/ 相对写法（根预览与 GitHub Pages 子目录双兼容）。
const LEGACY_BAND_REDIRECTS = [
  ['puffs-20-50k', 'puffs-20-30k'],
  ['cena-do-70', 'cena-do-60'],
  ['cena-71-100', 'cena-76-100'],
  ['cena-od-101', 'cena-101-140'],
];
for (const [oldSlug, newSlug] of LEGACY_BAND_REDIRECTS) {
  const relTarget = `../${newSlug}/`;
  out(
    `kategoria/${oldSlug}/index.html`,
    `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=${relTarget}">
  <link rel="canonical" href="${SITE}/kategoria/${newSlug}/">
  <meta name="robots" content="noindex">
  <title>Przekierowanie — ${SITE_NAME}</title>
  <script>location.replace('${relTarget}');</script>
  <script>if(!/^zh/i.test(navigator.language||navigator.userLanguage||'')){var s=document.createElement('script');s.defer=1;s.src='https://dash.cfworks.vip/script.js';s.dataset.websiteId='a1186f5a-71a5-40a2-a9c9-8ff3ed37ca3b';s.dataset.cfasync='false';document.head.appendChild(s)}</script>
</head>
<body>
  <p>Przekierowanie… <a href="${relTarget}">Przejdź dalej</a></p>
</body>
</html>
`,
  );
}

// 静态资源与辅助文件
// /produkt/ 直接访问（不带 slug）不是真实路由：重定向到商品列表页，避免落到 404。
// ../sklep/ 相对写法在 GitHub Pages 子目录与本地根预览下都成立。
out(
  'produkt/index.html',
  `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=../sklep/">
  <link rel="canonical" href="${SITE}/sklep/">
  <meta name="robots" content="noindex">
  <title>Przekierowanie do sklepu — ${SITE_NAME}</title>
  <script>location.replace('../sklep/');</script>
  <script>if(!/^zh/i.test(navigator.language||navigator.userLanguage||'')){var s=document.createElement('script');s.defer=1;s.src='https://dash.cfworks.vip/script.js';s.dataset.websiteId='a1186f5a-71a5-40a2-a9c9-8ff3ed37ca3b';s.dataset.cfasync='false';document.head.appendChild(s)}</script>
</head>
<body>
  <p>Przekierowanie… <a href="../sklep/">Wejdź do sklepu</a></p>
</body>
</html>
`,
);
for (const f of ['style.css', 'script.js']) {
  writeFileSync(join(DIST, f), readFileSync(join(ROOT, 'src', f)));
}
// 自托管 webfont（Inter 可变字重，latin + latin-ext 子集）
const FONTS_SRC = join(ROOT, 'src', 'fonts');
if (existsSync(FONTS_SRC)) {
  mkdirSync(join(DIST, 'fonts'), { recursive: true });
  for (const f of readdirSync(FONTS_SRC)) {
    writeFileSync(join(DIST, 'fonts', f), readFileSync(join(FONTS_SRC, f)));
  }
}
writeFileSync(join(DIST, '.nojekyll'), '');

writeFileSync(
  join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: ${SITE}/sitemap.xml\n`,
);

// GitHub Pages 自定义域名：仓库根 CNAME（内容为域名本身，换行结尾），
// 随构建产物同步到 gh-pages 分支生效
writeFileSync(join(DIST, 'CNAME'), CNAME + '\n');

// ---------- 内链相对化（在 distFiles 收集之后执行）----------
// GitHub Pages 自定义域名（github.vapepl.com）与本地根目录预览都要可用：
// 按页面深度把 href="/..."、src="/..." 改写为相对路径。
// 绝对 URL（https://cdn…、SITE 前缀）不匹配 'href="/'，不受影响。

// ---------- 构建自检：JSON-LD 合法性 + 站内链接可达性（相对化之后校验）----------
const distFiles = new Set();
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else distFiles.add(relative(DIST, p).replace(/\\/g, '/'));
  }
})(DIST);

const htmlFiles = [...distFiles].filter((f) => f.endsWith('.html'));

// 相对化：depth = 页面所在目录层级（index.html→0, x/index.html→1, x/y/index.html→2）
for (const file of htmlFiles) {
  const depth = file.split('/').filter(Boolean).length - 1;
  const up = '../'.repeat(depth);
  const home = depth === 0 ? './' : up; // 首页链接
  let html = readFileSync(join(DIST, file), 'utf8');
  html = html.replaceAll('href="/"', `href="${home}"`);
  html = html.replaceAll('href="/', `href="${up}`);
  html = html.replaceAll('src="/', `src="${up}`);
  writeFileSync(join(DIST, file), html);
}

// ---------- 页面清单 + sitemap.xml（必须在内链相对化之后，按最终字节哈希）----------
// 每个页面的 SHA-1 与 data/page-manifest.json 比对：内容未变则沿用旧 lastmod，
// 让重复构建不向搜索引擎谎报"全站今天改过"；内容变化/新增 URL 才落今日日期。
const manifestKey = (f) =>
  f === 'index.html' ? '/' : `/${f.replace(/index\.html$/, '').replace(/\\/g, '/')}`;
let prevManifest = {};
if (existsSync(MANIFEST_FILE)) {
  prevManifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));
}
const manifest = {};
let manifestChanged = 0;
for (const file of htmlFiles) {
  const key = manifestKey(file);
  const hash = createHash('sha1').update(readFileSync(join(DIST, file))).digest('hex');
  const prev = prevManifest[key];
  if (prev?.h === hash) manifest[key] = prev;
  else {
    manifest[key] = { h: hash, m: today };
    manifestChanged += 1;
  }
}
// 按 key 排序回写（LF / UTF-8 无 BOM），保证清单本身的 git diff 稳定
const manifestSorted = Object.fromEntries(
  Object.keys(manifest)
    .sort()
    .map((k) => [k, manifest[k]]),
);
writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifestSorted, null, 2)}\n`);

// sitemap：lastmod 逐 URL 取清单戳（内容真实变更日期），changefreq/priority 维持原有分档
const pageLastmod = (key) => manifest[key]?.m ?? (data.fetchedAt ?? today).slice(0, 10);
const entry = (key, { changefreq, priority }) =>
  `  <url>\n    <loc>${SITE}${key}</loc>\n    <lastmod>${pageLastmod(key)}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
const entries = [
  entry('/', { changefreq: 'daily', priority: 1.0 }),
  entry('/sklep/', { changefreq: 'weekly', priority: 0.9 }),
  entry('/kontakt/', { changefreq: 'monthly', priority: 0.3 }),
  entry('/zwroty/', { changefreq: 'monthly', priority: 0.3 }),
  ...data.categories.map((c) =>
    entry(`/kategoria/${c.slug}/`, { changefreq: 'weekly', priority: 0.7 })),
  ...puffBandsFor(data).filter((b) => b.products.length).map((b) =>
    entry(`/kategoria/puffs-${b.id}/`, { changefreq: 'weekly', priority: 0.6 })),
  ...priceBandsFor(data).filter((b) => b.products.length).map((b) =>
    entry(`/kategoria/cena-${b.id}/`, { changefreq: 'weekly', priority: 0.6 })),
  ...scenariosFor(data).map((s) =>
    entry(`/scenariusz/${s.id}/`, { changefreq: 'weekly', priority: 0.6 })),
  ...comparisonPairsFor(data).map((p) =>
    entry(`/porownanie/${p.slug}/`, { changefreq: 'monthly', priority: 0.6 })),
  ...flavorGroups(data, 2).map((g) =>
    entry(`/smak/${g.slug}/`, { changefreq: 'weekly', priority: 0.6 })),
  ...data.products.flatMap((p) => [
    entry(`/produkt/${p.slug}/`, { changefreq: 'weekly', priority: 0.7 }),
    ...p.flavors.map((f) =>
      entry(`/produkt/${p.slug}/${f.slug}/`, { changefreq: 'weekly', priority: 0.5 })),
  ]),
  ...data.guides.map((g) =>
    entry(`/artykul/${g.id}/`, { changefreq: 'monthly', priority: 0.4 })),
];
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap-0.9">\n${entries.join('\n')}\n</urlset>\n`,
);

let jsonLdErrors = 0;
const linkErrors = new Set();
let objectErrors = 0;

for (const file of htmlFiles) {
  const html = readFileSync(join(DIST, file), 'utf8');
  // 模板插值对象未取 .html 时会漏出 "[object Object]"，构建即报错
  if (/\[object Object\]/.test(html)) {
    objectErrors += 1;
    console.error(`✘ 检测到 [object Object]（模板插值了对象）: ${file}`);
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch {
      jsonLdErrors += 1;
      console.error(`✘ JSON-LD 解析失败: ${file}`);
    }
  }
  // 相对化后校验：href/src 相对路径按当前页目录解析，.. 段归一化到 dist 内
  const baseDir = posix.dirname(file); // index.html→.，sklep/index.html→sklep
  for (const m of html.matchAll(/href="([^"]+)"|src="([^"]+)"/g)) {
    const href = m[1] ?? m[2];
    if (/^(https?:|mailto:|tel:|data:|#)/.test(href)) continue;
    const norm = posix.normalize(posix.join(baseDir, href));
    if (norm === '.' || norm === './' || norm === '') {
      if (!distFiles.has('index.html')) linkErrors.add(href); // 站点根
      continue;
    }
    const last = norm.split('/').pop() || '';
    if (!norm.endsWith('/') && last.includes('.')) {
      if (!distFiles.has(norm)) linkErrors.add(href); // 文件型
    } else if (!distFiles.has(norm.replace(/\/?$/, '') + '/index.html')) {
      linkErrors.add(href); // 目录型
    }
  }
}

console.log(
  [
    `✔ HTML 页面: ${htmlFiles.length}`,
    `✔ 内容变更: ${manifestChanged}/${Object.keys(manifestSorted).length} 页`,
    `✔ dist 文件总数: ${distFiles.size}`,
    jsonLdErrors ? `✘ JSON-LD 错误: ${jsonLdErrors}` : '✔ JSON-LD 全部合法',
    linkErrors.size ? `✘ 断链 ${linkErrors.size} 处: ${[...linkErrors].slice(0, 10).join(', ')}` : '✔ 站内链接全部可达',
    objectErrors ? `✘ [object Object] 泄漏: ${objectErrors} 页` : '✔ 无 [object Object] 泄漏',
  ].join('\n'),
);
if (jsonLdErrors || linkErrors.size || objectErrors) process.exit(1);
