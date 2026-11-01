// src/printable/shared/cardCatalog.js
// Business-card catalogue organised by style and by industry. Every template
// combines a composition (see catalogLayout.js), a palette, a type pairing and,
// for industries, a matching emblem, so each category has its own designs.

export const CARD_STYLES = [
  { id: '3d', label: '3D' }, { id: 'colorful', label: 'Coloré' }, { id: 'business', label: 'Entreprise' },
  { id: 'cool', label: 'Cool' }, { id: 'creative', label: 'Créativité' }, { id: 'cute', label: 'Mignon' },
  { id: 'elegant', label: 'Élégant' }, { id: 'luxury', label: 'Luxe' }, { id: 'minimal', label: 'Minimal' },
  { id: 'modern', label: 'Moderne' }, { id: 'premium', label: 'Premium' }, { id: 'professional', label: 'Professionnel' },
  { id: 'easy', label: 'Facile' }, { id: 'unique', label: 'Unique' }
];

export const CARD_INDUSTRIES = [
  { id: 'bakery', label: 'Boulangerie' }, { id: 'barber', label: 'Barbier' }, { id: 'beauty', label: 'Beauté' },
  { id: 'cleaning', label: 'Nettoyage' }, { id: 'cleaning-service', label: 'Service de nettoyage' },
  { id: 'construction', label: 'Construction' }, { id: 'electrician', label: 'Électricien' }, { id: 'handyman', label: 'Bricoleur' },
  { id: 'insurance', label: 'Assurance' }, { id: 'landscaping', label: 'Aménagement paysager' }, { id: 'lawyer', label: 'Avocat' },
  { id: 'photography', label: 'Photographie' }, { id: 'realestate', label: 'Immobilier' }, { id: 'restaurant', label: 'Restaurant' }
];

