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
import { fileURLToPath } from 'node:url';
import { SITE } from './src/content.js';
import {
  renderHome,
  renderShop,
  renderCategory,
  renderProduct,
  renderFlavor,
  renderContact,
  renderReturns,
  render404,
} from './src/templates.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const data = JSON.parse(readFileSync(join(ROOT, 'data', 'products.json'), 'utf8'));

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

// 商品聚合页 + 每个口味变体页
for (const product of data.products) {
  out(`produkt/${product.slug}/index.html`, renderProduct(data, product));
  for (const flavor of product.flavors) {
    out(`produkt/${product.slug}/${flavor.slug}/index.html`, renderFlavor(data, product, flavor));
  }
}

// 静态资源与辅助文件
for (const f of ['style.css', 'script.js']) {
  writeFileSync(join(DIST, f), readFileSync(join(ROOT, 'src', f)));
}
writeFileSync(join(DIST, '.nojekyll'), '');

// 与生成页面一一对应的 sitemap.xml
const urls = [
  SITE + '/',
  SITE + '/sklep/',
  SITE + '/kontakt/',
  SITE + '/zwroty/',
  ...data.categories.map((c) => SITE + `/kategoria/${c.slug}/`),
  ...data.products.flatMap((p) => [
    SITE + `/produkt/${p.slug}/`,
    ...p.flavors.map((f) => SITE + `/produkt/${p.slug}/${f.slug}/`),
  ]),
];
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url>\n    <loc>${u}</loc>\n  </url>`)
    .join('\n')}\n</urlset>\n`,
);
writeFileSync(
  join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: ${SITE}/sitemap.xml\n`,
);

// ---------- 内链相对化（在 distFiles 收集之后执行）----------
// GitHub Pages 子目录部署（lopinv.github.io/media.buchmistrz.pl/）与本地根目录
// 预览都要可用：按页面深度把 href="/..."、src="/..." 改写为相对路径。
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

let jsonLdErrors = 0;
const linkErrors = new Set();

for (const file of htmlFiles) {
  const html = readFileSync(join(DIST, file), 'utf8');
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
    `✔ dist 文件总数: ${distFiles.size}`,
    jsonLdErrors ? `✘ JSON-LD 错误: ${jsonLdErrors}` : '✔ JSON-LD 全部合法',
    linkErrors.size ? `✘ 断链 ${linkErrors.size} 处: ${[...linkErrors].slice(0, 10).join(', ')}` : '✔ 站内链接全部可达',
  ].join('\n'),
);
if (jsonLdErrors || linkErrors.size) process.exit(1);
