// site/generate-readme.mjs — 从 data/ 重新生成根 README.md 的数据块（标记区机制）
// 根 README 是营销型文档：静态段落（FAQ/评价/订单/关于）手工维护，数据驱动的块用
// <!-- @gen:<name> --> ... <!-- @/gen:<name> --> 标记围住，本脚本只替换标记区内容。
// 确定性生成：同数据两次运行字节一致；数据不变则不写盘（manifest/构建零扰动）。
// 零依赖，需 Node >= 18。用法: node site/generate-readme.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flavorGroups } from './src/content.js';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const README = join(ROOT, 'README.md');

const data = JSON.parse(readFileSync(join(here, 'data', 'products.json'), 'utf8'));
const guides = JSON.parse(readFileSync(join(here, 'data', 'guides.json'), 'utf8'));

// ---------- 格式化助手（与站点同规则） ----------
const zl = (n) => new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2 }).format(n) + ' zł';
const puffs = (n) => new Intl.NumberFormat('pl-PL').format(n);
const esc = (s) => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

// 品牌 key（products.json 的 brand 字段全小写后前 3 字母即可归一，已对 7 品牌核实）
const BRAND_ORDER = ['airmez', 'fumot', 'hifancy', 'maskking', 'merrymi', 'stagbar', 'xcor'];
const BRAND_EMOJI = {
  airmez: ['🦊', 'AiRMEZ'],
  fumot: ['🐆', 'Fumot'],
  hifancy: ['✨', 'HIFANCY'],
  maskking: ['🎭', 'Maskking'],
  merrymi: ['🍬', 'MerryMi'],
  stagbar: ['🦌', 'Stagbar'],
  xcor: ['⚡', 'XCOR'],
};
const productsOf = (b) =>
  data.products
    .filter((p) => p.brand?.toLowerCase().startsWith(b.slice(0, 3)))
    .sort((a, c) => (c.puffs ?? 0) - (a.puffs ?? 0));

const blocks = {};

// 1) 顶部徽章（品牌数/产品数/文章数随数据同步）
blocks.badges = `
<img src="https://img.shields.io/badge/🇵🇱-Polska-1c61e7?style=for-the-badge" alt="Polska">
<img src="https://img.shields.io/badge/📅-Od%202014-007ec6?style=for-the-badge" alt="Od 2014">
<img src="https://img.shields.io/badge/🏭-${BRAND_ORDER.length}%20marek-1e88e5?style=for-the-badge" alt="${BRAND_ORDER.length} marek">
<img src="https://img.shields.io/badge/📦-${data.products.length}%20produktów-0ea5e9?style=for-the-badge" alt="${data.products.length} produktów">
<img src="https://img.shields.io/badge/📖-${guides.length}%20poradników-e05a4b?style=for-the-badge" alt="${guides.length} poradników">`;

// 2) 统计条（产品/品牌/文章/最低价；评价 4.4/5 为静态营销文案，不随数据变）
const minPrice = Math.min(...data.products.map((p) => p.price));
blocks.stats = `
<table>
<tr>
<td align="center" width="20%"><div style="font-size:28px">📦</div><b>${data.products.length}</b><br>Produktów</td>
<td align="center" width="20%"><div style="font-size:28px">🏭</div><b>${BRAND_ORDER.length}</b><br>Marek</td>
<td align="center" width="20%"><div style="font-size:28px">📖</div><b>${guides.length}</b><br>Artykułów</td>
<td align="center" width="20%"><div style="font-size:28px">💰</div><b>od ${zl(minPrice)}</b><br>Cena od</td>
<td align="center" width="20%"><div style="font-size:28px">⭐</div><b>4,4 / 5</b><br>Opinie</td>
</tr>
</table>`;

