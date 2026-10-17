// site/src/content.js — 静态营销文案与站点常量（波兰语面向终端用户）
// 数据来源：README.md（2026-10-15 从 vapepl.com 抓取）与 WooCommerce API 调研

export const SITE = 'https://github.vapepl.com';
// 自定义域名（GitHub Pages CNAME 文件内容，构建时写入 dist 根）
export const CNAME = 'github.vapepl.com';
export const SITE_NAME = 'VapePL.COM';
export const VAPEPL = 'https://vapepl.com';
export const VAPEPL_RETURNS = `${VAPEPL}/refund_returns/`;
// 商品/分类图统一托管域（GitHub Pages media 分支经 jsDelivr 分发），preconnect 用
export const IMG_CDN = 'https://cdn.jsdelivr.net';

// 品牌卡用字母字标瓦片（首字母），不再用动物 emoji
export const BRANDS = {
  airmez: { name: 'AiRMEZ', blurb: 'Wydajne jednorazówki 4IN1 z wymiennymi wkładami.' },
  fumot: { name: 'Fumot', blurb: 'RandM Tornado i ECO — klasyki w bestowych cenach.' },
  hifancy: { name: 'HIFANCY', blurb: 'Premium design i czysty smak do ostatniego puffs.' },
  maskking: { name: 'Maskking', blurb: 'Lekkie, przenośne urządzenia dla początkujących.' },
  merrymi: { name: 'MerryMi', blurb: 'Słodkie aromaty i stabilna jakość atomizacji.' },
  stagbar: { name: 'Stagbar', blurb: 'Rekordowa wydajność 6IN1 — do 180 000 puffs.' },
  xcor: { name: 'XCOR', blurb: 'Mocne baterie i intensywne, chłodzące smaki.' },
};
export const BRAND_ORDER = ['airmez', 'fumot', 'hifancy', 'maskking', 'merrymi', 'stagbar', 'xcor'];

// 口味分类：icon 名对应 templates.js 的 icon() SVG（droplet=果味, snowflake=冰薄荷, candy=甜, leaf=烟草）
export const FLAVOR_CATS = {
  fruity: { name: 'Fruity', icon: 'droplet', blurb: 'Owocowe aromaty — od arbuzowych po egzotyczne mieszanki.' },
  'menthol-ice': { name: 'Menthol & Ice', icon: 'snowflake', blurb: 'Chłodzące smaki z mentolem i lodową nutą.' },
  'sweet-candy': { name: 'Sweet & Candy', icon: 'candy', blurb: 'Słodkie, deserowe i bubblegumowe aromaty.' },
  tobacco: { name: 'Tobacco', icon: 'leaf', blurb: 'Klasyczne tytoniowe nuty dla tradycjonalistów.' },
};

// Topowe Trendy z README (pozycje sprzedażowe)
// 畅销榜（Topowe trendy）不再在此写死，改由 data/products.json 的 topSellers 字段
// （抓取时按 WooCommerce 当前累计销量 popularity 实时排序）驱动。

export const REVIEWS = [
  { stars: 5, text: 'Mile zaskoczony, zamówię ponownie.', author: 'Ondřej S.' },
  { stars: 5, text: 'Łagodne dla gardła, przyjemny posmak.', author: 'Martin T.' },
  { stars: 5, text: 'Bez wycieków, bez spalenizny, czyste urządzenie.', author: 'Lucie H.' },
  { stars: 4, text: 'Czysty smak do końca, bez obcych nut.', author: 'Nagy B.' },
  { stars: 4, text: 'Cała nasza ekipa już to używa.', author: 'Magda L.' },
  { stars: 4, text: 'Przyjemne doznanie, bez gryzącego posmaku.', author: 'Jan P.' },
  { stars: 4, text: 'Stabilna jakość, zamawiam regularnie.', author: 'Kovács A.' },
  { stars: 5, text: 'Szybka wysyłka, solidne opakowanie bez zarysowań.', author: 'Piotr W.' },
  { stars: 4, text: 'Bateria spokojnie trzyma dwa dni.', author: 'Tomasz N.' },
];

export const DISCOUNT_TIERS = [
  { qty: '3–5 szt.', off: '−5%' },
  { qty: '6–9 szt.', off: '−10%' },
  { qty: '10–14 szt.', off: '−15%' },
  { qty: '15+ szt.', off: '−20%' },
];