// primary, secondary, text, background, accent
const P = {
  navyTeal: ['#0f2a3d', '#2bb3b1', '#ffffff', '#0f2a3d', '#2bb3b1'],
  tealWhite: ['#1f9fa3', '#0f3b46', '#0f3b46', '#ffffff', '#1f9fa3'],
  plumGold: ['#d8b26e', '#f3e3c2', '#ffffff', '#2a0f1f', '#d8b26e'],
  charcoalGold: ['#c9a227', '#e8d5a3', '#f4efe4', '#1c1a17', '#c9a227'],
  cream: ['#2b2b2b', '#8a6d3b', '#2b2b2b', '#fbf7ef', '#d97706'],
  orangeWhite: ['#f28c28', '#1f2937', '#1f2937', '#ffffff', '#f28c28'],
  lilac: ['#7c5cbf', '#a78bfa', '#4c1d95', '#fbeefe', '#7c5cbf'],
  slate: ['#e2e8f0', '#94a3b8', '#f8fafc', '#2b2f36', '#e2e8f0'],
  skyNavy: ['#0e2a47', '#7dd3fc', '#0e2a47', '#e0f2fe', '#38bdf8'],
  maroonCream: ['#5a1414', '#c2410c', '#5a1414', '#fffaf0', '#5a1414'],
  purpleNight: ['#ffffff', '#c4b5fd', '#ffffff', '#2e1065', '#a78bfa'],
  sunPurple: ['#5b0f5c', '#fde047', '#fde047', '#fde047', '#5b0f5c'],
  forestGold: ['#d6b26e', '#f5e6c4', '#ffffff', '#0b3b2e', '#d6b26e'],
  indigoMist: ['#1e1b6e', '#4f46e5', '#1e1b6e', '#e8e8f5', '#4f46e5'],
  ink: ['#111111', '#6b7280', '#111111', '#ffffff', '#111111'],
  sand: ['#344b43', '#8b9b8a', '#26332d', '#f7f6f0', '#d7cbb5'],
  coral: ['#ef4444', '#fb923c', '#1f2937', '#fff7ed', '#f97316'],
  mint: ['#0f766e', '#5eead4', '#134e4a', '#f0fdfa', '#14b8a6'],
  blush: ['#db2777', '#f9a8d4', '#831843', '#fdf2f8', '#ec4899'],
  candy: ['#7c3aed', '#f472b6', '#1f2937', '#fefce8', '#22d3ee'],
  neon: ['#22d3ee', '#a855f7', '#e0f2fe', '#0b1020', '#f472b6'],
  electric: ['#facc15', '#0ea5e9', '#f8fafc', '#0b1220', '#facc15'],
  hazard: ['#facc15', '#111111', '#ffffff', '#111111', '#facc15'],
  brick: ['#9a3412', '#f97316', '#1c1917', '#fff7ed', '#ea580c'],
  steel: ['#1e3a5f', '#f59e0b', '#1e293b', '#f1f5f9', '#f59e0b'],
  olive: ['#3f6212', '#a3e635', '#1a2e05', '#f7fee7', '#65a30d'],
  leaf: ['#15803d', '#86efac', '#ffffff', '#14532d', '#4ade80'],
  law: ['#0b2545', '#b08d57', '#0b2545', '#f8f5ef', '#b08d57'],
  lawDark: ['#d4b483', '#8d99ae', '#f8f5ef', '#13213c', '#d4b483'],
  photo: ['#ffffff', '#f59e0b', '#ffffff', '#111111', '#f59e0b'],
  house: ['#0f766e', '#f59e0b', '#0f172a', '#ffffff', '#0f766e'],
  houseNavy: ['#ffffff', '#fbbf24', '#ffffff', '#1e3a8a', '#fbbf24'],
  bistro: ['#b91c1c', '#f59e0b', '#1c1917', '#fffbeb', '#b91c1c'],
  bistroDark: ['#fbbf24', '#f87171', '#fef3c7', '#1c1917', '#fbbf24'],
  bread: ['#92400e', '#d97706', '#451a03', '#fef3c7', '#b45309'],
  barber: ['#dc2626', '#1d4ed8', '#111827', '#f8fafc', '#dc2626'],
  barberDark: ['#e5e7eb', '#b91c1c', '#f9fafb', '#111827', '#b91c1c'],
  clean: ['#0284c7', '#22d3ee', '#0c4a6e', '#f0f9ff', '#0ea5e9'],
  cleanGreen: ['#16a34a', '#38bdf8', '#14532d', '#f0fdf4', '#22c55e'],
  shield: ['#1d4ed8', '#10b981', '#0f172a', '#ffffff', '#1d4ed8'],
  shieldDark: ['#34d399', '#93c5fd', '#ecfeff', '#0f2744', '#34d399']
};

const pal = (k) => {
  const [primary, secondary, text, background, accent] = P[k];
  return { primary, secondary, text, background, accent };
};

const FONTS = {
  bold: { heading: 'montserrat', body: 'inter' },
  clean: { heading: 'inter', body: 'inter' },
  round: { heading: 'poppins', body: 'poppins' },
  serif: { heading: 'serif', body: 'lato' },
  classic: { heading: 'serif', body: 'serif' },
  mono: { heading: 'mono', body: 'inter' },
  roboto: { heading: 'roboto', body: 'roboto' }
};

