// src/design/templates.js
// Template library. Templates are expressed relative to the page (fractions of
// width / height, sizes relative to the shortest side) so one template adapts
// to every format of a module.
import { newId } from './shared/sanitize.js';
import { sanitizeDesignData } from './shared/sanitize.js';
import { fitText } from './engine/factory';
import { measure } from './engine/text';
import { buildLogoCatalog, LOGO_STYLE_CATS, LOGO_INDUSTRY_CATS } from './logoCatalog.js';
import { buildFlyerCatalog, FLYER_USES, FLYER_STYLES } from './flyerCatalog.js';

// ---------- relative element helpers ----------
const base = () => ({ id: newId(), rotation: 0, opacity: 1, locked: false, hidden: false, name: '' });

function T(c, x, y, w, s, text, o = {}) {
  const el = Tx(c, x, y, w, s, text, o);
  if (!o.fit) return el;
  // Shrink single-line texts (brand names) so they never wrap.
  const shown = el.uppercase ? text.toUpperCase() : text;
  const width = measure(el, shown, el.size);
  if (width <= el.w * 0.98) return el;
  const size = (el.size * el.w * 0.98) / width;
  return { ...el, size, h: size, y: el.y + (el.size - size) / 2 };
}

function Tx(c, x, y, w, s, text, o = {}) {
  return {
    ...base(), type: 'text', text, font: o.font || c.font || 'sans', size: s * c.u, weight: o.weight || 400,
    italic: Boolean(o.italic), underline: false, uppercase: Boolean(o.upper), align: o.align || 'left',
    color: o.color || c.ink, lineHeight: o.lh || 1.2, letterSpacing: o.ls || 0,
    x: x * c.w, y: y * c.h, w: w * c.w, h: s * c.u, opacity: o.opacity ?? 1, rotation: o.rot || 0
  };
}
function R(c, x, y, w, h, fill, o = {}) {
  return { ...base(), type: o.shape || 'rect', fill, stroke: o.stroke || 'transparent', strokeWidth: (o.sw || 0) * c.u, radius: (o.r || 0) * c.u, points: o.points || 5, innerRatio: o.inner || 0.45, x: x * c.w, y: y * c.h, w: w * c.w, h: h * c.h, opacity: o.opacity ?? 1, rotation: o.rot || 0 };
}
/** Square-ish shape centred at (cx, cy) with size in units of the short side. */
function Sq(c, cx, cy, size, fill, o = {}) {
  const s = size * c.u;
  return { ...R(c, 0, 0, 0, 0, fill, o), x: cx * c.w - s / 2, y: cy * c.h - s / 2, w: s, h: s };
}
function Ic(c, cx, cy, size, icon, color, o = {}) {
  const s = size * c.u;
  return { ...base(), type: 'icon', icon, color, strokeWidth: o.sw || 2, fill: o.fill || 'transparent', x: cx * c.w - s / 2, y: cy * c.h - s / 2, w: s, h: s, opacity: o.opacity ?? 1 };
}
function L(c, x, y, w, color, o = {}) {
  const t = (o.t || 0.006) * c.u;
  return { ...base(), type: 'line', stroke: color, strokeWidth: t, dash: Boolean(o.dash), x: x * c.w, y: y * c.h - t * 1.5, w: w * c.w, h: t * 3 };
}
function Img(c, x, y, w, h, o = {}) {
  return { ...base(), type: 'image', src: '', fit: 'cover', radius: (o.r || 0) * c.u, x: x * c.w, y: y * c.h, w: w * c.w, h: h * c.h };
}
function ImgSq(c, cx, cy, size, o = {}) {
  const s = size * c.u;
  return { ...Img(c, 0, 0, 0, 0, o), x: cx * c.w - s / 2, y: cy * c.h - s / 2, w: s, h: s };
}
function Q(c, cx, cy, size, value, o = {}) {
  const s = size * c.u;
  return { ...base(), type: 'qr', value, color: o.color || '#000000', background: o.bg || '#ffffff', x: cx * c.w - s / 2, y: cy * c.h - s / 2, w: s, h: s };
}
const bg = (color, gradient) => (gradient ? { color, gradient } : { color });
const grad = (from, to, angle = 135) => ({ from, to, angle });