// 3) 品牌卡（每个品牌的产品数；波兰语复数：1 produkt / 2-4 produkty / 5+ produktów）
const brandNoun = (n) => (n === 1 ? 'produkt' : n >= 5 ? 'produktów' : 'produkty');
const CAT_EMOJI = { fruity: '🍓', 'menthol-ice': '🧊', 'sweet-candy': '🍬', tobacco: '🍂' };
const CAT_NAMES = { fruity: 'Fruity', 'menthol-ice': 'Menthol &amp; Ice', 'sweet-candy': 'Sweet &amp; Candy', tobacco: 'Tobacco' };

blocks.brands = `
<table width="100%">
<tr>
${BRAND_ORDER.map((b) => `<th width="14%" align="center">${BRAND_EMOJI[b][0]} ${BRAND_EMOJI[b][1]}</th>`).join('\n')}
</tr>
<tr>
${BRAND_ORDER.map((b) => `<td align="center">${productsOf(b).length} ${brandNoun(productsOf(b).length)}</td>`).join('\n')}
</tr>
</table>`;

// 4) 产品表（按品牌分组；价格/puffs/图片/购买链接全部来自 products.json）
const imgCell = (p) =>
  p.image
    ? `<img src="${esc(p.image)}" width="90" height="90" style="object-fit:cover;border-radius:8px" alt="${esc(p.name)}">`
    : '—';
const priceCell = (p) => `${p.onSale ? `<s>${zl(p.regularPrice)}</s><br>` : ''}<b>${zl(p.price)}</b>`;

blocks.products = BRAND_ORDER.map((b) => {
  const list = productsOf(b);
  if (!list.length) return '';
  return `### ${BRAND_EMOJI[b][0]} ${BRAND_EMOJI[b][1]}\n
<table width="100%">
<tr><th width="38%" align="left">Produkt</th><th width="14%" align="center">Puffs</th><th width="26%" align="center">Cena</th><th width="22%" align="center">Widok</th></tr>
${list
  .map(
    (p) =>
      `<tr><td align="left"><a href="${esc(p.permalink)}">${esc(p.name)}</a></td><td align="center">${puffs(p.puffs ?? 0)}</td><td align="center">${priceCell(p)}</td><td align="center">${imgCell(p)}</td></tr>`,
  )
  .join('\n')}
</table>`;
})
  .filter(Boolean)
  .join('\n\n---\n\n');

// 5) 畅销榜（topSellers 实时排序；Store API 不暴露销量数字，末列 = 名次而非"已卖出"）
const top = (data.topSellers ?? [])
  .map((slug) => data.products.find((p) => p.slug === slug))
  .filter(Boolean)
  .slice(0, 8);
blocks.trends = `
> ${top.length} najczęściej kupowanych produktów — ranking wg bieżącej popularności na WooCommerce.

<table width="100%">
<tr><th width="6%" align="center">#</th><th width="38%" align="left">Produkt</th><th width="28%" align="center">Cena</th><th width="18%" align="center">Puffs</th><th width="10%" align="center">Miejsce</th></tr>
${top
  .map(
    (p, i) =>
      `<tr><td align="center"><b>${i + 1}</b></td><td align="left"><a href="${esc(p.permalink)}">${esc(p.name)}</a></td><td align="center"><s>${zl(p.regularPrice)}</s> <b>${zl(p.price)}</b></td><td align="center">${puffs(p.puffs ?? 0)}</td><td align="center">${i === 0 ? '🏆 #1' : `#${i + 1}`}</td></tr>`,
  )
  .join('\n')}
</table>`;

// 6) 口味分类卡（4 个口味类的产品数随 category API 同步）
const flavorCats = (data.categories ?? []).filter((c) => c.kind === 'flavor');
blocks.flavorCats = `
<table width="100%">
<tr>
${flavorCats
  .map((c) => {
    const imgCell = c.image
      ? `<img src="${esc(c.image)}" width="140" height="140" style="object-fit:cover;border-radius:10px" alt="${esc(c.name)}"><br>`
      : '';
    return `<th width="25%" align="center">${imgCell}<b>${CAT_EMOJI[c.slug] ?? '🍃'} ${esc(CAT_NAMES[c.slug] ?? c.name)}</b><br>${c.count} produktów</th>`;
  })
  .join('\n')}
</tr>
</table>`;