// [composition, palette, fonts, emblem, options]
const STYLE_SETS = {
  '3d': [['glow', 'neon', 'bold', 'Box'], ['glow', 'purpleNight', 'round', 'Gem'], ['diagonal', 'skyNavy', 'bold', 'Hexagon', { upper: true }], ['split', 'electric', 'bold', 'Layers'], ['wave', 'navyTeal', 'round', 'Box']],
  colorful: [['dots', 'candy', 'round', 'Sparkles'], ['triangles', 'coral', 'bold', 'Sun', { upper: true }], ['blob', 'blush', 'round', 'Flower2'], ['diagonal', 'sunPurple', 'bold', 'Zap', { upper: true }], ['corner', 'mint', 'round', 'Palette']],
  business: [['diagonal', 'navyTeal', 'bold', 'Building2', { upper: true }], ['sidebar', 'sand', 'clean', 'Briefcase'], ['topband', 'law', 'serif', 'Landmark'], ['arrowtab', 'slate', 'bold', 'BarChart3'], ['split', 'indigoMist', 'clean', 'Target']],
  cool: [['circuit', 'neon', 'mono', 'Cpu', { upper: true }], ['glow', 'electric', 'bold', 'Rocket'], ['stripes', 'hazard', 'bold', 'Flame', { upper: true }], ['wave', 'purpleNight', 'round', 'Headphones'], ['diagonal', 'neon', 'bold', 'Gamepad2']],
  creative: [['blob', 'candy', 'round', 'PenTool'], ['circles', 'orangeWhite', 'round', 'Palette'], ['dots', 'coral', 'bold', 'Brush'], ['wave', 'lilac', 'round', 'Lightbulb'], ['corner', 'sunPurple', 'bold', 'Feather']],
  cute: [['blob', 'blush', 'round', 'Heart'], ['dots', 'mint', 'round', 'Cat'], ['circles', 'lilac', 'round', 'Cloud'], ['corner', 'candy', 'round', 'IceCream'], ['blob', 'coral', 'round', 'Cherry']],
  elegant: [['frame', 'cream', 'classic', 'Feather'], ['frame', 'plumGold', 'serif', 'Flower'], ['topband', 'law', 'serif', 'Crown'], ['minimal', 'sand', 'serif', 'Leaf'], ['wave', 'charcoalGold', 'serif', 'Gem']],
  luxury: [['frame', 'charcoalGold', 'classic', 'Crown', { upper: true }], ['frame', 'forestGold', 'serif', 'Gem', { upper: true }], ['split', 'plumGold', 'serif', 'Diamond'], ['minimal', 'charcoalGold', 'serif', 'Award', { upper: true }], ['arrowtab', 'lawDark', 'serif', 'Star']],
  minimal: [['minimal', 'ink', 'clean', 'Circle'], ['minimal', 'sand', 'clean', 'Square'], ['sidebar', 'ink', 'clean', 'Minus'], ['topband', 'slate', 'clean', 'Triangle'], ['minimal', 'skyNavy', 'clean', 'Hexagon']],
  modern: [['diagonal', 'tealWhite', 'bold', 'Hexagon', { upper: true }], ['wave', 'skyNavy', 'round', 'Waves'], ['circles', 'ink', 'bold', 'Circle'], ['bottomwave', 'navyTeal', 'bold', 'Layers'], ['split', 'orangeWhite', 'bold', 'Box']],
  premium: [['frame', 'plumGold', 'serif', 'Award'], ['split', 'charcoalGold', 'bold', 'Crown', { upper: true }], ['topband', 'lawDark', 'serif', 'Shield'], ['glow', 'forestGold', 'serif', 'Gem'], ['arrowtab', 'charcoalGold', 'bold', 'Star']],
  professional: [['sidebar', 'law', 'clean', 'Briefcase'], ['topband', 'steel', 'bold', 'Building'], ['bottomwave', 'shield', 'clean', 'CheckCircle'], ['arrowtab', 'indigoMist', 'bold', 'Compass'], ['minimal', 'law', 'serif', 'Landmark']],
  easy: [['minimal', 'ink', 'clean', 'User'], ['topband', 'mint', 'clean', 'Smile'], ['sidebar', 'coral', 'round', 'Star'], ['minimal', 'lilac', 'round', 'Heart'], ['bottomwave', 'clean', 'clean', 'Phone']],
  unique: [['stripes', 'sunPurple', 'bold', 'Zap', { upper: true }], ['circuit', 'charcoalGold', 'mono', 'Compass'], ['circles', 'neon', 'round', 'Orbit'], ['triangles', 'maroonCream', 'bold', 'Mountain', { upper: true }], ['blob', 'electric', 'bold', 'Sparkles']]
};

