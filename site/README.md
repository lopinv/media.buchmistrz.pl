# 静态营销站（gh-pages）

为 [vapepl.com](https://vapepl.com) 导流的波兰语营销站。站点本身不结算，所有「购买」链接指向 vapepl.com 对应商品（口味变体附预选参数），交易闭环留在线上商店。

## 结构

```
site/
├── fetch.mjs           # 抓取 vapepl.com 商品目录 → data/products.json
├── build.js            # 构建：data + 模板 → dist/
├── preview.mjs         # 本地预览 dist
├── data/products.json  # 商品数据（18 模型 / 220 口味变体，全量购买链接已实测）
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
node site/fetch.mjs   # 重新抓取商品数据（可选，products.json 已提交）
node site/build.js    # 构建到 site/dist 并自检（JSON-LD 合法性 + 站内链接可达）
node site/preview.mjs # 本地预览 http://127.0.0.1:8080
```

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
