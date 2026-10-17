// site/update.mjs — 一键更新流水线：刷数据 → 再生成派生文档 → 双构建验证 → 提交 main → 同步 gh-pages → （可选）推送
// 零依赖，需 Node >= 18。git 写操作默认只做本地提交，--push 才实际推送。
//
// 用法：
//   node site/update.mjs                 # 刷商品+文章数据，再生成根 README 数据块，构建+验证+本地提交（不推送）
//   node site/update.mjs --no-data       # 改完文案/模板后只重走构建+验证+提交（不刷数据，派生文档仍会再生成）
//   node site/update.mjs --only products # 只刷商品数据；--only guides 只刷文章
//   node site/update.mjs --push          # 推送前额外 dry-run，最后实际推送
//   node site/update.mjs --dry-run       # 只到构建验证为止，不提交
//   node site/update.mjs --message "msg" # 自定义 main 提交信息
//   node site/update.mjs --allow-dirty   # 工作区有改动时放行（提交范围扩大为 site/ + README.md 全部改动）
//
// 安全行为：
// - 工作区有未提交改动（site/ 与根 README.md 范围内）默认拒绝（--allow-dirty 放行，且提交范围随之扩大）
// - 两遍构建逐字节比对（Node 内哈希，跨平台），不一致即中断（模板引入非确定性输入会在此暴露）
// - 派生文档（site/data/page-manifest.json、根 README.md 数据块）由脚本再生成，内容未变则不写盘 → 无空提交
// - 数据与清单与文档均未变化 → 跳过 main 提交
// - gh-pages 同步后强制校验 .gitignore 仍在树中（历史两次部署事故的防线）
import { spawnSync } from 'node:child_process';
import { cpSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flavorGroups } from './src/content.js';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const WORKTREE = join(ROOT, '.gh-pages-sync');

// ---------- 参数 ----------
const argv = process.argv.slice(2);
const flags = {
  push: argv.includes('--push'),
  dryRun: argv.includes('--dry-run'),
  allowDirty: argv.includes('--allow-dirty'),
  noData: argv.includes('--no-data'),
};
const onlyIdx = argv.indexOf('--only');
flags.only = onlyIdx > -1 ? argv[onlyIdx + 1] : null;
const msgIdx = argv.indexOf('--message');
flags.message = msgIdx > -1 ? argv[msgIdx + 1] : null;

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: opts.cwd ?? ROOT, encoding: 'utf8', timeout: 600_000 });
  if (r.status !== 0 && !opts.tolerate) {
    console.error(`✘ 命令失败: ${cmd} ${args.join(' ')}`);
    console.error(r.stdout || '');
    console.error(r.stderr || '');
    process.exit(1);
  }
  return { out: (r.stdout || '').trim(), err: r.stderr || '', ok: r.status === 0 };
}

// 脏检查与提交范围：site/（源码+数据+清单）与根 README.md（派生文档）
const TRACKED = ['site', 'README.md'];

function changedFiles() {
  const { out } = sh('git', ['status', '--porcelain', ...TRACKED]);
  // porcelain 行格式：XY<space><path>；取 2 字符状态后的路径（rename 时取新名）
  return out
    .split('\n')
    .filter(Boolean)
    .map((l) => l.slice(2).replace(/^ /, ''));
}
const fileChanged = (f) => changedFiles().includes(f);

// ---------- 步骤 ----------
function checkClean() {
  const dirty = changedFiles();
  if (dirty.length && !flags.allowDirty) {
    console.error(`✘ 工作区有未提交改动，拒绝运行（--allow-dirty 可放行）:\n  ${dirty.join('\n  ')}`);
    process.exit(1);
  }
}