// 口味榜（首页 Top 12）与口味落地页（/smak/<slug>/）都由站内口味频次实时驱动，
// 不再写死静态榜单：flavorGroups() 按归一化名分组并统计跨产品出现次数。

// 口味归一化键：先解码 HTML 实体（口味名里的 &amp; 等），统一大小写，
// 再合并 & 号变体（如 'Lemon & Lime' 与 'LEMON LIME' 并为一组）
export function flavorKey(name) {
  return String(name)
    .replace(/&amp;/gi, '&')
    .replace(/&/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// 归一化键 → 可读展示名（逐词首字母大写）
export const flavorPretty = (key) =>
  key
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// 归一化键 → URL slug
export function flavorSlug(key) {
  return key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// 口味分组：group = { key, name, slug, count（出现次数）, products（[{product, flavor}]），
// minPrice, maxPrice, maxPuffs, models }；count >= min 才返回（落地页门槛）
export function flavorGroups(data, min = 3) {
  const map = new Map();
  for (const p of data.products) {
    for (const f of p.flavors) {
      const key = flavorKey(f.name);
      const g = map.get(key) ?? {
        key,
        name: flavorPretty(key),
        slug: flavorSlug(key),
        count: 0,
        products: [],
      };
      g.count += 1;
      g.products.push({ product: p, flavor: f });
      map.set(key, g);
    }
  }
  const groups = [...map.values()]
    .filter((g) => g.count >= min)
    .map((g) => {
      const prices = g.products.map((x) => x.product.price);
      const puffs = g.products.map((x) => x.product.puffs ?? 0);
      return {
        ...g,
        models: g.products.length,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        maxPuffs: Math.max(...puffs),
      };
    });
  groups.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pl'));
  return groups;
}

// 波兰语复数：model（1）/ modele（2-4）/ modeli（5+），用于数据条与 FAQ 数值
export function pluralModels(n) {
  const d = n % 10,
    h = n % 100;
  if (d === 1 && h !== 11) return 'model';
  if (d >= 2 && d <= 4 && (h < 10 || h >= 20)) return 'modele';
  return 'modeli';
}

// 波兰语复数：produkt / produkty / produktów（同规则）
export function pluralProducts(n) {
  const d = n % 10,
    h = n % 100;
  if (d === 1 && h !== 11) return 'produkt';
  if (d >= 2 && d <= 4 && (h < 10 || h >= 20)) return 'produkty';
  return 'produktów';
}

// puffs 分段（合成"品类"，URL 挂在 /kategoria/puffs-<id>/ 下）
export const PUFF_BANDS = [
  { id: 'do-20k', label: 'do 20 000 puffs', min: 0, max: 20000 },
  { id: '20-30k', label: '20 000–30 000 puffs', min: 20000, max: 30000 },
  { id: '30-50k', label: '30 000–50 000 puffs', min: 30000, max: 50000 },
  { id: '50-100k', label: '50 000–100 000 puffs', min: 50000, max: 100000 },
  { id: '100k-plus', label: '100 000+ puffs', min: 100000, max: Infinity },
];

export function puffBandsFor(data) {
  return PUFF_BANDS.map((b) => ({
    ...b,
    products: data.products.filter(
      (p) => (p.puffs ?? 0) > b.min && (p.puffs ?? 0) <= b.max,
    ),
  }));
}

// 口味落地页 FAQ（3 题，数值逐页不同）
export function flavorLandingFaq(group) {
  const models = [...new Set(group.products.map((x) => x.product.name))];
  const biggest = group.products.reduce(
    (a, b) => ((b.product.puffs ?? 0) > (a.product.puffs ?? 0) ? b : a),
  );
  return [
    {
      q: `W ilu modelach dostępny jest smak ${group.name}?`,
      a: `Smak ${group.name} oferują ${group.models} ${pluralModels(group.models)}: ${models.join(', ')}. Każdy wariant ma wycenę ${pln(group.minPrice)}–${pln(
        group.maxPrice,
      )}.`,
    },
    {
      q: `Od jakiej ceny kupisz smak ${group.name}?`,
      a: `W promocji ceny wynoszą ${pln(group.minPrice)}${
        group.minPrice !== group.maxPrice ? `–${pln(group.maxPrice)}` : ''
      } — zależnie od modelu i jego liczby puffs.`,
    },
    {
      q: `Który model ze smaku ${group.name} ma najwięcej puffs?`,
      a: `${biggest.product.name} — ${puffsFmt(biggest.product.puffs)} puffs w smaku ${group.name}, cena ${pln(
        biggest.product.price,
      )}.`,
    },
  ];
}

// 分段页 FAQ（3 题，段/场景名与段内数值逐页不同）——puffs 段、价格段、场景页共用
export function bandFaq(name, products) {
  const eff = products
    .filter((p) => p.puffs > 0)
    .map((p) => ({ p, v: (p.price / p.puffs) * 1000 }));
  const best = eff.length ? eff.reduce((a, b) => (b.v < a.v ? b : a)) : null;
  const minP = Math.min(...products.map((p) => p.price));
  const maxP = Math.max(...products.map((p) => p.price));
  return [
    {
      q: `Ile modeli obejmuje grupa ${name}?`,
      a: `W tej grupie jest ${products.length} ${pluralModels(products.length)}: ${products
        .map((p) => p.name)
        .join(', ')}.`,
    },
    {
      q: `Od jakiej ceny zaczynają się modele w grupie ${name}?`,
      a: `Ceny w grupie: od ${pln(minP)}${minP !== maxP ? ` do ${pln(maxP)}` : ''} — wszystkie w promocji.`,
    },
    {
      q: `Który model w grupie ${name} ma najlepszy stosunek ceny do puffs?`,
      a: best
        ? `${best.p.name} — ${new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
            best.v,
          )} zł za 1 000 puffs, czyli najtańszy puffs w grupie.`
        : 'W grupie brak modeli z deklarowaną liczbą puffs.',
    },
  ];
}

// ---------- 使用场景（数据驱动 top 4，各场景命中集互异） ----------
// sort 返回得分（越大越靠前）；blurb 为该场景的 hero 文案
// 多仓机型（4w1/6w1）：型号名里的 "NIN1" 仓数
const tanksOf = (p) => Number(p.name.match(/(\d+)\s*IN\s*1/i)?.[1] ?? 0);

export const SCENARIOS = [
  {
    id: 'budzet',
    name: 'Niski budżet',
    blurb:
      'Szukasz najtańszych modeli? Te cztery urządzenia kosztują najmniej w całej ofercie — sprawdź, ile puffs dostaniesz w najniższych cenach.',
    score: (p) => -p.price * 100 + (p.puffs ?? 0) / 100,
  },
  {
    id: 'wydajnosc',
    name: 'Maksymalna wydajność',
    blurb:
      'Chcesz jak najwięcej puffs w jednym urządzeniu? To cztery modele o największej liczbie puffs w ofercie — idealne, gdy rzadko wymieniasz sprzęt.',
    score: (p) => (p.puffs ?? 0) * 1000 - p.price,
  },
  {
    id: 'cena-za-puffs',
    name: 'Najtańszy puffs',
    blurb:
      'Liczy się koszt pojedynczego puffsia? Porównujemy stosunek ceny do wydajności — te cztery modele dają najtaniejszy puffs w ofercie.',
    score: (p) => ((p.puffs ?? 0) > 0 ? 1000000 / ((p.price / (p.puffs ?? 0)) * 1000) : 0),
  },
  {
    id: 'smaki',
    name: 'Najwięcej smaków',
    blurb:
      'Lubisz próbować wielu wariantów? Te cztery modele oferują najszerszy wybór smaków — od owocowych po deserowe.',
    score: (p) => (p.flavors?.length ?? 0) * 1000 + (p.puffs ?? 0) / 1000,
  },
  {
    id: 'bestseller',
    name: 'Bestsellery sklepu',
    blurb:
      'Najchętniej kupowane urządzenia w całej ofercie — ranking oparty na realnych, bieżących wynikach sprzedaży na vapepl.com. Top 4, które testuje najwięcej klientów.',
    score: (p, data) => (data.topSellers?.indexOf(p.slug) ?? 99) * 100 - p.price,
  },
  {
    id: 'promocja',
    name: 'Największe oszczędności',
    blurb:
      'Chcesz wygrać najwięcej przy aktualnej promocji? Te cztery modele mają najwyższą różnicę między ceną regularną a obniżoną — sprawdzisz, ile złotych realnie oszczędzasz.',
    score: (p) => ((p.regularPrice ?? p.price) - p.price) * 100 + (p.puffs ?? 0) / 1000,
  },
  {
    id: '4w1',
    name: 'Wiele smaków w jednym',
    blurb:
      'Preferujesz kilka aromatów bez kupowania kilku urządzeń? Modele wielkomodułowe (4w1, 6w1) dają Ci kilka niezależnych smaków w jednej obudowie — przełączaj bez mieszania aromatów.',
    score: (p) => tanksOf(p) * 1000 + (p.puffs ?? 0) / 1000,
    pick: 3, // tylko 3 modele wielkomodułowe w ofercie — limit zgodny z realną liczbą
  },
];

export function scenariosFor(data) {
  return SCENARIOS.map((s) => ({
    ...s,
    products: [...data.products]
      .sort((a, b) => (s.score(b, data) ?? 0) - (s.score(a, data) ?? 0))
      .slice(0, s.pick ?? 4),
  }));
}

// ---------- 价格段（数据驱动，/kategoria/cena-<id>/ 下） ----------
export const PRICE_BANDS = [
  { id: 'do-60', label: 'do 60 zł', min: 0, max: 60 },
  { id: '61-75', label: '61–75 zł', min: 60, max: 75 },
  { id: '76-100', label: '76–100 zł', min: 75, max: 100 },
  { id: '101-140', label: '101–140 zł', min: 100, max: 140 },
  { id: 'od-141', label: 'od 141 zł', min: 140, max: Infinity },
];

export function priceBandsFor(data) {
  return PRICE_BANDS.map((b) => ({
    ...b,
    products: data.products.filter((p) => p.price > b.min && p.price <= b.max),
  }));
}

// ---------- 型号对比页（/porownanie/<a>-vs-<b>/）----------
// 锚定式配对（非全组合 153，防薄页）：畅销榜 top4 两两互比 + 同品牌升级 + 旗舰对垒。
// 每对 = [slugA, slugB, kind, name, blurb]；kind 用于 hero 角标与 FAQ 侧重。
export const COMPARISON_PAIRS = [
  // 畅销榜 top4 两两互比（data.topSellers 前 4 实时驱动，slug 解析不到则跳过）
  ['hifancy-dream-45000-puffs', 'xcor-hawaii-pro-23000-puffs', 'bestseller', 'Hifancy Dream vs XCOR Hawaii Pro', null],
  ['hifancy-dream-45000-puffs', 'xcor-tyrant-23000-puffs', 'bestseller', 'Hifancy Dream vs XCOR Tyrant', null],
  ['hifancy-dream-45000-puffs', 'hifancy-space-50000-puffs', 'bestseller', 'Hifancy Dream vs Hifancy Space', null],
  ['xcor-hawaii-pro-23000-puffs', 'xcor-tyrant-23000-puffs', 'bestseller', 'XCOR Hawaii Pro vs XCOR Tyrant', null],
  ['xcor-hawaii-pro-23000-puffs', 'hifancy-space-50000-puffs', 'bestseller', 'XCOR Hawaii Pro vs Hifancy Space', null],
  ['xcor-tyrant-23000-puffs', 'hifancy-space-50000-puffs', 'bestseller', 'XCOR Tyrant vs Hifancy Space', null],
  // 同品牌升级（小 puff → 大 puff 同厂）
  ['xcor-hawaii-pro-23000-puffs', 'xcor-max-50000-puffs', 'upgrade', 'XCOR Hawaii Pro vs XCOR Max', null],
  ['xcor-tyrant-23000-puffs', 'xcor-max-50000-puffs', 'upgrade', 'XCOR Tyrant vs XCOR Max', null],
  // 旗舰对垒（跨品牌旗舰 / 同级对拼）
  ['stag-bar-6in1-180000-puffs', 'airmez-fox-4in1-120000-puffs', 'flagship', 'Stagbar 6in1 vs AiRMEZ Fox 4in1', null],
  ['fumot-eco-4in1-80000-puffs', 'hifancy-clear-80000-puffs', 'flagship', 'Fumot ECO vs Hifancy Clear', null],
  ['merrymi-blade-30000-puffs', 'airmez-matrix-pro-30000-puffs', 'flagship', 'MerryMi Blade vs AiRMEZ Matrix Pro', null],
  ['fumot-leopard-40000-puffs', 'hifancy-dream-45000-puffs', 'flagship', 'Fumot Leopard vs Hifancy Dream', null],
];

// 把配对解析成带商品对象的结构；slug 解析不到型号的对自动跳过（数据驱动）。
export function comparisonPairsFor(data) {
  const bySlug = new Map(data.products.map((p) => [p.slug, p]));
  return COMPARISON_PAIRS.map(([slugA, slugB, kind, name, blurb]) => {
    const a = bySlug.get(slugA);
    const b = bySlug.get(slugB);
    if (!a || !b) return null;
    // URL slug 按字母序确定（保证确定性构建，同一对始终同 URL）
    const [first, second] = slugA < slugB ? [a, b] : [b, a];
    return {
      kind,
      name,
      blurb: blurb ?? defaultComparisonBlurb(kind, first, second),
      a,
      b,
      slug: `${first.slug}-vs-${second.slug}`,
      url: `/porownanie/${first.slug}-vs-${second.slug}/`,
    };
  }).filter(Boolean);
}

// 默认 blurb（数据驱动数值）：价差 + 谁的 puffs 更高
function defaultComparisonBlurb(kind, first, second) {
  const dPrice = Math.abs(first.price - second.price);
  const bigger = (first.puffs ?? 0) >= (second.puffs ?? 0) ? first : second;
  const kindWord =
    kind === 'upgrade' ? 'upgrade' : kind === 'flagship' ? 'flagship' : 'bestseller';
  return `Porównujemy ${first.name} i ${second.name} — dwa modele ${kindWord} z naszej oferty. ${bigger.name} ma więcej puffs (${puffsFmt(bigger.puffs)}), a różnica cenowa to ${pln(dPrice)}. Który wybierasz?`;
}

// 对比页 FAQ：3 题数值化（价差 / puffs 差 / 单价胜者）——沿用 bandFaq 的"数值逐页不同"反重复策略
export function comparisonFaq(pair) {
  const { a, b } = pair;
  const eff = (p) => (p.puffs > 0 ? (p.price / p.puffs) * 1000 : Infinity);
  const bestEff = eff(a) <= eff(b) ? a : b;
  const morePuffs = (a.puffs ?? 0) >= (b.puffs ?? 0) ? a : b;
  const cheaper = a.price <= b.price ? a : b;
  return [
    {
      q: `Ile kosztuje różnica między ${a.name} a ${b.name}?`,
      a: `${a.name} kosztuje ${pln(a.price)}, a ${b.name} ${pln(b.price)}. Różnica to ${pln(
        Math.abs(a.price - b.price),
      )} — ${cheaper.name} jest tańszy.`,
    },
    {
      q: `Który ma więcej puffs: ${a.name} czy ${b.name}?`,
      a: `${morePuffs.name} oferuje ${puffsFmt(morePuffs.puffs)} puffs, co przy średnim użyciu (ok. 400 puffów dziennie) starczy na dłużej niż ${Math.min(a.puffs ?? 0, b.puffs ?? 0)} puffs rywala.`,
    },
    {
      q: `Który ma lepszy stosunek ceny do wydajności?`,
      a: `${bestEff.name} — ${new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        eff(bestEff),
      )} zł za 1 000 puffs, czyli tańszy pojedynczy puff niż w drugiej opcji.`,
    },
  ];
}

// FAQ strony głównej (AEO: pytanie → 2-3 zdania bezpośredniej odpowiedzi)
export const HOME_FAQ = [
  {
    q: 'Czy produkty w sklepie są oryginalne?',
    a: 'Tak — wszystkie produkty pochodzą z oficjalnych kanałów dystrybucji. Jeśli chcesz zweryfikować autentyczność konkretnego towaru, napisz do nas, a prześlemy potwierdzenie od dystrybutora.',
  },
  {
    q: 'Jak długo czekam na wysyłkę?',
    a: 'Wysyłamy z polskiego magazynu. Zamówienia opłacone w dni robocze nadajemy bez zbędnej zwłoki — Paczkomatem InPost lub kurierem DPD. Koszt i metody dostawy wyświetlasz w koszyku vapepl.com.',
  },
  {
    q: 'Ile kosztuje dostawa?',
    a: 'Koszt wysyłki zależy od wybranej metody i wyliczany jest w koszyku oraz przy kasie na vapepl.com. Warunki ewentualnej darmowej dostawy widoczne są bezpośrednio w koszyku.',
  },
  {
    q: 'Jak śledzić przesyłkę?',
    a: 'Po nadaniu paczki otrzymujesz numer śledzenia — znajdziesz go w e-mailu potwierdzającym oraz na swoim koncie klienta. Link prowadzi do śledzenia InPost lub DPD.',
  },
  {
    q: 'Czy mogę zwrócić produkt?',
    a: 'Tak — masz 14 dni na odstąpienie od umowy bez podania przyczyny. Szczegóły opisaliśmy na stronie Zwroty. Uszkodzony lub wadliwy towar zgłaszasz jako reklamację (rękojmia).',
  },
  {
    q: 'Czy sprzedajecie osobom niepełnoletnim?',
    a: 'Nie. E-papierosy i liquidy sprzedajemy wyłącznie osobom pełnoletnim (18+). Składając zamówienie, potwierdzasz pełnoletność — kurier może ją zweryfikować przy doręczeniu.',
  },
  {
    q: 'Jak działają rabaty ilościowe?',
    a: 'Kupując kilka sztuk tego samego produktu, automatycznie otrzymujesz rabat progowy: −5% od 3 sztuk, −10% od 6, −15% od 10 i −20% od 15 sztuk. Cenę końcową zobaczysz w koszyku.',
  },
  {
    q: 'Gdzie szukać pomocy przy zamówieniu?',
    a: 'Najszybciej reagujemy przez telefon i WhatsApp: +48 729 250 699 (pon.–pt. 9:00–17:00) oraz Telegram @buch_mistrz. Na e-mail odpowiadamy zwykle w ciągu jednego dnia roboczego.',
  },
];

// ---------- 文章库（site/data/guides.json，由 generate-guides.mjs 生成） ----------
// 数据驱动：50 篇与站内模型/口味相关的 vapepl.com 文章，每篇带 flavor（归一化口味键）
// 与 datePublished；本文件不再手写文章清单。

// 文章 → 推荐商品：按 guide.flavor（口味键）在站内找提供该口味的模型，
// 按畅销榜排名取最靠前一款（推荐位落到口味直购页）；无匹配则回退畅销榜首模型页
export function recommendProductsFor(data, guide) {
  const bySlug = new Map(data.products.map((p) => [p.slug, p]));
  const popularity = new Map((data.topSellers ?? []).map((slug, i) => [slug, i]));
  const flavorKeyOf = (guide.flavor ?? '').trim().toLowerCase();
  const candidates = flavorKeyOf
    ? [...data.products]
        .filter((p) => p.flavors.some((f) => flavorKey(f.name) === flavorKeyOf))
        .map((p) => p.slug)
        .sort((a, b) => (popularity.get(a) ?? 99) - (popularity.get(b) ?? 99))
    : [];
  const pickSlug = candidates[0] ?? (data.topSellers ?? [])[0];
  const product = bySlug.get(pickSlug);
  if (!product) return [];
  const flavor = flavorKeyOf
    ? product.flavors.find((f) => flavorKey(f.name) === flavorKeyOf) ?? null
    : null;
  return [
    {
      product,
      flavor,
      name: flavor ? `${product.name} — ${flavor.name}` : product.name,
      url: flavor ? `/produkt/${product.slug}/${flavor.slug}/` : `/produkt/${product.slug}/`,
      buyUrl: flavor ? flavor.buyUrl : product.permalink,
    },
  ];
}

// 商品（模型页/口味页）→ 相关文章。评分：
// 文章推荐位命中同模型+同口味 3 / 同口味不同模型 1.5 / 同模型 1 / 模型在畅销榜 0.5
export function relatedArticlesFor(data, product, flavor, guides = data.guides ?? []) {
  const isTop = data.topSellers?.includes(product.slug);
  const myKey = flavor ? flavorKey(flavor.name) : null;
  return guides.map((g) => {
    const rec = recommendProductsFor(data, g);
    const r = rec[0];
    let score = 0;
    if (r && r.product.slug === product.slug) {
      score =
        r.flavor && myKey && flavorKey(r.flavor.name) === myKey
          ? 3
          : myKey && !r.flavor
            ? 1.5
            : 1;
    }
    if (isTop) score += 0.5;
    return { guide: g, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || guides.indexOf(a.guide) - guides.indexOf(b.guide))
    .map((x) => x.guide);
}

// ---------- 定制 FAQ 生成器：逐页真实数值，消除页面间文案雷同（AEO 友好） ----------
const pln = (n) => new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2 }).format(n) + ' zł';
const puffsFmt = (n) => new Intl.NumberFormat('pl-PL').format(n);

// 模型页 3 题：puffs（含品牌内对比）/ 口味数 / 促销价
export function productFaq(product, data) {
  const siblings = data.products.filter((p) => p.brand === product.brand);
  const biggest = siblings.reduce((a, b) => ((b.puffs ?? 0) > (a.puffs ?? 0) ? b : a), product);
  const puffsNote =
    biggest.slug === product.slug
      ? ` — to największy model marki ${product.brand} pod względem wydajności`
      : `; w tej marce większą wydajność oferuje ${biggest.name} (${puffsFmt(biggest.puffs)} puffs)`;
  const discount =
    product.onSale && product.regularPrice > product.price
      ? Math.round((1 - product.price / product.regularPrice) * 100)
      : null;
  return [
    {
      q: `Ile puffs ma ${product.name}?`,
      a: `${product.name} oferuje ${puffsFmt(product.puffs)} puffs${puffsNote}.`,
    },
    {
      q: `W ilu smakach dostępny jest ${product.name}?`,
      a: `Model ma ${product.flavors.length} wariantów smakowych — każdy wariant ma własną stronę, którą porównasz przed zakupem na vapepl.com.`,
    },
    {
      q: `Ile kosztuje ${product.name}?`,
      a: discount
        ? `W promocji zapłacisz ${pln(product.price)} zamiast ${pln(product.regularPrice)} — cena niższa o ${discount}%.`
        : `Cena to ${pln(product.price)}.`,
    },
  ];
}

// 分类页 3 题：品牌页（模型数/价格区间/最大 puffs）与口味页（产品数/价格区间/畅销模型）各一组
export function categoryFaq(data, category, products) {
  const minP = products.length ? Math.min(...products.map((p) => p.price)) : null;
  const maxP = products.length ? Math.max(...products.map((p) => p.price)) : null;
  if (category.kind === 'brand') {
    if (!products.length) {
      return [
        {
          q: `Czy w ofercie są produkty marki ${category.name}?`,
          a: `W tej chwili podgląd nie zawiera modeli ${category.name} — pełną ofertę zobaczysz w sklepie vapepl.com.`,
        },
      ];
    }
    const biggest = products.reduce((a, b) => ((b.puffs ?? 0) > (a.puffs ?? 0) ? b : a));
    return [
      {
        q: `Ile modeli marki ${category.name} jest w ofercie?`,
        a: `Marka ${category.name} ma w ofercie ${products.length} ${pluralModels(products.length)}: ${products.map((p) => p.name).join(', ')}.`,
      },
      {
        q: `Od jakiej ceny zaczynają się produkty ${category.name}?`,
        a: `Ceny wynoszą od ${pln(minP)}${minP !== maxP ? ` do ${pln(maxP)}` : ''} — wszystkie modele w promocji.`,
      },
      {
        q: `Który model ${category.name} ma najwięcej puffs?`,
        a: `${biggest.name} — ${puffsFmt(biggest.puffs)} puffs przy cenie ${pln(biggest.price)}.`,
      },
    ];
  }
  // 口味分类
  if (!products.length) {
    return [
      {
        q: `Czy w kategorii ${category.name} są teraz produkty?`,
        a: `Kategoria ${category.name} jest teraz pusta w podglądzie — pełną listę smaków znajdziesz w sklepie vapepl.com.`,
      },
    ];
  }
  const top = (data.topSellers ?? [])
    .map((s) => products.find((p) => p.slug === s))
    .find(Boolean);
  const richest = products.reduce((a, b) => (b.flavors.length > a.flavors.length ? b : a));
  const totalFlavors = products.reduce((s, p) => s + p.flavors.length, 0);
  const best =
    top
      ? {
          q: `Który model ze smaków ${category.name} sprzedaje się najlepiej?`,
          a: `Najczęściej wybierany w tej kategorii jest ${top.name} (${pln(top.price)}, ${top.flavors.length} smaków).`,
        }
      : {
          q: `Który model w kategorii ${category.name} ma najwięcej smaków?`,
          a: `${richest.name} — ${richest.flavors.length} wariantów smakowych, czyli najszerszy wybór w tej kategorii.`,
        };
  return [
    {
      q: `Ile produktów ma smak ${category.name}?`,
      a: `Kategoria ${category.name} obejmuje ${products.length} ${pluralProducts(products.length)}, łącznie ${totalFlavors} wariantów smakowych.`,
    },
    {
      q: `Od jakiej ceny zaczynają się smaki ${category.name}?`,
      a: `Ceny w kategorii to ${pln(minP)}${minP !== maxP ? `–${pln(maxP)}` : ''} za urządzenie, wszystkie w promocji.`,
    },
    best,
  ];
}

// 口味页 3 题：口味描述（flavorAngle）/ 品牌原创性 / 该模型促销折扣
export function flavorFaq(product, flavor, angle) {
  const discount =
    product.onSale && product.regularPrice > product.price
      ? Math.round((1 - product.price / product.regularPrice) * 100)
      : null;
  return [
    {
      q: `Jak smakuje ${flavor.name} w ${product.name}?`,
      a: `Smak ${flavor.name} to ${angle}. To jeden z ${product.flavors.length} dostępnych wariantów modelu ${product.name}.`,
    },
    {
      q: `Czy produkty marki ${product.brand} są oryginalne?`,
      a: `Tak — ${product.brand} to jedna z ${STATS.brandsLabel} marek w ofercie. Wszelkie towary pochodzą z oficjalnych kanałów dystrybucji; weryfikację autentyczności możesz poprosić u obsługi.`,
    },
    {
      q: `Ile kosztuje ${product.name} w smaku ${flavor.name}?`,
      a: discount
        ? `W promocji zapłacisz ${pln(product.price)} zamiast ${pln(product.regularPrice)} — rabat ${discount}%. Odbiór Paczkomatem InPost lub kurierem DPD.`
        : `Cena to ${pln(product.price)}. Odbiór Paczkomatem InPost lub kurierem DPD.`,
    },
  ];
}

export const WHY_US = [
  { icon: 'shield-check', title: 'Gwarancja Jakości' },
  { icon: 'truck', title: 'Szybka Wysyłka' },
  { icon: 'percent', title: 'Rabaty Ilościowe' },
];

export const CONTACT = {
  phone: '+48 729 250 699',
  phoneHref: 'tel:+48729250699',
  whatsapp: 'https://wa.me/48729250699',
  telegram: { label: '@buch_mistrz', href: 'https://t.me/buch_mistrz' },
  email: 'support@buchmistrz.com',
  hours: 'pon.–pt. 9:00–17:00',
};

// Smak: klasyfikacja słów kluczowych → zdanie opisowe (różnicuje strony wariantów pod SEO)
export function flavorAngle(name) {
  const n = name.toLowerCase();
  if (/(tobacco|tytoń|cigar)/.test(n)) {
    return 'klasyczna, tytoniowa nuta bez chłodzenia — wybór dla osób schodzących z tradycyjnych papierosów';
  }
  if (/(ice|mint|menthol|cool|frost|cold|winter)/.test(n)) {
    return 'wyraźnie chłodząca, mentolowo-lodowa kompozycja, która odświeża przy każdym puffsie';
  }
  if (/(candy|gum|sweet|cola|cake|cookie|desert|cream|choco|vanilla|lemonade)/.test(n)) {
    return 'słodki, deserowy profil smaku z długim, przyjemnym posmakiem';
  }
  return 'soczysta, owocowa kompozycja utrzymana w świeżym, pełnym aromacie';
}

export const STATS = {
  since: 2014,
  ratingLabel: '4,4 / 5',
  productsLabel: '18',
  brandsLabel: '7',
};