// ---------- generic templates (flyers, posters, social, other) ----------
const GENERIC = [
  {
    id: 'bold-promo', name: 'Promo audacieuse', tags: ['promotion', 'commerce', 'moderne'],
    palette: { brand: '#4f46e5', accent: '#facc15', ink: '#ffffff' },
    build: (c) => [{
      background: bg(c.brand, grad(c.brand, '#1e1b4b', 160)),
      elements: [
        Sq(c, 0.92, 0.08, 0.5, c.accent, { shape: 'ellipse', opacity: 0.9 }),
        Sq(c, 0.05, 0.95, 0.35, '#ffffff', { shape: 'ellipse', opacity: 0.12 }),
        T(c, 0.08, 0.14, 0.84, 0.045, 'OFFRE SPÉCIALE', { weight: 700, ls: 0.2, color: c.accent }),
        T(c, 0.08, 0.24, 0.84, 0.14, 'Votre titre\nqui accroche', { weight: 800, lh: 1.05 }),
        T(c, 0.08, 0.56, 0.75, 0.04, 'Décrivez votre offre en une ou deux phrases claires pour donner envie.', { lh: 1.4, opacity: 0.9 }),
        R(c, 0.08, 0.76, 0.42, 0.09, c.accent, { r: 0.05 }),
        T(c, 0.08, 0.787, 0.42, 0.04, 'Je découvre', { weight: 700, align: 'center', color: '#111827' }),
        T(c, 0.08, 0.91, 0.84, 0.03, 'www.votresite.com', { opacity: 0.8 })
      ]
    }]
  },
  {
    id: 'event-night', name: 'Événement', tags: ['événement', 'concert', 'soirée', 'sombre'],
    palette: { brand: '#ec4899', accent: '#22d3ee', ink: '#ffffff' },
    build: (c) => [{
      background: bg('#0f172a', grad('#0f172a', '#581c87', 200)),
      elements: [
        Sq(c, 0.5, 0.33, 0.62, c.brand, { shape: 'ellipse', opacity: 0.35 }),
        Sq(c, 0.62, 0.28, 0.4, c.accent, { shape: 'ellipse', opacity: 0.3 }),
        T(c, 0.08, 0.1, 0.84, 0.045, 'SAMEDI 14 JUIN · 20H', { weight: 700, align: 'center', ls: 0.15, color: c.accent }),
        T(c, 0.06, 0.6, 0.88, 0.13, 'NOM DE\nL’ÉVÉNEMENT', { weight: 900, align: 'center', lh: 1, font: 'impact' }),
        L(c, 0.35, 0.86, 0.3, c.brand, { t: 0.008 }),
        T(c, 0.08, 0.89, 0.84, 0.035, 'Lieu · Ville · Billets sur votresite.com', { align: 'center', opacity: 0.85 })
      ]
    }]
  },
  {
    id: 'photo-clean', name: 'Photo épurée', tags: ['minimaliste', 'photo', 'élégant'],
    palette: { brand: '#0f766e', accent: '#f59e0b', ink: '#111827' },
    build: (c) => [{
      background: bg('#ffffff'),
      elements: [
        Img(c, 0, 0, 1, 0.55),
        T(c, 0.08, 0.6, 0.84, 0.03, 'NOUVEAUTÉ', { weight: 700, ls: 0.25, color: c.brand }),
        T(c, 0.08, 0.65, 0.84, 0.085, 'Un titre simple et élégant', { weight: 700, font: 'serif', lh: 1.1 }),
        L(c, 0.08, 0.82, 0.15, c.accent, { t: 0.008 }),
        T(c, 0.08, 0.85, 0.84, 0.032, 'Ajoutez ici une description courte, vos horaires ou vos coordonnées.', { lh: 1.4, color: '#4b5563' })
      ]
    }]
  },
  {
    id: 'sale-burst', name: 'Soldes', tags: ['soldes', 'réduction', 'commerce', 'ludique'],
    palette: { brand: '#dc2626', accent: '#fde047', ink: '#111827' },
    build: (c) => [{
      background: bg(c.accent),
      elements: [
        Sq(c, 0.5, 0.42, 0.72, c.brand, { shape: 'star', points: 14, inner: 0.82 }),
        T(c, 0.2, 0.3, 0.6, 0.075, 'SOLDES', { weight: 900, align: 'center', color: '#ffffff', font: 'impact' }),
        T(c, 0.2, 0.39, 0.6, 0.15, '-50%', { weight: 900, align: 'center', color: '#ffffff', font: 'impact' }),
        T(c, 0.08, 0.8, 0.84, 0.05, 'Sur toute la boutique', { weight: 700, align: 'center' }),
        T(c, 0.08, 0.88, 0.84, 0.032, 'Du 1er au 15 · En magasin et en ligne', { align: 'center' })
      ]
    }]
  },
  {
    id: 'quote-card', name: 'Citation', tags: ['citation', 'inspiration', 'minimaliste'],
    palette: { brand: '#f5f0e8', accent: '#b45309', ink: '#1f2937' },
    build: (c) => [{
      background: bg(c.brand),
      elements: [
        Ic(c, 0.5, 0.25, 0.14, 'Quote', c.accent, { sw: 1.5 }),
        T(c, 0.1, 0.38, 0.8, 0.06, '« La créativité, c’est l’intelligence qui s’amuse. »', { align: 'center', font: 'serif', italic: true, lh: 1.3 }),
        L(c, 0.42, 0.7, 0.16, c.accent),
        T(c, 0.1, 0.74, 0.8, 0.032, 'ALBERT EINSTEIN', { align: 'center', weight: 700, ls: 0.2, color: c.accent })
      ]
    }]
  },
  {
    id: 'split-band', name: 'Bandeau latéral', tags: ['entreprise', 'corporate', 'moderne'],
    palette: { brand: '#1d4ed8', accent: '#38bdf8', ink: '#0f172a' },
    build: (c) => [{
      background: bg('#ffffff'),
      elements: [
        R(c, 0, 0, 0.36, 1, c.brand),
        R(c, 0.36, 0, 0.02, 1, c.accent),
        Ic(c, 0.18, 0.16, 0.14, 'Briefcase', '#ffffff', { sw: 1.5 }),
        T(c, 0.03, 0.85, 0.3, 0.03, 'VOTRE ENTREPRISE', { color: '#ffffff', weight: 700, align: 'center', ls: 0.1 }),
        T(c, 0.44, 0.14, 0.5, 0.09, 'Des solutions sur mesure', { weight: 800, lh: 1.1 }),
        T(c, 0.44, 0.42, 0.5, 0.032, '• Premier argument clé\n• Deuxième argument\n• Troisième argument', { lh: 1.8, color: '#334155' }),
        R(c, 0.44, 0.74, 0.46, 0.002, '#cbd5e1'),
        T(c, 0.44, 0.78, 0.5, 0.03, '01 23 45 67 89\ncontact@entreprise.com', { lh: 1.6, color: '#334155' })
      ]
    }]
  }
];

