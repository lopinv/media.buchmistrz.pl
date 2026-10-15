// site/preview.mjs — 本地预览 dist 构建产物：node site/preview.mjs [port]
// 目录型 URL（/sklep/）回退到 index.html；未命中且不是已知文件时返回 404.html。
import { createServer } from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = Number(process.argv[2]) || 8080;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
};

// 启动自检：dist 缺失（如 git 切换分支后 gitignored 产物被清除）时明确提示，避免请求时崩溃
if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`✘ 未找到构建产物 ${DIST}（可能被 git 分支切换清除）。\n  请先运行: node site/build.js`);
  process.exit(1);
}

createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') p = '/index.html';
  let file = join(DIST, p);
  let target;
  try {
    const st = statSync(file);
    target = st.isDirectory() ? join(file, 'index.html') : file;
  } catch {
    target = null; // 未命中：目录型请求试 index.html，否则 404 页
    if (p.endsWith('/')) target = join(DIST, p, 'index.html');
  }
  if (!target || !existsSync(target)) {
    res.writeHead(404, { 'Content-Type': MIME['.html'] });
    res.end(existsSync(join(DIST, '404.html')) ? readFileSync(join(DIST, '404.html')) : 'Not Found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(target)] || 'application/octet-stream' });
  res.end(readFileSync(target));
}).listen(PORT, () => console.log(`预览: http://127.0.0.1:${PORT}/`));
