// src/design/pocketCatalog.js
// Pocket catalogue by use case and style. Compositions are relative to the page
// so they adapt to A4, A5, 9×12… Every element (texts, photos, shapes, QR) stays editable.

export const POCKET_USES = [
  { id: 'business', label: 'Business' }, { id: 'retail', label: 'Retail' }, { id: 'restaurant', label: 'Restaurant' },
  { id: 'real_estate', label: 'Immobilier' }, { id: 'beauty', label: 'Beauté' }, { id: 'services', label: 'Services' },
  { id: 'event', label: 'Événements' }, { id: 'promo', label: 'Promotions' }
];

export const POCKET_STYLES = [
  { id: 'minimal', label: 'Minimal' }, { id: 'elegant', label: 'Élégant' }, { id: 'bold', label: 'Audacieux' },
  { id: 'colorful', label: 'Coloré' }, { id: 'dark', label: 'Sombre' }, { id: 'corporate', label: 'Corporate' }
];

// brand, accent, ink (text on background), background
const PALETTES = {
  grayLight: ['#9ca3af', '#e2e8f0', '#1e293b', '#f8fafc'],
  grayDark: ['#374151', '#94a3b8', '#1e293b', '#111827'],
  brownDark: ['#78350f', '#d97706', '#fbbf24', '#fef3c7'],
  cream: ['#fef3c7', '#fef08a', '#1c1917', '#fffbeb'],
  forestGreen: ['#14532d', '#a3e635', '#14532d', '#f7fee7'],
  black: ['#000000', '#ffffff', '#ffffff', '#000000'],
  purple: ['#581c87', '#f0abfc', '#ffffff', '#2e1065'],
  bluePale: ['#0369a1', '#38bdf8', '#0c4a6e', '#f0f9ff'],
  blueDark: ['#1e3a8a', '#3b82f6', '#ffffff', '#0f172a'],
  yellow: ['#854d0e', '#fbbf24', '#1c1917', '#fef3c7']
};

const TXT = {
  business: { kicker: 'PROFESSIONNEL', title: 'Services\nexpert', body: 'Des solutions sur mesure pour votre entreprise.', items: ['Consulting', 'Stratégie', 'Développement', 'Formation'], cta: 'Contactez-nous', price: 'Sur devis', icon: 'Briefcase' },
  retail: { kicker: 'NOUVEAUTÉ', title: 'Collection\nété', body: 'Découvrez notre nouvelle collection de produits.', items: ['Vêtements', 'Accessoires', 'Promotions', 'Livraison'], cta: 'Acheter', price: '-30%', icon: 'ShoppingBag' },
  restaurant: { kicker: 'MENU SPÉCIAL', title: 'Saveurs\nauthentiques', body: 'Une cuisine maison avec des produits frais et locaux.', items: ['Entrée', 'Plat principal', 'Dessert', 'Boisson'], cta: 'Réserver', price: 'Menu du jour', icon: 'UtensilsCrossed' },
  real_estate: { kicker: 'À VENDRE', title: 'Propriété\nexclusive', body: 'Belle propriété avec terrain, proche commerces et écoles.', items: ['4 chambres', '2 salles de bain', '1500 m²', 'Garage'], cta: 'Visiter', price: '$850,000', icon: 'Home' },
  beauty: { kicker: 'INSTITUT', title: 'Soin\net détente', body: 'Soins visage, manucure et massages relaxants.', items: ['Soin visage', 'Manucure', 'Massage', 'Épilation'], cta: 'Prendre RDV', price: '-20%', icon: 'Sparkles' },
  services: { kicker: 'CABINET', title: 'Experts\nà votre service', body: 'Comptabilité, juridique et stratégie d\'entreprise.', items: ['Comptabilité', 'Juridique', 'Fiscalité', 'Conseil'], cta: 'Contacter', price: '1er RDV offert', icon: 'Users' },
  event: { kicker: 'SAMEDI 15', title: 'Grande\nsoirée', body: 'Une soirée mémorable avec vos proches.', items: ['Dîner', 'Musique', 'Danses', 'Cocktail'], cta: 'Réserver', price: '50 pers', icon: 'CalendarDays' },
  promo: { kicker: 'PROMO', title: 'Offre\nspéciale', title_body: 'Profitez de nos offres exclusives pour une durée limitée.', items: ['-50%', 'Livraison gratuite', 'Bonus cadeau', 'Service VIP'], cta: 'Profiter', price: 'Limité', icon: 'Tag' }
};

