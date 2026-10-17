# 静态营销站（gh-pages）

为 [vapepl.com](https://vapepl.com) 导流的波兰语营销站。站点本身不结算，所有「购买」链接指向 vapepl.com 对应商品（口味变体附预选参数），交易闭环留在线上商店。

## 结构

```
site/
├── fetch.mjs           # 抓取 vapepl.com 全量商品目录 + 全量文章（相关性打分）→ data/
├── update.mjs          # 一键更新流水线（刷数据→再生成根 README→双构建验证→提交 main→同步 gh-pages）
├── build.js            # 构建：data + 模板 → dist/（含 manifest 内容哈希 + sitemap lastmod）
├── preview.mjs         # 本地预览 dist
├── data/products.json  # 商品数据（18 模型 / 220 口味变体，全量购买链接已实测）
├── data/guides.json    # 文章库（全量命中：4000+ 篇中挑出与站内模型/口味相关的全部文章）
├── data/page-manifest.json # 每页 SHA-1 + 最后内容变更日期（构建自动回写，驱动 sitemap lastmod）
└── src/
    ├── content.js      # 静态文案与站点常量（品牌/评价/FAQ/折扣/联系）
    ├── templates.js    # HTML 模板 + SEO/OGP/JSON-LD 生成
    ├── style.css       # 响应式样式（mobile-first）
    └── script.js       # 移动端汉堡菜单（站点唯一 JS）
```

构建产物 `dist/` 不入版本库，部署时整体推到 `gh-pages` 分支。

## 用法

需 Node ≥ 18（本机 mise 已装 22），零第三方依赖。

```bash
node site/update.mjs             # 一键：刷商品+文章数据 → 再生成根 README 数据块 → 双构建验证 → 提交 main → 同步 gh-pages（本地）
node site/update.mjs --no-data   # 改完文案/模板后，只重走构建+验证+提交（不刷数据；根 README 数据块仍会再生成）
node site/update.mjs --push      # 在上面基础上，推送前 dry-run 后实际推送 main+gh-pages

# 底层命令（update.mjs 组合的就是它们）：
node site/fetch.mjs              # 重新抓取商品 + 文章数据 → data/（--only products 只刷商品；--only guides 只刷文章）
node site/build.js               # 构建到 site/dist 并自检（JSON-LD + 内链 + manifest + sitemap lastmod）
node site/preview.mjs            # 本地预览 http://127.0.0.1:8080
```

**根 README.md 的 9 个数据块**（徽章/统计条/品牌卡/产品表/畅销榜/口味卡/口味榜/文章列表/数据日期）由 `update.mjs` 内置的再生成步骤（`regenerateDocs`）从 `data/` 生成，块用 `<!-- @gen:<name> -->` … `<!-- @/gen:<name> -->` 标记围住；标记外的段落（FAQ、评价、订单、关于、联系）手工维护，生成器不碰。改 `data/products.json` 或 `data/guides.json` 后跑 `node site/update.mjs`（数据不变则不写盘）。

`update.mjs` 的安全红线：工作区有未提交改动（`site/` 与根 `README.md` 范围）默认拒绝（`--allow-dirty` 放行且提交范围随之扩大）；两遍构建逐字节比对，模板引入非确定性输入会在此中断；数据、清单与文档均未变则跳过提交；gh-pages 同步后强制校验 `.gitignore` 仍在树中。

`build.js` 会自动做内链相对化（自定义域名 `github.vapepl.com` 与本地根目录预览都可用），并生成 `sitemap.xml`、`robots.txt`、`.nojekyll`、`404.html`、`CNAME`。

## 页面

- `/` 首页 — Hero、信任条、畅销榜、品牌/口味分类、折扣、评价、FAQ
- `/sklep/` 商店 — 18 个基础商品卡片
- `/kategoria/<slug>/` 分类 — 7 品牌 + 4 口味分类
- `/produkt/<slug>/` 商品聚合页 — 规格 + 口味切换器 + AggregateOffer
- `/produkt/<slug>/<flavor>/` 口味简单商品页（共 220）— 独立 URL + Product/Offer JSON-LD
- `/kontakt/`、`/zwroty/` — 联系与退货政策

每页注入 Open Graph、canonical、按页类型的 JSON-LD（Product/Offer/AggregateOffer、ItemList、BreadcrumbList、Organization、FAQPage），并带 AEO 问答式小标题与规格表。

## 域名

绑定自定义域名 `https://github.vapepl.com`（`SITE` 常量驱动 canonical/sitemap/OGP/JSON-LD，全部基于此前缀）。`build.js` 生成 `CNAME` 文件，随构建产物同步到 `gh-pages` 根即生效。DNS 侧需在 `vapepl.com` 的解析后台添加 CNAME 记录：`github` → `lopinv.github.io`（GitHub Pages 仓库名），生效前该域名无法解析。GitHub 侧无需额外开关，`CNAME` 文件即声明自定义域名。