// ---------- pocket folders ----------
const POCKETS = [
  {
    id: 'pocket-corporate', name: 'Corporate', tags: ['entreprise', 'moderne'],
    palette: { brand: '#1e3a8a', accent: '#38bdf8', ink: '#0f172a' },
    build: (c) => [
      { background: bg(c.brand, grad(c.brand, '#0f172a', 160)), elements: [
        R(c, 0, 0.62, 1, 0.012, c.accent),
        Sq(c, 0.5, 0.3, 0.3, '#ffffff', { shape: 'ellipse', opacity: 0.1 }),
        Ic(c, 0.5, 0.3, 0.16, 'Building2', '#ffffff', { sw: 1.4 }),
        T(c, 0.1, 0.45, 0.8, 0.07, 'VOTRE SOCIÉTÉ', { weight: 800, align: 'center', color: '#ffffff', ls: 0.08 }),
        T(c, 0.1, 0.53, 0.8, 0.035, 'Votre slogan ici', { align: 'center', color: c.accent }),
        T(c, 0.1, 0.88, 0.8, 0.03, 'www.votresociete.com', { align: 'center', color: '#ffffff', opacity: 0.8 })
      ] },
      { background: bg('#ffffff'), elements: [
        R(c, 0, 0.9, 1, 0.1, c.brand),
        T(c, 0.1, 0.62, 0.8, 0.04, 'Nous contacter', { weight: 700, align: 'center' }),
        T(c, 0.1, 0.68, 0.8, 0.03, '12 rue de l’Exemple, 75000 Paris\n01 23 45 67 89 · contact@societe.com', { align: 'center', lh: 1.6, color: '#475569' }),
        Q(c, 0.5, 0.45, 0.22, 'https://macarte.app')
      ] },
      { background: bg('#f8fafc'), elements: [
        T(c, 0.12, 0.12, 0.76, 0.06, 'Bienvenue', { weight: 800, color: c.brand }),
        L(c, 0.12, 0.22, 0.15, c.accent, { t: 0.01 }),
        T(c, 0.12, 0.26, 0.76, 0.03, 'Présentez votre entreprise, vos valeurs et vos engagements. Ce panneau est visible à l’ouverture de la pochette.', { lh: 1.6, color: '#334155' })
      ] },
      { background: bg('#ffffff'), elements: [
        R(c, 0, 0.68, 1, 0.32, c.brand),
        T(c, 0.1, 0.75, 0.8, 0.035, 'Vos documents', { color: '#ffffff', weight: 700, align: 'center' }),
        R(c, 0.38, 0.85, 0.24, 0.05, '#ffffff', { r: 0.01, opacity: 0.25 }),
        T(c, 0.38, 0.858, 0.24, 0.022, 'Fente carte de visite', { color: '#ffffff', align: 'center' })
      ] }
    ]
  },
  {
    id: 'pocket-elegant', name: 'Élégant', tags: ['luxe', 'élégant'],
    palette: { brand: '#111827', accent: '#d4a373', ink: '#111827' },
    build: (c) => [
      { background: bg(c.brand), elements: [
        R(c, 0.08, 0.06, 0.84, 0.88, 'transparent', { stroke: c.accent, sw: 0.004 }),
        T(c, 0.1, 0.4, 0.8, 0.08, 'Maison Exemple', { font: 'serif', align: 'center', color: c.accent, italic: true }),
        L(c, 0.4, 0.52, 0.2, c.accent, { t: 0.003 }),
        T(c, 0.1, 0.55, 0.8, 0.028, 'DEPUIS 1990', { align: 'center', color: '#e5e7eb', ls: 0.3 })
      ] },
      { background: bg(c.brand), elements: [
        T(c, 0.1, 0.8, 0.8, 0.026, 'maison-exemple.fr', { align: 'center', color: c.accent, ls: 0.1 })
      ] },
      { background: bg('#faf7f2'), elements: [
        T(c, 0.12, 0.15, 0.76, 0.05, 'Notre savoir-faire', { font: 'serif', color: c.brand }),
        T(c, 0.12, 0.24, 0.76, 0.03, 'Un texte de présentation raffiné.', { lh: 1.6, color: '#57534e' })
      ] },
      { background: bg('#faf7f2'), elements: [R(c, 0, 0.68, 1, 0.32, c.accent)] }
    ]
  }
];

