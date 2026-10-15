// site/fetch.mjs — 抓取 vapepl.com 全量商品目录（WooCommerce Store API + 商品页下拉框），
// 归一化后写入 site/data/products.json。零依赖，需 Node >= 18。
// 用法: node site/fetch.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://vapepl.com/wp-json';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VapePL-catalog-sync/1.0';
const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'data', 'products.json');
const BRAND_SLUGS = ['airmez', 'fumot', 'hifancy', 'maskking', 'merrymi', 'stagbar', 'xcor'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}`);
  return res.json();
}

async function fetchPaged(path) {
  const items = [];
  for (let page = 1; page <= 20; page += 1) {
    const sep = path.includes('?') ? '&' : '?';
    const batch = await getJson(`${API}${path}${sep}per_page=100&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    items.push(...batch);
    if (batch.length < 100) break;
    await sleep(300);
  }
  return items;
}

const money = (minor) => Number(minor) / 100;

function puffsFromName(name) {
  const m = String(name).toUpperCase().match(/(\d+)\s*PUFFS/);
  return m ? Number(m[1]) : null;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripHtml(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function prettyName(slug) {
  return slug
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// 商品页口味下拉框：分类法属性（attribute_pa_smaki）的值是 slug；自定义属性
// （attribute_smaki）的值是显示名。属性名决定购买链接的参数名与值的编码方式
async function selectFromProductPage(permalink) {
  try {
    const res = await fetch(permalink, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const html = await res.text();
    const select = html.match(/<select[^>]*name=["'](attribute_[a-z0-9_]+)["'][^>]*>([\s\S]*?)<\/select>/i);
    if (!select) return null;
    const options = [...select[2].matchAll(/<option[^>]*value=["']([^"']*)["'][^>]*>([^<]*)</gi)]
      .map((m) => ({ value: m[1], label: m[2].replace(/&/g, '&').trim() }))
      .filter((o) => o.value !== '');
    return { name: select[1], options };
  } catch {
    return null;
  }
}

async function main() {
  const [rawProducts, rawCategories, popularity] = await Promise.all([
    fetchPaged('/wc/store/v1/products'),
    fetchPaged('/wc/store/v1/products/categories'),
    getJson(`${API}/wc/store/v1/products?orderby=popularity&per_page=8`),
  ]);

  // 畅销榜：以 WooCommerce 当前累计销量（popularity）实时排序，取前 8
  const topSellers = popularity.map((p) => p.slug);

  const categories = rawCategories.map((c) => ({
    id: c.id,
    name: stripHtml(c.name),
    slug: c.slug,
    count: c.count,
    description: stripHtml(c.description),
    image: c.image?.src ?? null,
    permalink: c.permalink,
    kind: BRAND_SLUGS.includes(c.slug) ? 'brand' : 'flavor',
  }));

  const products = [];
  let flavorsTotal = 0;
  let verified = 0;

  for (const p of rawProducts) {
    await sleep(350);
    const sel = await selectFromProductPage(p.permalink);
    const attrParam = sel?.name ?? 'attribute_pa_smaki';
    const isSlugAttr = attrParam === 'attribute_pa_smaki';

    // 口味清单以商品页下拉框为准（即顾客实际可选购的选项）；页面抓取失败时
    // 回退 API variations（pa_smaki 值即 slug，自定义属性值即显示名）
    const options =
      sel && sel.options.length > 0
        ? sel.options
        : (p.variations ?? [])
            .map((v) => v.attributes?.find((a) => a.name === 'Smaki')?.value)
            .filter(Boolean)
            .map((value) => ({ value, label: isSlugAttr ? prettyName(value) : value }));

    const flavors = options.map((o) => {
      const slug = isSlugAttr ? o.value : slugify(o.value);
      const name = o.label || (isSlugAttr ? prettyName(o.value) : o.value);
      if (sel) verified += 1;
      return {
        name,
        slug,
        buyUrl: `${p.permalink}?${attrParam}=${encodeURIComponent(o.value)}`,
        selectVerified: Boolean(sel),
      };
    });
    flavorsTotal += flavors.length;

    const cats = (p.categories ?? []).map((c) => ({ name: stripHtml(c.name), slug: c.slug }));
    const brand = cats.find((c) => BRAND_SLUGS.includes(c.slug))?.name ?? null;

    products.push({
      id: p.id,
      name: stripHtml(p.name),
      slug: p.slug,
      brand,
      puffs: puffsFromName(p.name),
      price: money(p.prices.price),
      regularPrice: money(p.prices.regular_price),
      onSale: p.on_sale,
      averageRating: p.average_rating,
      reviewCount: p.review_count,
      shortDescription: stripHtml(p.short_description),
      description: stripHtml(p.description),
      permalink: p.permalink,
      image: p.images?.[0]?.src ?? null,
      gallery: (p.images ?? []).slice(0, 3).map((i) => i.src),
      categories: cats,
      flavors: flavors.sort((a, b) => a.name.localeCompare(b.name, 'pl')),
    });
  }

  products.sort(
    (a, b) => (a.brand ?? '').localeCompare(b.brand ?? '') || (b.puffs ?? 0) - (a.puffs ?? 0),
  );

  const data = {
    fetchedAt: new Date().toISOString(),
    source: API,
    currency: 'PLN',
    buyUrlVerified: verified,
    topSellers,
    categories,
    products,
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log(`✔ products: ${products.length}, flavors: ${flavorsTotal}, verified buy links: ${verified}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
