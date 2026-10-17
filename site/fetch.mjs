// site/fetch.mjs — 抓取 vapepl.com 全量商品目录（WooCommerce Store API + 商品页下拉框）
// 与全量文章（WP REST /wp/v2/posts），归一化后写入 site/data/。零依赖，需 Node >= 18。
// 用法: node site/fetch.mjs [--only products|guides]（缺省两者都刷）
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flavorKey, flavorGroups } from './src/content.js';

const API = 'https://vapepl.com/wp-json';
const VAPEPL = 'https://vapepl.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VapePL-catalog-sync/1.0';
const ROOT = dirname(fileURLToPath(import.meta.url));
const BRAND_SLUGS = ['airmez', 'fumot', 'hifancy', 'maskking', 'merrymi', 'stagbar', 'xcor'];

const only = process.argv.find((a) => a.startsWith('--only'))?.split('=')[1]
  ?? process.argv[process.argv.indexOf('--only') + 1];
const mode = only === 'products' || only === 'guides' ? only : 'all';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}`);
  return res.json();
}

async function fetchPaged(path, maxPages = 20) {
  const items = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const sep = path.includes('?') ? '&' : '?';
    const batch = await getJson(`${API}${path}${sep}per_page=100&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    items.push(...batch);
    if (batch.length < 100) break;
    await sleep(300);
  }
  return items;
}

// ---------- 商品目录 ----------
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

async function fetchProducts() {
  const [rawProducts, rawCategories, popularity] = await Promise.all([
    fetchPaged('/wc/store/v1/products'),
    fetchPaged('/wc/store/v1/products/categories'),
    getJson(`${API}/wc/store/v1/products?orderby=popularity&per_page=8`),
  ]);

  // 畅销榜：以 WooCommerce 当前累计销量（popularity）实时排序，取前 8
  const topSellers = popularity.map((p) => p.slug);

  // 分类成员映射：以「分类接口按 id 拉成员」为准（产品侧分类标签与分类 count 可能
  // 不一致，如 tobacco 分类含 2 款但其产品标签未挂 tobacco）。键 = 分类 slug
  const categoryMembers = {};
  for (const c of rawCategories) {
    try {
      const members = await getJson(`${API}/wc/store/v1/products?category=${c.id}&per_page=100`);
      categoryMembers[c.slug] = (Array.isArray(members) ? members : []).map((p) => p.slug);
    } catch {
      categoryMembers[c.slug] = [];
    }
    await sleep(300);
  }

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
    categoryMembers,
    categories,
    products,
  };
  mkdirSync(dirname(join(ROOT, 'data')), { recursive: true });
  writeFileSync(join(ROOT, 'data', 'products.json'), JSON.stringify(data, null, 2));
  console.log(`✔ products: ${products.length}, flavors: ${flavorsTotal}, verified buy links: ${verified}`);
}

// ---------- 文章库（全量抓取 + 相关性打分） ----------
// 词边界匹配：关键词前后不得是字母/数字（防 MAX 误中 MAXI）
function hasWord(text, word) {
  const re = new RegExp(`(^|[^a-z0-9])${word.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}($|[^a-z0-9])`, 'i');
  return re.test(text);
}
// 文本归一化：小写 + &amp;/& → 空格 + 压空白（与 flavorKey 同规则，口味词可对齐）
function normText(s) {
  return String(s)
    .replace(/&amp;/gi, '&')
    .replace(/&/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// 站内模型关键词（18 款的产品名 token，各 +2 分）
const MODEL_KEYWORDS = [
  'LUX', 'STAG', 'TYRANT', 'TORNADO', 'DREAM', 'LEOPARD', 'FOX', 'MAX',
  'CLEAR', 'SUPER', 'SPACE', 'ICEX', 'BLADE', 'HAWAII', 'MATRIX', 'ECO',
];

async function fetchGuides() {
  // 站内口味组（归一化组，每个 +1 分；标题命中额外 +5 用于选 flavor 推荐位）
  const productsFile = join(ROOT, 'data', 'products.json');
  const products = JSON.parse(readFileSync(productsFile, 'utf8'));
  const flavorNames = flavorGroups(products, 1).map((g) => g.name.toLowerCase());

  // 全量分页抓取：翻到空页/不足一页为止（当前 4000+ 篇）
  const posts = [];
  for (let page = 1; ; page += 1) {
    const batch = await getJson(`${API}/wp/v2/posts?per_page=100&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    posts.push(...batch);
    if (batch.length < 100) break;
    await sleep(300);
  }

  const scored = posts.map((post) => {
    const title = (post.title?.rendered ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const excerpt = (post.excerpt?.rendered ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const text = normText(title + ' ' + excerpt);

    let score = 0;
    for (const kw of MODEL_KEYWORDS) if (hasWord(text, normText(kw))) score += 2;
    for (const f of flavorNames) if (f.length > 3 && hasWord(text, f)) score += 1;

    // 推荐位口味：标题里命中的口味加权（+5）优先于 excerpt，取最高分者
    let flavor = null;
    let flavorBest = 0;
    for (const f of flavorNames) {
      if (f.length <= 3) continue;
      let s = 0;
      if (hasWord(title, f)) s += 5;
      if (hasWord(excerpt, f)) s += 1;
      if (s > flavorBest) {
        flavorBest = s;
        flavor = f;
      }
    }

    // 摘要截断 ~160 字（词边界）
    const summary =
      excerpt.length > 170
        ? excerpt.slice(0, 168).replace(/\s+\S*$/, '') + '…'
        : excerpt;

    return {
      id: post.slug,
      title,
      url: `${VAPEPL}/${post.slug}/`,
      summary,
      flavor: flavor ? flavorKey(flavor) : null,
      datePublished: post.date?.slice(0, 10) ?? null,
      _score: score,
    };
  });

  // 全量命中（score > 0）都进库，按相关性分降序 + 标题 localeCompare 确定性排序
  const guides = scored
    .filter((p) => p._score > 0)
    .sort((a, b) => b._score - a._score || a.title.localeCompare(b.title, 'pl'))
    .map(({ _score, ...g }) => g);

  writeFileSync(join(ROOT, 'data', 'guides.json'), JSON.stringify(guides, null, 2) + '\n');
  console.log(`✔ guides: 抓取 ${posts.length} 篇，命中 ${guides.length} 篇 → guides.json`);
}

async function main() {
  if (mode === 'products') await fetchProducts();
  else if (mode === 'guides') {
    if (!existsSync(join(ROOT, 'data', 'products.json'))) {
      throw new Error('缺 data/products.json（口味打分依赖它），先跑: node site/fetch.mjs --only products');
    }
    await fetchGuides();
  } else {
    await fetchProducts();
    await fetchGuides();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