const INDUSTRY_SETS = {
  bakery: [['blob', 'bread', 'serif', 'Croissant'], ['frame', 'cream', 'classic', 'Wheat'], ['dots', 'bread', 'round', 'Cake'], ['topband', 'maroonCream', 'serif', 'ChefHat'], ['corner', 'bistro', 'round', 'Cookie']],
  barber: [['stripes', 'barberDark', 'bold', 'Scissors', { upper: true }], ['frame', 'charcoalGold', 'classic', 'Scissors', { upper: true }], ['diagonal', 'barber', 'bold', 'Scissors'], ['split', 'barberDark', 'bold', 'Crown', { upper: true }], ['minimal', 'ink', 'serif', 'Scissors']],
  beauty: [['blob', 'blush', 'serif', 'Flower2'], ['frame', 'plumGold', 'serif', 'Sparkles'], ['wave', 'lilac', 'serif', 'Gem'], ['circles', 'blush', 'round', 'Heart'], ['minimal', 'cream', 'classic', 'Flower']],
  cleaning: [['bottomwave', 'clean', 'round', 'Sparkles'], ['blob', 'cleanGreen', 'round', 'Droplets'], ['wave', 'clean', 'bold', 'SprayCan'], ['dots', 'mint', 'round', 'Droplet'], ['diagonal', 'clean', 'bold', 'Brush']],
  'cleaning-service': [['topband', 'clean', 'bold', 'Home', { upper: true }], ['sidebar', 'cleanGreen', 'clean', 'CheckCircle'], ['bottomwave', 'cleanGreen', 'round', 'Leaf'], ['arrowtab', 'clean', 'bold', 'Truck'], ['split', 'mint', 'bold', 'ShieldCheck']],
  construction: [['diagonal', 'steel', 'bold', 'HardHat', { upper: true }], ['stripes', 'hazard', 'bold', 'Construction', { upper: true }], ['triangles', 'brick', 'bold', 'Hammer', { upper: true }], ['split', 'steel', 'bold', 'Building2'], ['wave', 'maroonCream', 'bold', 'Home', { upper: true }], ['arrowtab', 'hazard', 'bold', 'Wrench']],
  electrician: [['circuit', 'electric', 'mono', 'Zap', { upper: true }], ['diagonal', 'electric', 'bold', 'PlugZap'], ['stripes', 'hazard', 'bold', 'Zap', { upper: true }], ['split', 'skyNavy', 'bold', 'Lightbulb'], ['glow', 'electric', 'bold', 'BatteryCharging']],
  handyman: [['triangles', 'brick', 'bold', 'Wrench', { upper: true }], ['split', 'orangeWhite', 'bold', 'Hammer'], ['sidebar', 'steel', 'bold', 'Hammer'], ['diagonal', 'maroonCream', 'bold', 'Paintbrush'], ['stripes', 'hazard', 'bold', 'Briefcase', { upper: true }]],
  insurance: [['topband', 'shield', 'clean', 'Shield'], ['bottomwave', 'shield', 'clean', 'Umbrella'], ['sidebar', 'law', 'serif', 'ShieldCheck'], ['split', 'shieldDark', 'bold', 'HeartHandshake'], ['minimal', 'indigoMist', 'clean', 'Shield']],
  landscaping: [['blob', 'olive', 'round', 'Trees'], ['wave', 'leaf', 'bold', 'Leaf'], ['triangles', 'olive', 'bold', 'Sprout', { upper: true }], ['frame', 'forestGold', 'serif', 'TreePine'], ['diagonal', 'leaf', 'bold', 'Flower']],
  lawyer: [['frame', 'law', 'classic', 'Scale', { upper: true }], ['topband', 'lawDark', 'serif', 'Landmark'], ['sidebar', 'law', 'serif', 'Gavel'], ['minimal', 'law', 'classic', 'Scale'], ['split', 'lawDark', 'serif', 'BookOpen']],
  photography: [['split', 'photo', 'bold', 'Camera', { upper: true }], ['circles', 'ink', 'clean', 'Aperture'], ['minimal', 'photo', 'clean', 'Camera'], ['glow', 'purpleNight', 'round', 'Focus'], ['frame', 'charcoalGold', 'serif', 'Image']],
  realestate: [['diagonal', 'house', 'bold', 'Home', { upper: true }], ['wave', 'houseNavy', 'bold', 'Building2'], ['topband', 'law', 'serif', 'KeyRound'], ['split', 'houseNavy', 'bold', 'MapPin'], ['frame', 'forestGold', 'serif', 'Home'], ['bottomwave', 'house', 'clean', 'Building']],
  restaurant: [['frame', 'bistroDark', 'classic', 'UtensilsCrossed', { upper: true }], ['blob', 'bistro', 'serif', 'ChefHat'], ['topband', 'maroonCream', 'serif', 'Wine'], ['dots', 'bistro', 'round', 'Pizza'], ['split', 'bistroDark', 'bold', 'Soup']]
};

