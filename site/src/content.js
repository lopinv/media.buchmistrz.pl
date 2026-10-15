// site/src/content.js — 静态营销文案与站点常量（波兰语面向终端用户）
// 数据来源：README.md（2026-10-15 从 vapepl.com 抓取）与 WooCommerce API 调研

export const SITE = 'https://lopinv.github.io/media.buchmistrz.pl';
export const SITE_NAME = 'VapePL.COM';
export const VAPEPL = 'https://vapepl.com';
export const VAPEPL_RETURNS = `${VAPEPL}/refund_returns/`;

export const BRANDS = {
  airmez: { name: 'AiRMEZ', emoji: '🦊', blurb: 'Wydajne jednorazówki 4IN1 z wymiennymi wkładami.' },
  fumot: { name: 'Fumot', emoji: '🐆', blurb: 'RandM Tornado i ECO — klasyki w bestowych cenach.' },
  hifancy: { name: 'HIFANCY', emoji: '✨', blurb: 'Premium design i czysty smak do ostatniego puffs.' },
  maskking: { name: 'Maskking', emoji: '🎭', blurb: 'Lekkie, przenośne urządzenia dla początkujących.' },
  merrymi: { name: 'MerryMi', emoji: '🍬', blurb: 'Słodkie aromaty i stabilna jakość atomizacji.' },
  stagbar: { name: 'Stagbar', emoji: '🦌', blurb: 'Rekordowa wydajność 6IN1 — do 180 000 puffs.' },
  xcor: { name: 'XCOR', emoji: '⚡', blurb: 'Mocne baterie i intensywne, chłodzące smaki.' },
};
export const BRAND_ORDER = ['airmez', 'fumot', 'hifancy', 'maskking', 'merrymi', 'stagbar', 'xcor'];

export const FLAVOR_CATS = {
  fruity: { name: 'Fruity', emoji: '🍓', blurb: 'Owocowe aromaty — od arbuzowych po egzotyczne mieszanki.' },
  'menthol-ice': { name: 'Menthol & Ice', emoji: '🧊', blurb: 'Chłodzące smaki z mentolem i lodową nutą.' },
  'sweet-candy': { name: 'Sweet & Candy', emoji: '🍬', blurb: 'Słodkie, deserowe i bubblegumowe aromaty.' },
  tobacco: { name: 'Tobacco', emoji: '🍂', blurb: 'Klasyczne tytoniowe nuty dla tradycjonalistów.' },
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
  { stars: 4, text: 'Bateria spokojnie trzyma dwa dni.', author: 'Tomasz N.' },
];

export const DISCOUNT_TIERS = [
  { qty: '3–5 szt.', off: '−5%' },
  { qty: '6–9 szt.', off: '−10%' },
  { qty: '10–14 szt.', off: '−15%' },
  { qty: '15+ szt.', off: '−20%' },
];

export const TOP_FLAVORS = [
  { name: 'Watermelon Ice', medal: '🥇' },
  { name: 'Strawberry Ice', medal: '🥈' },
  { name: 'Strawberry Watermelon', medal: '🥉' },
  { name: 'Grape Ice', medal: '4' },
  { name: 'Lemon Lime', medal: '5' },
  { name: 'Blueberry On Ice', medal: '6' },
  { name: 'Strawberry Kiwi', medal: '7' },
  { name: 'Kiwi Passion Fruit Guava', medal: '8' },
  { name: 'Mixed Berries', medal: '9' },
  { name: 'Blueberry Raspberry', medal: '10' },
  { name: 'Mixed Berry', medal: '11' },
  { name: 'Pink Lemonade', medal: '12' },
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
    q: 'Jakie metody płatności są dostępne?',
    a: 'Przy kasie na vapepl.com zapłacisz BLIK-iem lub szybkim przelewem. Pełna lista metod wyświetla się w trakcie składania zamówienia.',
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

// Wybrane poradniki (pełna lista 30 na vapepl.com)
export const GUIDES = [
  { title: 'IQOS vs papieros: 30 dni kosztów i drabina puffs', url: `${VAPEPL}/iqos-vs-papieros-30-dni-kosztow-i-drabina-puffs/` },
  { title: 'E papieros vs papieros: 30 dni, 1 000 puffs i liczby', url: `${VAPEPL}/e-papieros-vs-papieros-30-dni-1-000-puffs-i-liczby/` },
  { title: 'RandM Tornado 9000: ładowanie, przechowywanie i wymiana', url: `${VAPEPL}/randm-tornado-9000-ladowanie-przechowywanie-i-wymiana/` },
  { title: 'Najlepsza jednorazówka w 5 scenariuszach: LUX, TORNADO i STAG', url: `${VAPEPL}/najlepsza-jednorazowka-w-5-scenariuszach-lux-tornado-i-stag/` },
  { title: 'Jednorazówka 50mg: LUX, STAG BAR i TORNADO w liczbach', url: `${VAPEPL}/jednorazowka-50mg-lux-stag-bar-i-tornado-w-liczbach/` },
  { title: 'Co zamiast jednorazówek: LUX 60K, MAX i DREAM', url: `${VAPEPL}/co-zamiast-jednorazowek-lux-60k-max-i-dream/` },
];

export const WHY_US = [
  { emoji: '✅', title: 'Gwarancja Jakości', text: '100% oryginalnych produktów z oficjalnych kanałów dystrybucji.' },
  { emoji: '🚚', title: 'Szybka Wysyłka', text: 'Polski magazyn — Paczkomaty InPost i kurier DPD.' },
  { emoji: '💳', title: 'Bezpieczne Płatności', text: 'BLIK i szybkie przelewy przy kasie online.' },
  { emoji: '🎁', title: 'Rabaty Ilościowe', text: 'Do −20% przy 15+ sztukach i 14 dni na zwrot.' },
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