// ---------- logos (generator) ----------
export const LOGO_SECTORS = [
  { id: 'restaurant', label: 'Restauration', icons: ['ChefHat', 'Coffee', 'UtensilsCrossed', 'Pizza'], colors: ['#b91c1c', '#f59e0b'] },
  { id: 'tech', label: 'Technologie', icons: ['Cpu', 'Code', 'Rocket', 'Bot'], colors: ['#4f46e5', '#06b6d4'] },
  { id: 'health', label: 'Santé', icons: ['HeartPulse', 'Stethoscope', 'Activity', 'Pill'], colors: ['#0d9488', '#22c55e'] },
  { id: 'realestate', label: 'Immobilier', icons: ['Home', 'Building2', 'Key', 'MapPin'], colors: ['#1e3a8a', '#f59e0b'] },
  { id: 'beauty', label: 'Beauté & bien-être', icons: ['Flower2', 'Sparkles', 'Brush', 'Scissors'], colors: ['#db2777', '#a855f7'] },
  { id: 'construction', label: 'Bâtiment', icons: ['Hammer', 'Wrench', 'Building', 'Paintbrush'], colors: ['#ea580c', '#1f2937'] },
  { id: 'nature', label: 'Nature & jardin', icons: ['Leaf', 'Sprout', 'TreePine', 'Flower'], colors: ['#15803d', '#84cc16'] },
  { id: 'education', label: 'Éducation', icons: ['GraduationCap', 'BookOpen', 'Lightbulb', 'PenTool'], colors: ['#2563eb', '#facc15'] },
  { id: 'finance', label: 'Finance & conseil', icons: ['TrendingUp', 'BarChart', 'Shield', 'Briefcase'], colors: ['#0f172a', '#10b981'] },
  { id: 'sport', label: 'Sport', icons: ['Dumbbell', 'Bike', 'Activity', 'Award'], colors: ['#dc2626', '#111827'] },
  { id: 'fashion', label: 'Mode', icons: ['ShoppingBag', 'Gem', 'Crown', 'Tag'], colors: ['#111827', '#d4a373'] },
  { id: 'transport', label: 'Transport & logistique', icons: ['Truck', 'Package', 'Plane', 'Car'], colors: ['#0369a1', '#f97316'] },
  { id: 'animals', label: 'Animaux', icons: ['Dog', 'Cat', 'Bone', 'Fish'], colors: ['#92400e', '#16a34a'] },
  { id: 'music', label: 'Musique & médias', icons: ['Music', 'Headphones', 'Mic', 'Camera'], colors: ['#7c3aed', '#ec4899'] }
];

export const LOGO_STYLES = [
  { id: 'modern', label: 'Moderne', font: 'sans', weight: 700, upper: false, ls: 0 },
  { id: 'elegant', label: 'Élégant', font: 'serif', weight: 400, upper: false, ls: 0.02, italic: true },
  { id: 'minimal', label: 'Minimaliste', font: 'system', weight: 300, upper: true, ls: 0.25 },
  { id: 'bold', label: 'Audacieux', font: 'impact', weight: 900, upper: true, ls: 0.03 },
  { id: 'playful', label: 'Ludique', font: 'trebuchet', weight: 700, upper: false, ls: 0 },
  { id: 'vintage', label: 'Vintage', font: 'palatino', weight: 700, upper: true, ls: 0.12 }
];

const LOGO_LAYOUTS = [
  {
    id: 'icon-left', name: 'Icône + nom',
    build: (c, o) => [
      Sq(c, 0.23, 0.5, 0.4, o.c1, { shape: o.shape, r: 0.09 }),
      Ic(c, 0.23, 0.5, 0.23, o.icon, '#ffffff', { sw: 1.8 }),
      T(c, 0.47, 0.38, 0.5, 0.15, o.name, { fit: true, font: o.font, weight: o.weight, upper: o.upper, ls: o.ls, italic: o.italic, color: o.ink }),
      T(c, 0.475, 0.56, 0.5, 0.06, o.slogan, { fit: true, font: 'sans', color: o.c2, ls: 0.12, upper: true, weight: 600 })
    ]
  },
  {
    id: 'stacked', name: 'Empilé',
    build: (c, o) => [
      Ic(c, 0.5, 0.3, 0.3, o.icon, o.c1, { sw: 1.6 }),
      T(c, 0.05, 0.52, 0.9, 0.13, o.name, { fit: true, font: o.font, weight: o.weight, upper: o.upper, ls: o.ls, italic: o.italic, align: 'center', color: o.ink }),
      L(c, 0.42, 0.72, 0.16, o.c2, { t: 0.008 }),
      T(c, 0.05, 0.76, 0.9, 0.05, o.slogan, { fit: true, align: 'center', color: o.c2, ls: 0.2, upper: true, weight: 600 })
    ]
  },
  {
    id: 'badge', name: 'Badge rond',
    build: (c, o) => [
      Sq(c, 0.5, 0.5, 0.86, o.c1, { shape: 'ellipse' }),
      Sq(c, 0.5, 0.5, 0.76, 'transparent', { shape: 'ellipse', stroke: '#ffffff', sw: 0.012 }),
      Ic(c, 0.5, 0.34, 0.2, o.icon, '#ffffff', { sw: 1.8 }),
      T(c, 0.15, 0.47, 0.7, 0.1, o.name, { fit: true, font: o.font, weight: o.weight, upper: o.upper, ls: o.ls, italic: o.italic, align: 'center', color: '#ffffff' }),
      T(c, 0.2, 0.62, 0.6, 0.045, o.slogan, { fit: true, align: 'center', color: '#ffffff', ls: 0.2, upper: true, opacity: 0.85 })
    ]
  },
  {
    id: 'monogram', name: 'Monogramme',
    build: (c, o) => [
      Sq(c, 0.5, 0.4, 0.5, o.c1, { r: 0.12, shape: o.shape === 'ellipse' ? 'ellipse' : 'rect' }),
      T(c, 0.25, 0.25, 0.5, 0.28, o.initials, { fit: true, font: o.font, weight: 800, align: 'center', color: '#ffffff' }),
      T(c, 0.05, 0.72, 0.9, 0.09, o.name, { fit: true, font: o.font, weight: o.weight, upper: o.upper, ls: o.ls, italic: o.italic, align: 'center', color: o.ink })
    ]
  },
  {
    id: 'wordmark', name: 'Logotype',
    build: (c, o) => [
      T(c, 0.04, 0.36, 0.92, 0.18, o.name, { fit: true, font: o.font, weight: o.weight, upper: o.upper, ls: o.ls, italic: o.italic, align: 'center', color: o.ink }),
      R(c, 0.3, 0.6, 0.4, 0.012, o.c1),
      T(c, 0.04, 0.64, 0.92, 0.055, o.slogan, { fit: true, align: 'center', color: o.c2, ls: 0.25, upper: true, weight: 600 })
    ]
  },
  {
    id: 'emblem', name: 'Emblème',
    build: (c, o) => [
      Sq(c, 0.5, 0.38, 0.5, 'transparent', { shape: 'star', points: 12, inner: 0.86, stroke: o.c1, sw: 0.012 }),
      Ic(c, 0.5, 0.38, 0.2, o.icon, o.c1, { sw: 1.8 }),
      T(c, 0.05, 0.68, 0.9, 0.1, o.name, { fit: true, font: o.font, weight: o.weight, upper: o.upper, ls: o.ls, italic: o.italic, align: 'center', color: o.ink }),
      T(c, 0.05, 0.81, 0.9, 0.045, o.slogan, { fit: true, align: 'center', color: o.c2, ls: 0.2, upper: true })
    ]
  }
];