const SIZES = {
  bold: { name: 13.5, title: 7.2, body: 6.1 },
  clean: { name: 13, title: 7.2, body: 6.2 },
  round: { name: 13.5, title: 7.2, body: 6.2 },
  serif: { name: 14, title: 7.4, body: 6.2 },
  classic: { name: 14, title: 7.4, body: 6.3 },
  mono: { name: 12, title: 6.8, body: 5.9 },
  roboto: { name: 13, title: 7.2, body: 6.2 }
};

const NEW_IDS = new Set(['cat-3d-1', 'cat-3d-2', 'cat-cool-1', 'cat-unique-3', 'cat-electrician-1', 'cat-photography-4', 'cat-beauty-1', 'cat-cute-1']);
const POPULAR_IDS = new Set(['cat-business-1', 'cat-modern-1', 'cat-construction-1', 'cat-realestate-1', 'cat-luxury-1', 'cat-minimal-1', 'cat-professional-1', 'cat-beauty-2', 'cat-restaurant-1', 'cat-barber-1', 'cat-lawyer-1', 'cat-elegant-1']);

function build(kind, catId, entries, label) {
  return entries.map(([composition, palette, fonts, emblem, opts = {}], i) => {
    const id = `cat-${catId}-${i + 1}`;
    return {
      id,
      name: `${label} ${i + 1}`,
      description: `${label} · ${composition}`,
      category: catId,
      styles: kind === 'style' ? [catId] : [],
      industries: kind === 'industry' ? [catId] : [],
      tags: [label.toLowerCase(), composition, emblem.toLowerCase()],
      isPremium: false,
      isNew: NEW_IDS.has(id),
      popular: POPULAR_IDS.has(id),
      composition,
      emblem,
      upper: Boolean(opts.upper),
      colors: pal(palette),
      fonts: FONTS[fonts],
      typeScale: SIZES[fonts],
      alignment: 'left',
      pdfFontFamily: fonts === 'classic' || fonts === 'serif' ? 'Times-Roman' : 'Helvetica',
      pdfFontSizeMultiplier: 1.0,
      defaultQrPosition: { x: 69, y: 36, size: 13 },
      defaultLogoPosition: { x: 56, y: 10, w: 16, h: 16 },
      safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
    };
  });
}

export const CATALOG_TEMPLATES = [
  ...CARD_STYLES.flatMap((s) => build('style', s.id, STYLE_SETS[s.id] || [], s.label)),
  ...CARD_INDUSTRIES.flatMap((c) => build('industry', c.id, INDUSTRY_SETS[c.id] || [], c.label))
];

export const CATALOG_CATEGORIES = [...CARD_STYLES, ...CARD_INDUSTRIES];