// 7) 口味 TOP12（站内口味频次实时排序，与首页口味榜同数据源：左列 1-6 奖牌，右列 7-12）
const topFlavors = flavorGroups(data, 1).slice(0, 12);
const medals = ['🥇', '🥈', '🥉'];
const flavorRows = [];
for (let i = 0; i < 6; i += 1) {
  const a = topFlavors[i];
  const b = topFlavors[i + 6];
  flavorRows.push(
    b
      ? `<tr><td align="center">${medals[i] ?? i + 1}</td><td align="left">${esc(a.name)}</td><td align="center">🏅 ${i + 7}</td><td align="left">${esc(b.name)}</td></tr>`
      : `<tr><td align="center">${medals[i] ?? i + 1}</td><td align="left">${esc(a.name)}</td><td></td><td></td></tr>`,
  );
}
blocks.topFlavors = `
> Ranking ${topFlavors.length} najlepiej sprawdzających się smaków (wg częstotliwości w ofercie).

<table width="100%">
<tr><th width="6%" align="center">#</th><th width="44%" align="left">Smak</th><th width="6%" align="center">#</th><th width="44%" align="left">Smak</th></tr>
${flavorRows.join('\n')}
</table>`;

// 8) 文章列表（guides.json 全量；标题/URL 含 & 需转义）
blocks.guides = `
<details>
<summary><b>Rozwiń listę ${guides.length} poradników</b></summary>

<table width="100%">
<tr><th width="6%" align="center">#</th><th width="82%" align="left">Artykuł</th><th width="12%" align="center">Link</th></tr>
${guides
  .map(
    (g, i) =>
      `<tr><td align="center">${i + 1}</td><td align="left"><a href="${esc(g.url)}">${esc(g.title)}</a></td><td align="center"><a href="${esc(g.url)}">📖</a></td></tr>`,
  )
  .join('\n')}
</table>

</details>`;

// 9) 数据日期（fetchedAt → 波兰语长日期；fetchedAt 缺失则保留现状不替换）
let blocksDate = null;
if (data.fetchedAt) {
  const d = new Date(data.fetchedAt);
  const MONTHS = [
    'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
  ];
  blocksDate = `<sub>• Dane zebrane: ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} • <a href="https://vapepl.com">vapepl.com</a> · Zwroty i reklamacje: <a href="https://vapepl.com/refund_returns/">Polityka Zwrotów</a></sub>`;
}
// dateline 必须并入 blocks 才会进入替换循环；fetchedAt 缺失时保持 null，循环按内容跳过（保留现有人工行）
blocks.dateline = blocksDate;

// ---------- 替换标记区（dateline 内容为 null 时跳过，避免把现有行覆盖成空） ----------
let readme = readFileSync(README, 'utf8');
const missing = [];
for (const [name, content] of Object.entries(blocks)) {
  if (name === 'dateline' && content === null) continue;
  const re = new RegExp(`<!-- @gen:${name} -->[\\s\\S]*?<!-- @/gen:${name} -->`);
  if (!re.test(readme)) {
    missing.push(name);
    continue;
  }
  readme = readme.replace(re, `<!-- @gen:${name} -->\n${String(content).trim()}\n<!-- @/gen:${name} -->`);
}
if (missing.length) {
  console.error(
    `✘ README.md 缺少标记区: ${missing.join(', ')} — 先手工插入 <!-- @gen:<name> --> … <!-- @/gen:<name> --> 再跑本脚本`,
  );
  process.exit(1);
}
if (readme !== readFileSync(README, 'utf8')) {
  writeFileSync(README, readme);
  console.log(`✔ README.md 数据块已更新（${Object.keys(blocks).length} 区，guides=${guides.length}，products=${data.products.length}）`);
} else {
  console.log('✔ README.md 无变化，未写盘');
}