function initials(name) {
  return String(name || 'M').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'M';
}

/** Generate logo proposals for a brand name / sector / style. */
export function generateLogoProposals({ name, slogan, sector, style, color }) {
  const sec = LOGO_SECTORS.find((s) => s.id === sector) || LOGO_SECTORS[1];
  const sty = LOGO_STYLES.find((s) => s.id === style) || LOGO_STYLES[0];
  const proposals = [];
  LOGO_LAYOUTS.forEach((layout, li) => {
    sec.icons.slice(0, 2).forEach((icon, ii) => {
      const c1 = color || sec.colors[ii % 2 === 0 ? 0 : 1];
      proposals.push({
        id: `logo-${layout.id}-${icon}`,
        name: `${layout.name} · ${icon}`,
        tags: [sec.label, sty.label, layout.name],
        sector: sec.id,
        style: sty.id,
        build: (c) => [{
          background: bg('transparent'),
          elements: layout.build(c, {
            name: name || 'Mon Entreprise', slogan: slogan || 'Votre slogan', initials: initials(name),
            icon, c1, c2: sec.colors[ii % 2 === 0 ? 1 : 0], ink: '#111827',
            font: sty.font, weight: sty.weight, upper: sty.upper, ls: sty.ls, italic: sty.italic,
            shape: (li + ii) % 2 ? 'ellipse' : 'rect'
          })
        }]
      });
    });
  });
  return proposals;
}

const LOGO_TEMPLATES = LOGO_SECTORS.slice(0, 12).map((sec, i) => {
  const sty = LOGO_STYLES[i % LOGO_STYLES.length];
  const props = generateLogoProposals({ name: sec.label.split(' ')[0], slogan: 'Depuis 2024', sector: sec.id, style: sty.id });
  return { ...props[(i * 3) % props.length], id: `logo-tpl-${sec.id}`, name: `${sec.label} · ${sty.label}` };
});

const LOGO_CATALOG = buildLogoCatalog({ T, Sq, Ic, R, L, bg, initials, newId });
const FLYER_CATALOG = buildFlyerCatalog({ T, Sq, Ic, R, L, Img, Q, bg, newId });

