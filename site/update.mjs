// site/update.mjs — 一键更新流水线：刷数据 → 双构建验证 → 提交 main → 同步 gh-pages → （可选）推送
// 零依赖，需 Node >= 18。git 写操作默认只做本地提交，--push 才实际推送。
//
// 用法：
//   node site/update.mjs                 # 刷商品+文章数据，构建+验证+本地提交 main/gh-pages（不推送）
//   node site/update.mjs --no-data       # 改完文案/模板后只重走构建+验证+提交（不刷数据）
//   node site/update.mjs --only products # 只刷商品数据；--only guides 只刷文章
//   node site/update.mjs --push          # 推送前额外 dry-run，最后实际推送
//   node site/update.mjs --dry-run       # 只到构建验证为止，不提交
//   node site/update.mjs --message "msg" # 自定义 main 提交信息
//   node site/update.mjs --allow-dirty   # 工作区有改动时放行（提交范围扩大为 site/ 全部改动）
//
// 安全行为：
// - 工作区有未提交改动时默认拒绝（--allow-dirty 放行，且提交范围随之扩大），防把无关改动卷进自动提交
// - 两遍构建逐字节比对（Node 内哈希，跨平台），不一致即中断（模板引入非确定性输入会在此暴露）
// - 数据与清单均未变化 → 跳过 main 提交，无空提交
// - gh-pages 同步后强制校验 .gitignore 仍在树中（历史两次部署事故的防线）
import { spawnSync } from 'node:child_process';
import { cpSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

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

function changedFiles() {
  const { out } = sh('git', ['status', '--porcelain', 'site']);
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
  const scripts = flags.noData
    ? []
    : flags.only === 'products'
      ? ['fetch.mjs']
      : flags.only === 'guides'
        ? ['generate-guides.mjs']
        : ['fetch.mjs', 'generate-guides.mjs'];
  for (const s of scripts) {
    const dataFile = s === 'fetch.mjs' ? 'site/data/products.json' : 'site/data/guides.json';
    const before = sh('git', ['status', '--porcelain', dataFile]).out;
    sh('node', [join('site', s)]);
    const after = sh('git', ['status', '--porcelain', dataFile]).out;
    console.log(`  ${dataFile}: ${before === after ? '未变化' : '已更新'}`);
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
  // 放行脏工作区时，提交范围扩大为 site/ 全部改动（源码/数据/清单一起进）
  const files = flags.allowDirty
    ? changedFiles()
    : ['site/data/products.json', 'site/data/guides.json', 'site/data/page-manifest.json'].filter(fileChanged);
  if (!files.length) {
    console.log('— 数据与清单均未变化，跳过 main 提交');
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