const onColor = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150 ? '#111111' : '#ffffff';
};

export function buildPocketCatalog(kit) {
  const { T, Sq, Ic, R, L, Img, Q, bg } = kit;
  const P = (c, x, y, w, h, d, fill, o = {}) => ({
    id: kit.newId(), rotation: o.rot || 0, opacity: o.opacity ?? 1, locked: false, hidden: false, name: '',
    type: 'path', d, vb: 24, fill, stroke: 'transparent', strokeWidth: 0, ...(o.gradient ? { gradient: o.gradient } : {}),
    x: x * c.w, y: y * c.h, w: w * c.w, h: h * c.h
  });
  const list = (c, x, y, w, items, color, accent, o = {}) => items.flatMap((it, i) => [
    Ic(c, x + 0.02, y + i * (o.gap || 0.055) + 0.012, 0.04, o.icon || 'CheckCircle2', accent, { sw: 2.2 }),
    T(c, x + 0.06, y + i * (o.gap || 0.055), w - 0.06, o.s || 0.032, it, { color, weight: 600, fit: true })
  ]);
  const cta = (c, x, y, w, text, fill, color) => [
    R(c, x, y, w, 0.065, fill, { r: 0.04 }),
    T(c, x, y + 0.017, w, 0.032, text, { color, weight: 800, align: 'center', upper: true, ls: 0.08, fit: true })
  ];
  const head = (s) => (s === 'elegant' ? { font: 'serif', weight: 700 } : s === 'bold' || s === 'dark' ? { font: 'impact', weight: 900, upper: true } : s === 'minimal' ? { font: 'system', weight: 300, upper: true, ls: 0.08 } : { font: 'sans', weight: 800 });

  const C = {
    minimal: (c, p, t, s) => ({
      background: bg(p[3]),
      elements: [
        Img(c, 0.07, 0.05, 0.86, 0.5),
        T(c, 0.07, 0.6, 0.86, 0.026, t.kicker, { color: p[0], weight: 400, ls: 0.3, fit: true }),
        T(c, 0.07, 0.645, 0.86, 0.06, t.title.replace('\n', ' '), { ...head('minimal'), color: p[2], fit: true }),
        L(c, 0.07, 0.74, 0.1, p[0], { t: 0.003 }),
        T(c, 0.07, 0.77, 0.6, 0.025, t.body, { color: p[2], lh: 1.5, opacity: 0.8 }),
        T(c, 0.07, 0.92, 0.6, 0.024, `${t.cta.toUpperCase()} — www.votresite.com`, { color: p[0], ls: 0.1, fit: true }),
        T(c, 0.66, 0.9, 0.27, 0.045, t.price, { color: p[0], weight: 300, align: 'right', fit: true })
      ]
    }),
    elegant: (c, p, t, s) => ({
      background: bg(p[3]),
      elements: [
        Img(c, 0.18, 0.08, 0.64, 0.46, { r: 0.32 }),
        Sq(c, 0.82, 0.1, 0.16, p[1], { shape: 'ellipse', opacity: 0.6 }),
        T(c, 0.1, 0.59, 0.8, 0.028, t.kicker, { color: p[0], weight: 700, ls: 0.25, align: 'center', fit: true }),
        T(c, 0.08, 0.64, 0.84, 0.065, t.title.replace('\n', ' '), { font: 'serif', weight: 700, italic: true, color: p[2], align: 'center', fit: true }),
        T(c, 0.12, 0.74, 0.76, 0.026, t.body, { color: p[2], align: 'center', lh: 1.45, opacity: 0.85 }),
        ...cta(c, 0.3, 0.84, 0.4, t.cta, p[0], '#ffffff'),
        T(c, 0.1, 0.93, 0.8, 0.024, 'www.votresite.com · 01 23 45 67 89', { color: p[0], align: 'center', fit: true })
      ]
    }),
    bold: (c, p, t, s) => ({
      background: bg(p[0]),
      elements: [
        T(c, 0.07, 0.1, 0.86, 0.04, t.kicker, { color: p[1], weight: 900, ls: 0.25, fit: true }),
        T(c, 0.07, 0.18, 0.86, 0.12, t.title, { ...head('bold'), color: '#ffffff', lh: 1 }),
        Img(c, 0.07, 0.45, 0.86, 0.3, { r: 0.03 }),
        T(c, 0.07, 0.6, 0.7, 0.03, t.body, { color: '#ffffff', lh: 1.45, opacity: 0.85 }),
        R(c, 0.07, 0.92, 0.5, p[1], { r: 0.04 }),
        T(c, 0.12, 0.945, 0.5, 0.028, t.cta, { color: '#ffffff', weight: 800, upper: true, fit: true })
      ]
    }),
    splitPhoto: (c, p, t, s) => ({
      background: bg(p[0]),
      elements: [
        Img(c, 0, 0, 0.5, 1),
        T(c, 0.55, 0.1, 0.4, 0.028, t.kicker, { color: p[1], weight: 700, ls: 0.18, fit: true }),
        T(c, 0.55, 0.16, 0.4, 0.075, t.title, { ...head(s), color: '#ffffff', lh: 1.05 }),
        T(c, 0.55, 0.42, 0.4, 0.026, t.body, { color: '#ffffff', lh: 1.45, opacity: 0.85 }),
        ...list(c, 0.55, 0.58, 0.4, t.items, '#ffffff', p[1], { s: 0.027, gap: 0.05 }),
        Sq(c, 0.5, 0.5, 0.2, p[1], { shape: 'ellipse' }),
        T(c, 0.42, 0.485, 0.16, 0.035, t.price, { color: onColor(p[1]), weight: 900, align: 'center', fit: true }),
        ...cta(c, 0.55, 0.86, 0.38, t.cta, p[1], onColor(p[1]))
      ]
    }),
    corporate: (c, p, t, s) => ({
      background: bg(p[3]),
      elements: [
        R(c, 0.05, 0.03, 0.9, 0.94, 'transparent', { stroke: p[1], sw: 0.004 }),
        Ic(c, 0.5, 0.1, 0.07, t.icon, p[1], { sw: 1.8 }),
        T(c, 0.1, 0.15, 0.8, 0.03, t.kicker, { color: p[1], weight: 700, ls: 0.25, align: 'center', fit: true }),
        T(c, 0.1, 0.2, 0.8, 0.08, t.title, { ...head('elegant'), color: p[3] === '#000000' ? '#ffffff' : p[0], align: 'center', fit: true }),
        Img(c, 0.12, 0.33, 0.76, 0.22, { r: 0.02 }),
        ...t.items.flatMap((it, i) => {
          const [label, price] = it.split(' · ');
          const color = p[3] === '#000000' ? '#f5f5f4' : p[2];
          return [
            T(c, 0.12, 0.6 + i * 0.065, 0.55, 0.032, label, { color, weight: 600, fit: true }),
            L(c, 0.5, 0.62 + i * 0.065, 0.22, p[1], { t: 0.002, dash: true }),
            T(c, 0.72, 0.6 + i * 0.065, 0.16, 0.032, price || '', { color: p[1], weight: 700, align: 'right', fit: true })
          ];
        }),
        T(c, 0.1, 0.9, 0.8, 0.026, `${t.cta} · 01 23 45 67 89`, { color: p[1], align: 'center', weight: 600, fit: true })
      ]
    })
  };

  // Generate pocket templates based on uses and styles
  const templates = [];
  let templateId = 0;

  Object.keys(TXT).forEach((use) => {
    POCKET_STYLES.forEach((style) => {
      const paletteKey = Object.keys(PALETTES)[templateId % Object.keys(PALETTES).length];
      const palette = PALETTES[paletteKey];
      templates.push({
        id: `pocket-${use}-${style}-${templateId}`,
        name: `${TXT[use].title.replace('\n', ' ')} - ${style.charAt(0).toUpperCase() + style.slice(1)}`,
        description: TXT[use].body,
        use: use,
        style: style,
        palette: paletteKey,
        composition: C[style] || C.minimal,
        isPremium: false
      });
      templateId++;
    });
  });

  return templates;
}