// ---------- "other" kinds ----------
const OTHER = {
  'email-signature': [{
    id: 'sig-classic', name: 'Signature classique', tags: ['email'],
    build: (c) => [{ background: bg('#ffffff'), elements: [
      ImgSq(c, 0.13, 0.5, 0.72, { r: 0.36 }),
      R(c, 0.26, 0.15, 0.004, 0.7, '#4f46e5'),
      T(c, 0.29, 0.13, 0.68, 0.17, 'Prénom Nom', { weight: 700, color: '#111827' }),
      T(c, 0.29, 0.34, 0.68, 0.11, 'Fonction · Entreprise', { color: '#4f46e5', weight: 600 }),
      T(c, 0.29, 0.55, 0.68, 0.1, '01 23 45 67 89  ·  prenom@entreprise.com\nwww.entreprise.com', { color: '#4b5563', lh: 1.5 })
    ] }]
  }],
  'qr-code': [{
    id: 'qr-frame', name: 'Scannez-moi', tags: ['qr'],
    build: (c) => [{ background: bg('#ffffff'), elements: [
      R(c, 0.1, 0.06, 0.8, 0.88, '#4f46e5', { r: 0.06 }),
      Q(c, 0.5, 0.42, 0.6, 'https://macarte.app', { color: '#111827' }),
      T(c, 0.1, 0.78, 0.8, 0.08, 'SCANNEZ-MOI', { weight: 800, align: 'center', color: '#ffffff', ls: 0.15 })
    ] }]
  }],
  postcard: [{
    id: 'postcard-travel', name: 'Souvenir', tags: ['voyage'],
    build: (c) => [
      { background: bg('#ffffff'), elements: [Img(c, 0, 0, 1, 1), T(c, 0.06, 0.78, 0.88, 0.12, 'Bons baisers !', { font: 'script', color: '#ffffff', weight: 700 })] },
      { background: bg('#ffffff'), elements: [
        R(c, 0.52, 0.1, 0.002, 0.8, '#9ca3af'),
        T(c, 0.06, 0.1, 0.42, 0.055, 'Votre message…', { font: 'script', color: '#374151', lh: 1.5 }),
        R(c, 0.8, 0.08, 0.13, 0.2, 'transparent', { stroke: '#9ca3af', sw: 0.006 }),
        L(c, 0.56, 0.5, 0.38, '#9ca3af', { t: 0.004 }), L(c, 0.56, 0.62, 0.38, '#9ca3af', { t: 0.004 }), L(c, 0.56, 0.74, 0.38, '#9ca3af', { t: 0.004 })
      ] }
    ]
  }],
  'thank-you': [{
    id: 'thanks-soft', name: 'Merci', tags: ['remerciement'],
    build: (c) => [
      { background: bg('#fdf2f8'), elements: [Ic(c, 0.5, 0.32, 0.22, 'Heart', '#db2777', { fill: '#fbcfe8', sw: 1.5 }), T(c, 0.08, 0.5, 0.84, 0.16, 'Merci !', { font: 'script', align: 'center', color: '#9d174d' }), T(c, 0.1, 0.72, 0.8, 0.05, 'pour votre confiance', { align: 'center', color: '#be185d' })] },
      { background: bg('#ffffff'), elements: [T(c, 0.1, 0.4, 0.8, 0.05, 'Un petit mot personnalisé…', { align: 'center', font: 'serif', italic: true, color: '#6b7280' })] }
    ]
  }],
  invitation: [{
    id: 'invite-gold', name: 'Invitation dorée', tags: ['mariage', 'anniversaire'],
    build: (c) => [
      { background: bg('#111827'), elements: [
        R(c, 0.06, 0.05, 0.88, 0.9, 'transparent', { stroke: '#d4a373', sw: 0.006 }),
        T(c, 0.1, 0.18, 0.8, 0.04, 'VOUS ÊTES INVITÉ·E', { align: 'center', color: '#d4a373', ls: 0.3 }),
        T(c, 0.08, 0.32, 0.84, 0.13, 'Camille\n& Alex', { align: 'center', font: 'script', color: '#ffffff', lh: 1.1 }),
        L(c, 0.4, 0.66, 0.2, '#d4a373', { t: 0.004 }),
        T(c, 0.1, 0.7, 0.8, 0.045, 'Samedi 21 septembre 2025\n15h · Château de l’Exemple', { align: 'center', color: '#e5e7eb', lh: 1.6 })
      ] },
      { background: bg('#faf7f2'), elements: [T(c, 0.1, 0.4, 0.8, 0.045, 'Merci de confirmer votre présence avant le 1er août.', { align: 'center', color: '#374151', lh: 1.5 })] }
    ]
  }],
  'gift-certificate': [{
    id: 'gift-classic', name: 'Bon cadeau', tags: ['cadeau'],
    build: (c) => [{ background: bg('#fff7ed'), elements: [
      R(c, 0, 0, 0.3, 1, '#c2410c'),
      Ic(c, 0.15, 0.5, 0.45, 'Gift', '#ffffff', { sw: 1.4 }),
      T(c, 0.35, 0.12, 0.6, 0.15, 'BON CADEAU', { weight: 800, color: '#9a3412', ls: 0.1 }),
      T(c, 0.35, 0.36, 0.6, 0.25, '50 €', { weight: 900, color: '#c2410c' }),
      T(c, 0.35, 0.7, 0.6, 0.07, 'Offert à : ______________\nValable jusqu’au : ________', { color: '#7c2d12', lh: 1.6 })
    ] }]
  }],
  presentation: [{
    id: 'slides-clean', name: 'Présentation claire', tags: ['présentation'],
    build: (c) => [
      { background: bg('#0f172a', grad('#1e1b4b', '#0f172a', 120)), elements: [
        T(c, 0.08, 0.36, 0.84, 0.12, 'Titre de la présentation', { weight: 800, color: '#ffffff' }),
        T(c, 0.08, 0.56, 0.84, 0.05, 'Sous-titre · Nom · Date', { color: '#a5b4fc' }),
        R(c, 0.08, 0.3, 0.08, 0.012, '#818cf8')
      ] },
      { background: bg('#ffffff'), elements: [
        T(c, 0.08, 0.1, 0.84, 0.08, 'Points clés', { weight: 700, color: '#111827' }),
        T(c, 0.08, 0.3, 0.5, 0.045, '• Premier point important\n• Deuxième point\n• Troisième point', { color: '#334155', lh: 1.8 }),
        Img(c, 0.62, 0.28, 0.3, 0.5, { r: 0.02 })
      ] }
    ]
  }],
  menu: [{
    id: 'menu-bistro', name: 'Bistrot', tags: ['restaurant'],
    build: (c) => [{ background: bg('#1c1917'), elements: [
      T(c, 0.08, 0.05, 0.84, 0.08, 'Le Bistrot', { font: 'script', align: 'center', color: '#fbbf24' }),
      T(c, 0.08, 0.13, 0.84, 0.025, 'CUISINE MAISON', { align: 'center', color: '#d6d3d1', ls: 0.3 }),
      ...[['ENTRÉES', 0.22], ['PLATS', 0.47], ['DESSERTS', 0.72]].flatMap(([label, y]) => [
        T(c, 0.1, y, 0.8, 0.035, label, { weight: 700, color: '#fbbf24', ls: 0.2 }),
        L(c, 0.1, y + 0.045, 0.8, '#57534e', { t: 0.002 }),
        T(c, 0.1, y + 0.06, 0.62, 0.026, 'Nom du plat\nNom du plat\nNom du plat', { color: '#f5f5f4', lh: 1.9 }),
        T(c, 0.72, y + 0.06, 0.18, 0.026, '12 €\n14 €\n9 €', { color: '#f5f5f4', align: 'right', lh: 1.9 })
      ])
    ] }]
  }],
  invoice: [{
    id: 'invoice-pro', name: 'Facture pro', tags: ['facture'],
    build: (c) => [{ background: bg('#ffffff'), elements: [
      T(c, 0.08, 0.06, 0.5, 0.06, 'FACTURE', { weight: 800, color: '#4f46e5' }),
      T(c, 0.6, 0.06, 0.32, 0.022, 'N° 2025-001\nDate : 01/01/2025\nÉchéance : 31/01/2025', { align: 'right', color: '#374151', lh: 1.6 }),
      T(c, 0.08, 0.18, 0.4, 0.022, 'Votre entreprise\nAdresse\nSIRET 000 000 000 00000', { color: '#374151', lh: 1.6 }),
      T(c, 0.55, 0.18, 0.37, 0.022, 'Client\nAdresse du client\nVille', { color: '#374151', lh: 1.6 }),
      R(c, 0.08, 0.32, 0.84, 0.04, '#eef2ff'),
      T(c, 0.1, 0.328, 0.5, 0.02, 'Description', { weight: 700 }),
      T(c, 0.6, 0.328, 0.1, 0.02, 'Qté', { weight: 700, align: 'right' }),
      T(c, 0.72, 0.328, 0.18, 0.02, 'Total', { weight: 700, align: 'right' }),
      T(c, 0.1, 0.38, 0.5, 0.02, 'Prestation 1\nPrestation 2\nPrestation 3', { lh: 2 }),
      T(c, 0.6, 0.38, 0.1, 0.02, '1\n2\n1', { lh: 2, align: 'right' }),
      T(c, 0.72, 0.38, 0.18, 0.02, '500,00 €\n300,00 €\n150,00 €', { lh: 2, align: 'right' }),
      L(c, 0.55, 0.52, 0.37, '#c7d2fe', { t: 0.003 }),
      T(c, 0.55, 0.54, 0.37, 0.026, 'Total TTC : 950,00 €', { weight: 800, align: 'right', color: '#4f46e5' }),
      T(c, 0.08, 0.88, 0.84, 0.018, 'Conditions de paiement : virement à 30 jours. IBAN FR76 0000 0000 0000.', { color: '#6b7280' })
    ] }]
  }],
  resume: [{
    id: 'cv-sidebar', name: 'CV moderne', tags: ['cv'],
    build: (c) => [{ background: bg('#ffffff'), elements: [
      R(c, 0, 0, 0.33, 1, '#1e293b'),
      ImgSq(c, 0.165, 0.12, 0.22, { r: 0.11 }),
      T(c, 0.03, 0.24, 0.27, 0.022, 'CONTACT', { color: '#94a3b8', weight: 700, ls: 0.2 }),
      T(c, 0.03, 0.27, 0.27, 0.018, '06 00 00 00 00\nnom@email.com\nVille, Pays', { color: '#e2e8f0', lh: 1.7 }),
      T(c, 0.03, 0.4, 0.27, 0.022, 'COMPÉTENCES', { color: '#94a3b8', weight: 700, ls: 0.2 }),
      T(c, 0.03, 0.43, 0.27, 0.018, 'Compétence 1\nCompétence 2\nCompétence 3', { color: '#e2e8f0', lh: 1.7 }),
      T(c, 0.38, 0.06, 0.56, 0.055, 'Prénom Nom', { weight: 800, color: '#0f172a' }),
      T(c, 0.38, 0.13, 0.56, 0.026, 'Intitulé du poste', { color: '#4f46e5', weight: 600 }),
      T(c, 0.38, 0.22, 0.56, 0.024, 'EXPÉRIENCE', { weight: 700, ls: 0.2, color: '#0f172a' }),
      T(c, 0.38, 0.26, 0.56, 0.018, 'Poste — Entreprise (2022 – aujourd’hui)\nDescription des missions et réalisations.\n\nPoste — Entreprise (2019 – 2022)\nDescription des missions et réalisations.', { color: '#334155', lh: 1.6 }),
      T(c, 0.38, 0.52, 0.56, 0.024, 'FORMATION', { weight: 700, ls: 0.2, color: '#0f172a' }),
      T(c, 0.38, 0.56, 0.56, 0.018, 'Diplôme — École (2019)', { color: '#334155', lh: 1.6 })
    ] }]
  }]
};
OTHER.banner = [{ ...GENERIC[5], id: 'banner-split' }, { ...GENERIC[0], id: 'banner-promo' }];
OTHER.illustration = [{
  id: 'illu-shapes', name: 'Composition géométrique', tags: ['illustration'],
  build: (c) => [{ background: bg('#fef3c7'), elements: [
    Sq(c, 0.35, 0.4, 0.5, '#f97316', { shape: 'ellipse' }),
    Sq(c, 0.6, 0.55, 0.45, '#0ea5e9', { shape: 'triangle', opacity: 0.85 }),
    Sq(c, 0.7, 0.3, 0.2, '#e11d48', { shape: 'star' }),
    R(c, 0, 0.8, 1, 0.2, '#14532d')
  ] }]
}];
OTHER.icon = [{
  id: 'icon-app', name: 'Icône d’application', tags: ['icône'],
  build: (c) => [{ background: bg('transparent'), elements: [
    Sq(c, 0.5, 0.5, 0.9, '#4f46e5', { r: 0.2 }),
    Ic(c, 0.5, 0.5, 0.5, 'Sparkles', '#ffffff', { sw: 1.8 })
  ] }]
}];
OTHER['zoom-background'] = [{
  id: 'zoom-office', name: 'Bureau sobre', tags: ['visio'],
  build: (c) => [{ background: bg('#e0e7ff', grad('#eef2ff', '#c7d2fe', 160)), elements: [
    Sq(c, 0.85, 0.2, 0.5, '#a5b4fc', { shape: 'ellipse', opacity: 0.4 }),
    T(c, 0.04, 0.88, 0.5, 0.04, 'VOTRE ENTREPRISE', { weight: 800, color: '#3730a3', ls: 0.15 })
  ] }]
}];
OTHER.video = [{
  id: 'video-promo', name: 'Promo en 3 scènes', tags: ['vidéo'],
  build: (c) => [
    { background: bg('#4f46e5', grad('#4f46e5', '#9333ea', 135)), elements: [T(c, 0.08, 0.4, 0.84, 0.12, 'Nouveau !', { weight: 900, align: 'center', color: '#ffffff' })] },
    { background: bg('#111827'), elements: [T(c, 0.08, 0.4, 0.84, 0.07, 'Découvrez notre offre exclusive', { weight: 700, align: 'center', color: '#ffffff' })] },
    { background: bg('#facc15'), elements: [T(c, 0.08, 0.4, 0.84, 0.08, 'www.votresite.com', { weight: 800, align: 'center', color: '#111827' })] }
  ]
}];