function refreshData() {
  if (flags.noData) return;
  const only = flags.only; // undefined | 'products' | 'guides'（fetch.mjs 统一负责两类数据）
  const files =
    only === 'products' ? ['site/data/products.json']
    : only === 'guides' ? ['site/data/guides.json']
    : ['site/data/products.json', 'site/data/guides.json'];
  for (const f of files) {
    const before = sh('git', ['status', '--porcelain', f]).out;
    sh('node', [join('site', 'fetch.mjs')].concat(only ? ['--only', only] : []));
    const after = sh('git', ['status', '--porcelain', f]).out;
    console.log(`  ${f}: ${before === after ? '未变化' : '已更新'}`);
  }
}

// ---------- 根 README 数据块再生成（标记区机制，原 generate-readme.mjs） ----------
// 根 README 是营销型文档：静态段落（FAQ/评价/订单/关于）手工维护，数据驱动的块用
// <!-- @gen:<name> --> ... <!-- @/gen:<name> --> 标记围住；数据不变则不写盘。
function regenerateDocs() {
  const products = JSON.parse(readFileSync(join(here, 'data', 'products.json'), 'utf8'));
  const guides = JSON.parse(readFileSync(join(here, 'data', 'guides.json'), 'utf8'));
  const README = join(ROOT, 'README.md');

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
    products.products
      .filter((p) => p.brand?.toLowerCase().startsWith(b.slice(0, 3)))
      .sort((a, c) => (c.puffs ?? 0) - (a.puffs ?? 0));

  const blocks = {};

  // 1) 顶部徽章（品牌数/产品数/文章数随数据同步）
  blocks.badges = `
<img src="https://img.shields.io/badge/🇵🇱-Polska-1c61e7?style=for-the-badge" alt="Polska">
<img src="https://img.shields.io/badge/📅-Od%202014-007ec6?style=for-the-badge" alt="Od 2014">
<img src="https://img.shields.io/badge/🏭-${BRAND_ORDER.length}%20marek-1e88e5?style=for-the-badge" alt="${BRAND_ORDER.length} marek">
<img src="https://img.shields.io/badge/📦-${products.products.length}%20produktów-0ea5e9?style=for-the-badge" alt="${products.products.length} produktów">
<img src="https://img.shields.io/badge/📖-${guides.length}%20poradników-e05a4b?style=for-the-badge" alt="${guides.length} poradników">`;

  // 2) 统计条（产品/品牌/文章/最低价；评价 4.4/5 为静态营销文案，不随数据变）
  const minPrice = Math.min(...products.products.map((p) => p.price));
  blocks.stats = `
<table>
<tr>
<td align="center" width="20%"><div style="font-size:28px">📦</div><b>${products.products.length}</b><br>Produktów</td>
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
  const top = (products.topSellers ?? [])
    .map((slug) => products.products.find((p) => p.slug === slug))
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
  const flavorCats = (products.categories ?? []).filter((c) => c.kind === 'flavor');
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
  const topFlavors = flavorGroups(products, 1).slice(0, 12);
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
  if (products.fetchedAt) {
    const d = new Date(products.fetchedAt);
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
    console.log(`  README.md 数据块已更新（guides=${guides.length}，products=${products.products.length}）`);
  } else {
    console.log('  README.md 无变化，未写盘');
  }
}

function buildOnce() {
  const { out } = sh('node', ['site/build.js']);
  const pages = out.match(/HTML 页面: (\d+)/)?.[1] ?? '?';
  const changed = out.match(/内容变更: (\d+)\/\d+/)?.[1] ?? '?';
  console.log(`  构建: ${pages} 页，内容变更 ${changed} 页`);
  return { pages, changed: Number(changed) };
}

// 整树哈希（文件相对路径 → SHA-1），用于 Node 内逐字节对比（不用 diff 命令，跨平台）
function hashTree(root) {
  const files = new Map();
  (function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else files.set(relative(root, p), createHash('sha1').update(readFileSync(p)).digest('hex'));
    }
  })(root);
  return files;
}

// 双构建确定性验证：拷走第一遍 dist，跑第二遍，产物必须逐字节一致
function verifyDeterministic() {
  const CHECK = join(here, 'dist-check');
  cpSync(join(here, 'dist'), CHECK, { recursive: true });
  try {
    buildOnce();
    const a = hashTree(join(here, 'dist'));
    const b = hashTree(CHECK);
    const diff = [...a.keys()].filter((k) => a.get(k) !== b.get(k));
    if (diff.length) {
      console.error(`✘ 两遍构建产物不一致（模板可能引入了非确定性输入）:\n  ${diff.slice(0, 10).join('\n  ')}`);
      process.exit(1);
    }
    console.log('✔ 两遍构建字节一致，产物确定性通过');
  } finally {
    rmSync(CHECK, { recursive: true, force: true });
  }
}

function commitMain(changedPages) {
  // 提交范围：数据 + 清单 + 根 README 派生块；放行脏工作区时扩大为 TRACKED 内全部改动
  const files = flags.allowDirty
    ? changedFiles()
    : [
        'site/data/products.json',
        'site/data/guides.json',
        'site/data/page-manifest.json',
        'README.md',
      ].filter(fileChanged);
  if (!files.length) {
    console.log('— 数据、清单与文档均未变化，跳过 main 提交');
    return false;
  }
  const subject = flags.message ?? `chore(site): refresh data + rebuild, ${changedPages} pages re-stamped`;
  sh('git', ['add', ...files]);
  sh('git', ['commit', '-m', subject]);
  console.log(`✔ main 本地提交: ${files.length} 个文件`);
  return true;
}

function deployGhPages() {
  rmSync(WORKTREE, { recursive: true, force: true });
  sh('git', ['worktree', 'add', WORKTREE, 'gh-pages']);
  // 整树替换：git rm 会连 .gitignore 一起删，故先从 HEAD 恢复；再拷入新 dist
  sh('git', ['rm', '-r', '-q', '.'], { cwd: WORKTREE });
  sh('git', ['restore', '--source=HEAD', '--staged', '--worktree', '--', '.gitignore'], { cwd: WORKTREE });
  cpSync(join(here, 'dist'), WORKTREE, { recursive: true });
  sh('git', ['add', '-A'], { cwd: WORKTREE });
  const c = sh('git', ['commit', '-q', '-m', 'chore(deploy): ship rebuilt site (update pipeline)'], {
    cwd: WORKTREE,
    tolerate: true,
  });
  if (c.ok) console.log('✔ gh-pages 本地部署提交完成');
  else console.log('— gh-pages 无变化，跳过部署提交');
  // .gitignore 必须在 HEAD 树中（历史两次部署事故的防线）
  if (!sh('git', ['cat-file', '-e', 'HEAD:.gitignore'], { cwd: WORKTREE, tolerate: true }).ok) {
    console.error('✘ gh-pages HEAD 树缺少 .gitignore，请人工检查');
    process.exit(1);
  }
  sh('git', ['worktree', 'remove', WORKTREE, '--force']);
}

function pushAll() {
  sh('git', ['push', '--dry-run', 'origin', 'main', 'gh-pages']);
  sh('git', ['push', 'origin', 'main', 'gh-pages']);
  console.log('✔ 已推送 main + gh-pages');
}

// ---------- 主流程 ----------
console.log('▶ site/update.mjs 启动');
checkClean();
if (!flags.noData) {
  console.log('▶ 刷新数据源');
  refreshData();
}
console.log('▶ 再生成派生文档（根 README 数据块）');
regenerateDocs();
console.log('▶ 双构建验证');
const first = buildOnce();
verifyDeterministic();
if (flags.dryRun) {
  console.log('— --dry-run：跳过提交与部署');
  process.exit(0);
}
const mainCommitted = commitMain(first.changed);
// 部署始终尝试（幂等）：main 无新提交但 gh-pages 落后时也要同步；无变化时脚本内部跳过
deployGhPages();
if (flags.push) pushAll();
else console.log('— 未加 --push：仅本地提交，核对后自行 git push origin main gh-pages');
console.log('✔ 流水线完成');
