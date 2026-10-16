// site/generate-guides.mjs — 从 vapepl.com 抓文章（WP REST /wp/v2/posts），
// 按与站内 18 款模型 + 站内口味组的相关性打分，取 top 50 写入 site/data/guides.json。
// 零依赖，需 Node >= 18。用法: node site/generate-guides.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flavorKey, flavorGroups } from './src/content.js';
import { readFileSync } from 'node:fs';

const API = 'https://vapepl.com/wp-json';
const VAPEPL = 'https://vapepl.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VapePL-guides-sync/1.0';
const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'data', 'guides.json');
const TOP_N = 50;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}`);
  return res.json();
}

// ---------- 相关性打分 ----------
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

function main() {
  // 站内口味组（128 归一化组，每个 +1 分；标题命中额外 +5 用于选 flavor 推荐位）
  const products = JSON.parse(readFileSync(join(ROOT, 'data', 'products.json'), 'utf8'));
  const flavorNames = flavorGroups(products, 1).map((g) => g.name.toLowerCase());

  (async () => {
    // 抓 3 页（300 篇）足够选出 top 50 相关
    const posts = [];
    for (let page = 1; page <= 3; page += 1) {
      const batch = await getJson(`${API}/wp/v2/posts?per_page=100&page=${page}`);
      if (!Array.isArray(batch) || batch.length === 0) break;
      posts.push(...batch);
      await sleep(300);
    }

    const scored = posts.map((post) => {
      const titleRaw = post.title?.rendered ?? '';
      const excerptRaw = post.excerpt?.rendered ?? '';
      const title = titleRaw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const excerpt = excerptRaw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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

    const top = scored
      .filter((p) => p._score > 0)
      .sort((a, b) => b._score - a._score || a.title.localeCompare(b.title, 'pl'))
      .slice(0, TOP_N);

    const guides = top.map(({ _score, ...g }) => g);
    writeFileSync(OUT, JSON.stringify(guides, null, 2) + '\n');
    console.log(`✔ 抓取 ${posts.length} 篇，命中 ${scored.filter((p) => p._score > 0).length} 篇，写入 ${guides.length} 篇 → guides.json`);
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

main();