/** Templates available for a module / subtype. */
/** Style / industry filter lists for the template gallery of a module. */
export function getTemplateFilters(type) {
  if (type === 'logo') return { styles: LOGO_STYLE_CATS, industries: LOGO_INDUSTRY_CATS };
  if (type === 'flyer' || type === 'poster') return { styles: FLYER_STYLES, industries: FLYER_USES };
  return { styles: [], industries: [] };
}

export function getTemplates(type, subtype) {
  switch (type) {
    case 'pocket': return POCKETS;
    case 'logo': return [...LOGO_CATALOG, ...LOGO_TEMPLATES];
    case 'flyer':
    case 'poster': return [...FLYER_CATALOG, ...GENERIC];
    case 'social_design': return GENERIC;
    case 'other': return [...(OTHER[subtype] || []), ...GENERIC.slice(0, 2)];
    default: return GENERIC;
  }
}

/** Shapes and images touching the trim edge are pushed into the bleed for printing. */
function extendToBleed(el, doc) {
  const b = doc.bleed || 0;
  if (!b || el.type === 'text' || el.type === 'qr' || el.type === 'icon' || el.rotation) return el;
  const eps = Math.min(doc.width, doc.height) * 0.002;
  const out = { ...el };
  if (el.x <= eps) { out.x = el.x - b; out.w += b; }
  if (el.y <= eps) { out.y = el.y - b; out.h += b; }
  if (el.x + el.w >= doc.width - eps) out.w += b;
  if (el.y + el.h >= doc.height - eps) out.h += b;
  return out;
}

