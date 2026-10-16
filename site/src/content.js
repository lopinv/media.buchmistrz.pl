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

export const TOP_FLAVORS = [
  { name: 'Watermelon Ice', rank: 1 },
  { name: 'Strawberry Ice', rank: 2 },
  { name: 'Strawberry Watermelon', rank: 3 },
  { name: 'Grape Ice', rank: 4 },
  { name: 'Lemon Lime', rank: 5 },
  { name: 'Blueberry On Ice', rank: 6 },
  { name: 'Strawberry Kiwi', rank: 7 },
  { name: 'Kiwi Passion Fruit Guava', rank: 8 },
  { name: 'Mixed Berries', rank: 9 },
  { name: 'Blueberry Raspberry', rank: 10 },
  { name: 'Mixed Berry', rank: 11 },
  { name: 'Pink Lemonade', rank: 12 },
];

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

// 候选模型池：按口味名（小写精确）映射到该口味真实存在的站内模型。
// 文章推荐位在此池中取与口味匹配的模型；口味缺失时取池内畅销排名最高者。
const GUIDE_FLAVOR_POOL = {
  'cool mint': ['fumot-randm-tornado-9000-puffs', 'xcor-max-50000-puffs'],
  'watermelon ice': ['airmez-lux-60000-puffs', 'hifancy-dream-45000-puffs', 'xcor-max-50000-puffs'],
  grape: ['fumot-randm-tornado-9000-puffs'],
  'strawberry kiwi': ['xcor-max-50000-puffs'],
  'blueberry on ice': ['airmez-lux-60000-puffs'],
  'strawberry ice': ['hifancy-dream-45000-puffs'],
};

// 精选文章（vapepl.com 共 30 篇，此处为站内镜像列表 + 每篇关联的商品推荐位）
// flavor: 推荐口味名（对应 GUIDE_FLAVOR_POOL 的键）；池内无该口味的模型则回退池内畅销榜首
export const GUIDES = [
  {
    id: 'iqos-vs-papieros',
    title: 'IQOS vs papieros: 30 dni kosztów i drabina puffs',
    url: `${VAPEPL}/iqos-vs-papieros-30-dni-kosztow-i-drabina-puffs/`,
    summary:
      '30-dniowy test porównujący miesięczne wydatki na IQOS i papierosy oraz przeliczenie zużycia na liczbę puffs — kiedy e-papieros zaczyna się opłacać.',
    flavor: 'Cool Mint',
  },
  {
    id: 'e-papieros-vs-papieros',
    title: 'E papieros vs papieros: 30 dni, 1 000 puffs i liczby',
    url: `${VAPEPL}/e-papieros-vs-papieros-30-dni-1-000-puffs-i-liczby/`,
    summary:
      'Trzydzieści dni, tysiąc puffs i twarde liczby: koszt jednej dawki, zużycie baterii i ile klasycznych papierosów zastępuje jeden e-papieros.',
    flavor: 'Watermelon Ice',
  },
  {
    id: 'randm-tornado-9000-poradnik',
    title: 'RandM Tornado 9000: ładowanie, przechowywanie i wymiana',
    url: `${VAPEPL}/randm-tornado-9000-ladowanie-przechowywanie-i-wymiana/`,
    summary:
      'Praktyczny poradnik do RandM Tornado 9000: jak ładować i przechowywać urządzenie oraz co zrobić, gdy smak słabnie przed ostatnim puffem.',
    flavor: 'Grape',
  },
  {
    id: 'najlepsza-jednorazowka-5-scenariuszy',
    title: 'Najlepsza jednorazówka w 5 scenariuszach: LUX, TORNADO i STAG',
    url: `${VAPEPL}/najlepsza-jednorazowka-w-5-scenariuszach-lux-tornado-i-stag/`,
    summary:
      'Pięć scenariuszy użytkowania — od wyjazdów po pracę w terenie — i w których z nich najlepiej sprawdzają się LUX, TORNADO oraz STAG BAR.',
    flavor: 'Strawberry Kiwi',
  },
  {
    id: 'jednorazowka-50mg',
    title: 'Jednorazówka 50mg: LUX, STAG BAR i TORNADO w liczbach',
    url: `${VAPEPL}/jednorazowka-50mg-lux-stag-bar-i-tornado-w-liczbach/`,
    summary:
      'Wersje 50 mg trzech flagowych modeli w liczbach: koszt pojedynczego puffsie, czas życia i do jakich scenariuszy pasuje wysoka moc.',
    flavor: 'Blueberry On Ice',
  },
  {
    id: 'co-zamiast-jednorazowek',
    title: 'Co zamiast jednorazówek: LUX 60K, MAX i DREAM',
    url: `${VAPEPL}/co-zamiast-jednorazowek-lux-60k-max-i-dream/`,
    summary:
      'Alternatywy dla typowych jednorazówek: systemy wielorazowe LUX 60K, MAX i DREAM — co zyskujesz, a co tracisz względem jednorazówek.',
    flavor: 'Strawberry Ice',
  },
];

// 文章 → 推荐商品：在口味候选池中取与该口味匹配、且畅销排名靠前的模型
export function recommendProductsFor(data, guide) {
  const bySlug = new Map(data.products.map((p) => [p.slug, p]));
  const popularity = new Map((data.topSellers ?? []).map((slug, i) => [slug, i]));
  const flavorName = (guide.flavor ?? '').trim().toLowerCase();
  const pool = (GUIDE_FLAVOR_POOL[flavorName] ?? []).filter((slug) => {
    const p = bySlug.get(slug);
    return p?.flavors.some((f) => f.name.trim().toLowerCase() === flavorName);
  });
  pool.sort((a, b) => (popularity.get(a) ?? 99) - (popularity.get(b) ?? 99));
  const pickSlug = pool[0] ?? (data.topSellers ?? [])[0];
  const product = bySlug.get(pickSlug);
  if (!product) return [];
  const flavor =
    product.flavors.find((f) => f.name.trim().toLowerCase() === flavorName) ?? null;
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
// 模型+口味双命中 3 / 同口味不同模型 1.5 / 同模型 1 / 模型在畅销榜 0.5（畅销款始终有推荐位）
export function relatedArticlesFor(data, product, flavor) {
  const isTop = data.topSellers?.includes(product.slug);
  return GUIDES.map((g) => {
    const rec = recommendProductsFor(data, g);
    const r = rec[0];
    let score = 0;
    if (r && r.product.slug === product.slug) {
      score =
        r.flavor && flavor && r.flavor.slug === flavor.slug
          ? 3
          : flavor && !r.flavor
            ? 1.5
            : 1;
    }
    if (isTop) score += 0.5;
    return { guide: g, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || GUIDES.indexOf(a.guide) - GUIDES.indexOf(b.guide))
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
        a: `Marka ${category.name} ma w ofercie ${products.length} modeli: ${products.map((p) => p.name).join(', ')}.`,
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
      a: `Kategoria ${category.name} obejmuje ${products.length} modeli, łącznie ${totalFlavors} wariantów smakowych.`,
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