/** Apply a template to a document (keeps format, page ids and names). */
export function applyTemplate(doc, template, ctx = {}) {
  const c = {
    w: doc.width,
    h: doc.height,
    u: Math.min(doc.width, doc.height),
    brand: ctx.brand || template.palette?.brand || '#4f46e5',
    accent: ctx.accent || template.palette?.accent || '#f59e0b',
    ink: template.palette?.ink || '#111827'
  };
  const built = template.build(c, ctx);
  const pagesSource = built.length > doc.pages.length && (doc.pages.length === 1 || ctx.allowExtraPages)
    ? built
    : doc.pages;
  const pages = pagesSource.map((p, i) => {
    const existing = doc.pages[i];
    const src = built[i];
    return {
      id: existing ? existing.id : newId('pg'),
      name: existing ? existing.name : `Page ${i + 1}`,
      background: src ? { ...src.background, color: doc.transparent && src.background.color === '#ffffff' ? 'transparent' : src.background.color } : (existing ? existing.background : { color: '#ffffff' }),
      elements: src ? src.elements.map((el) => extendToBleed(fitText(el), doc)) : (existing ? existing.elements : [])
    };
  });
  return sanitizeDesignData({
    ...doc,
    pages,
    meta: { ...doc.meta, sector: template.sector || doc.meta.sector, style: template.style || doc.meta.style, brandColor: c.brand }
  }, { type: ctx.type, subtype: ctx.subtype });
}
