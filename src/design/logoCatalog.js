// src/design/logoCatalog.js
// Logo catalogue organised by style / symbol and by industry. Each entry pairs
// a composition with a symbol, palette and type style; every element stays
// editable (text, vector shapes with optional gradients, symbols).

export const LOGO_STYLE_CATS = [
  { id: '3d', label: '3D' }, { id: 'animal', label: 'Animal' }, { id: 'bird', label: 'Oiseau' },
  { id: 'camera', label: 'Caméra' }, { id: 'car', label: 'Voiture' }, { id: 'circle', label: 'Cercle' },
  { id: 'crown', label: 'Couronne' }, { id: 'eagle', label: 'Aigle' }, { id: 'fire', label: 'Feu' },
  { id: 'typography', label: 'Typographie' }, { id: 'heart', label: 'Cœur' }, { id: 'house', label: 'Maison' },
  { id: 'king', label: 'Roi' }, { id: 'leaf', label: 'Feuille' }, { id: 'letter', label: 'Lettre' },
  { id: 'mascot', label: 'Mascotte' }, { id: 'minimalist', label: 'Minimaliste' }, { id: 'modern', label: 'Moderne' },
  { id: 'queen', label: 'Reine' }, { id: 'shield', label: 'Bouclier' }, { id: 'easy', label: 'Facile' },
  { id: 'text', label: 'Texte' }, { id: 'tree', label: 'Arbre' }, { id: 'vintage', label: 'Vintage' }
];

export const LOGO_INDUSTRY_CATS = [
  { id: 'app', label: 'Application' }, { id: 'architecture', label: 'Architecture' }, { id: 'beauty', label: 'Beauté' },
  { id: 'brand', label: 'Marque' }, { id: 'business', label: 'Affaires' }, { id: 'company', label: 'Entreprise' },
  { id: 'construction', label: 'Construction' }, { id: 'dj', label: 'DJ' }, { id: 'doctor', label: 'Docteur' },
  { id: 'esports', label: 'Esports' }, { id: 'fashion', label: 'Mode' }, { id: 'fitness', label: 'Forme' },
  { id: 'food', label: 'Nourriture' }, { id: 'gaming', label: 'Jeux vidéo' }, { id: 'instagram', label: 'Instagram' },
  { id: 'medical', label: 'Médical' }, { id: 'music', label: 'Musique' }, { id: 'photography', label: 'Photographie' },
  { id: 'realestate', label: 'Immobilier' }, { id: 'restaurant', label: 'Restaurant' }, { id: 'social', label: 'Médias sociaux' },
  { id: 'sports', label: 'Sports' }
];

// Filled vector shapes (24×24 viewBox).
export const LOGO_SHAPES = {
  shield: 'M12 2 L21 5 V11 C21 16.5 17.2 20.7 12 22 C6.8 20.7 3 16.5 3 11 V5 Z',
  heart: 'M12 21 C5 16 2 12.5 2 8.5 C2 5.4 4.4 3 7.4 3 C9.2 3 10.9 3.9 12 5.3 C13.1 3.9 14.8 3 16.6 3 C19.6 3 22 5.4 22 8.5 C22 12.5 19 16 12 21 Z',
  crown: 'M2 18 L3.5 6.5 L8.5 11.5 L12 4 L15.5 11.5 L20.5 6.5 L22 18 Z',
  leaf: 'M20 3 C11 3 4 8 4 15 C4 18 6 21 9 21 C16 21 20 13 20 3 Z',
  house: 'M12 2.5 L22 11 H19 V21 H5 V11 H2 Z',
  flame: 'M12 2 C13 6 18 8.5 18 14 C18 18.4 15.3 22 12 22 C8.7 22 6 18.4 6 14.5 C6 11 8 9.5 9 7 C10 9 10.5 10 11.5 10.5 C11.5 7.5 11 5 12 2 Z',
  tree: 'M12 1.5 L19 11 H15.5 L20.5 17.5 H13.2 V22.5 H10.8 V17.5 H3.5 L8.5 11 H5 Z',
  bird: 'M2 12 C6 8 10 8 12 11 C14 6 18 4 22 5 C19 7 18 9 17 12 C15 17 9 19 4 17 C7 16 9 14 9 13 C7 13 4 13 2 12 Z',
  eagle: 'M12 7 L22 3 L18.5 9.5 L22.5 10.5 L16 14 L14 21 L12 17.5 L10 21 L8 14 L1.5 10.5 L5.5 9.5 L2 3 Z',
  car: 'M2.5 16 V12.5 L5.5 7 H18.5 L21.5 12.5 V16 H19 A2.6 2.6 0 0 0 13.8 16 H10.2 A2.6 2.6 0 0 0 5 16 Z',
  drop: 'M12 2 C15 7 19 10.5 19 15 A7 7 0 0 1 5 15 C5 10.5 9 7 12 2 Z',
  hex: 'M12 1.5 L21.5 7 V17 L12 22.5 L2.5 17 V7 Z',
  diamond: 'M6 3 H18 L22.5 9 L12 22 L1.5 9 Z',
  blob: 'M17.5 3.5 C21.5 6 22.5 12 20 16.5 C17.5 21 11 22.5 6.5 20 C2.5 17.5 1.5 11 4 7 C6.5 3 13.5 1 17.5 3.5 Z',
  burst: 'M12 1 L14.5 6.5 L20.5 4.5 L18.5 10 L23 12 L18.5 14 L20.5 19.5 L14.5 17.5 L12 23 L9.5 17.5 L3.5 19.5 L5.5 14 L1 12 L5.5 10 L3.5 4.5 L9.5 6.5 Z',
  arch: 'M3 22 V11 A9 9 0 0 1 21 11 V22 Z',
  cubeTop: 'M12 2 L21 7 L12 12 L3 7 Z',
  cubeLeft: 'M3 7 L12 12 V22 L3 17 Z',
  cubeRight: 'M21 7 L12 12 V22 L21 17 Z'
};

const PAL = {
  indigo: ['#4f46e5', '#ec4899', '#111827'], ocean: ['#0ea5e9', '#1e3a8a', '#0f172a'], sunset: ['#f97316', '#db2777', '#1f2937'],
  gold: ['#c9a227', '#7c5c12', '#1c1917'], royal: ['#6d28d9', '#f59e0b', '#1e1b4b'], forest: ['#15803d', '#84cc16', '#14532d'],
  fire: ['#ef4444', '#f59e0b', '#1f2937'], mint: ['#14b8a6', '#0ea5e9', '#134e4a'], noir: ['#111827', '#6b7280', '#111827'],
  rose: ['#db2777', '#f9a8d4', '#831843'], teal: ['#0f766e', '#f59e0b', '#0f172a'], neon: ['#22d3ee', '#a855f7', '#0b1020'],
  brick: ['#b45309', '#1f2937', '#1c1917'], steel: ['#1e3a5f', '#f59e0b', '#0f172a'], berry: ['#7c3aed', '#22d3ee', '#1f2937'],
  lime: ['#65a30d', '#facc15', '#1a2e05'], cherry: ['#be123c', '#fb7185', '#1f2937'], navyGold: ['#0b2545', '#d4b483', '#0b2545'],
  sky: ['#2563eb', '#38bdf8', '#0f172a'], coral: ['#f43f5e', '#fb923c', '#1f2937'], plum: ['#86198f', '#f0abfc', '#3b0764'],
  olive: ['#3f6212', '#d6b26e', '#1a2e05'], insta: ['#f58529', '#dd2a7b', '#1f2937'], esport: ['#e11d48', '#111827', '#111827']
};

const TYPE = {
  modern: { font: 'sans', weight: 700 }, bold: { font: 'impact', weight: 900, upper: true, ls: 0.03 },
  elegant: { font: 'serif', weight: 400, italic: true, ls: 0.02 }, minimal: { font: 'system', weight: 300, upper: true, ls: 0.25 },
  playful: { font: 'trebuchet', weight: 700 }, vintage: { font: 'palatino', weight: 700, upper: true, ls: 0.12 },
  classic: { font: 'serif', weight: 700, upper: true, ls: 0.1 }, wide: { font: 'sans', weight: 800, upper: true, ls: 0.18 }
};

// [composition, lucide symbol, filled shape, palette, type]
const S = {
  '3d': [['cube3d', 'Box', 'hex', 'indigo', 'bold'], ['text3d', 'Sparkles', 'hex', 'sunset', 'bold'], ['app', 'Layers', 'blob', 'berry', 'modern'], ['shapeLeft', 'Gem', 'diamond', 'neon', 'wide']],
  animal: [['mascot', 'Bone', 'blob', 'brick', 'playful'], ['badgeArc', 'Dog', 'hex', 'teal', 'vintage'], ['stacked', 'Cat', 'blob', 'coral', 'playful'], ['circleLine', 'Fish', 'drop', 'ocean', 'minimal']],
  bird: [['shapeOnly', 'Bird', 'bird', 'sky', 'modern'], ['stacked', 'Feather', 'bird', 'mint', 'elegant'], ['badgeArc', 'Bird', 'bird', 'navyGold', 'classic'], ['shapeLeft', 'Bird', 'bird', 'sunset', 'wide']],
  camera: [['app', 'Camera', 'blob', 'insta', 'modern'], ['circleLine', 'Aperture', 'hex', 'noir', 'minimal'], ['shapeLeft', 'Camera', 'hex', 'berry', 'wide'], ['badgeArc', 'Camera', 'hex', 'gold', 'vintage']],
  car: [['shapeOnly', 'Car', 'car', 'fire', 'bold'], ['shieldCrest', 'Gauge', 'shield', 'steel', 'wide'], ['badgeArc', 'Car', 'car', 'noir', 'vintage'], ['shapeLeft', 'Car', 'car', 'sky', 'bold']],
  circle: [['badgeArc', 'Circle', 'hex', 'indigo', 'wide'], ['circleLine', 'Orbit', 'hex', 'mint', 'minimal'], ['ring', 'Sun', 'hex', 'sunset', 'modern'], ['vintage', 'Star', 'hex', 'navyGold', 'vintage']],
  crown: [['shapeOnly', 'Crown', 'crown', 'gold', 'classic'], ['shieldCrest', 'Crown', 'shield', 'royal', 'classic'], ['stacked', 'Crown', 'crown', 'navyGold', 'elegant'], ['badgeArc', 'Crown', 'crown', 'plum', 'vintage']],
  eagle: [['shapeOnly', 'Bird', 'eagle', 'navyGold', 'bold'], ['shieldCrest', 'Bird', 'eagle', 'esport', 'bold'], ['badgeArc', 'Bird', 'eagle', 'steel', 'classic'], ['shapeLeft', 'Bird', 'eagle', 'fire', 'wide']],
  fire: [['shapeOnly', 'Flame', 'flame', 'fire', 'bold'], ['mascot', 'Flame', 'flame', 'sunset', 'bold'], ['shapeLeft', 'Flame', 'flame', 'cherry', 'wide'], ['text3d', 'Flame', 'flame', 'fire', 'bold']],
  typography: [['wordmark', 'Type', 'hex', 'noir', 'elegant'], ['text3d', 'Type', 'hex', 'berry', 'bold'], ['wordmark', 'Type', 'hex', 'royal', 'wide'], ['letter', 'Type', 'blob', 'coral', 'classic']],
  heart: [['shapeOnly', 'Heart', 'heart', 'rose', 'elegant'], ['stacked', 'HeartHandshake', 'heart', 'cherry', 'playful'], ['shapeLeft', 'Heart', 'heart', 'coral', 'modern'], ['circleLine', 'Heart', 'heart', 'plum', 'minimal']],
  house: [['shapeOnly', 'Home', 'house', 'teal', 'wide'], ['shapeLeft', 'Home', 'house', 'navyGold', 'classic'], ['circleLine', 'Building2', 'house', 'sky', 'minimal'], ['badgeArc', 'Home', 'house', 'forest', 'vintage']],
  king: [['shieldCrest', 'Crown', 'shield', 'gold', 'classic'], ['shapeOnly', 'Crown', 'crown', 'royal', 'bold'], ['vintage', 'Crown', 'crown', 'navyGold', 'vintage'], ['mascot', 'Crown', 'crown', 'esport', 'bold']],
  leaf: [['shapeOnly', 'Leaf', 'leaf', 'forest', 'modern'], ['stacked', 'Sprout', 'leaf', 'lime', 'playful'], ['circleLine', 'Leaf', 'leaf', 'olive', 'elegant'], ['shapeLeft', 'Leaf', 'leaf', 'mint', 'minimal']],
  letter: [['letter', 'Type', 'hex', 'indigo', 'bold'], ['letter', 'Type', 'blob', 'sunset', 'modern'], ['letter', 'Type', 'shield', 'navyGold', 'classic'], ['monogram', 'Type', 'hex', 'noir', 'elegant']],
  mascot: [['mascot', 'Smile', 'blob', 'sunset', 'playful'], ['mascot', 'Bot', 'hex', 'berry', 'bold'], ['mascot', 'Ghost', 'blob', 'neon', 'bold'], ['mascot', 'Rocket', 'burst', 'fire', 'bold']],
  minimalist: [['circleLine', 'Minus', 'hex', 'noir', 'minimal'], ['wordmark', 'Dot', 'hex', 'noir', 'minimal'], ['stacked', 'Triangle', 'hex', 'mint', 'minimal'], ['shapeLeft', 'Square', 'arch', 'olive', 'minimal']],
  modern: [['shapeLeft', 'Zap', 'blob', 'indigo', 'modern'], ['app', 'Hexagon', 'hex', 'sky', 'modern'], ['stacked', 'Waves', 'drop', 'ocean', 'wide'], ['ring', 'Infinity', 'hex', 'berry', 'modern']],
  queen: [['shapeOnly', 'Crown', 'crown', 'rose', 'elegant'], ['vintage', 'Crown', 'crown', 'plum', 'vintage'], ['stacked', 'Gem', 'diamond', 'rose', 'elegant'], ['shieldCrest', 'Crown', 'shield', 'plum', 'classic']],
  shield: [['shieldCrest', 'Shield', 'shield', 'steel', 'wide'], ['shieldCrest', 'Swords', 'shield', 'esport', 'bold'], ['shapeLeft', 'ShieldCheck', 'shield', 'mint', 'modern'], ['shapeOnly', 'Star', 'shield', 'navyGold', 'classic']],
  easy: [['stacked', 'Star', 'hex', 'sky', 'modern'], ['shapeLeft', 'Smile', 'blob', 'lime', 'playful'], ['wordmark', 'Dot', 'hex', 'indigo', 'modern'], ['circleLine', 'Check', 'hex', 'mint', 'modern']],
  text: [['wordmark', 'Type', 'hex', 'noir', 'wide'], ['wordmark', 'Type', 'hex', 'sunset', 'bold'], ['text3d', 'Type', 'hex', 'ocean', 'bold'], ['badgeText', 'Type', 'hex', 'royal', 'classic']],
  tree: [['shapeOnly', 'TreePine', 'tree', 'forest', 'modern'], ['badgeArc', 'Trees', 'tree', 'olive', 'vintage'], ['circleLine', 'TreeDeciduous', 'tree', 'forest', 'elegant'], ['shapeLeft', 'TreePine', 'tree', 'lime', 'wide']],
  vintage: [['vintage', 'Anchor', 'hex', 'navyGold', 'vintage'], ['vintage', 'Coffee', 'hex', 'brick', 'vintage'], ['badgeArc', 'Scissors', 'hex', 'noir', 'vintage'], ['vintage', 'Compass', 'hex', 'olive', 'vintage']]
};

const I = {
  app: [['app', 'Smartphone', 'blob', 'indigo', 'modern'], ['app', 'Zap', 'hex', 'sunset', 'modern'], ['app', 'MessageCircle', 'blob', 'mint', 'modern'], ['cube3d', 'AppWindow', 'hex', 'sky', 'bold']],
  architecture: [['shapeLeft', 'Building2', 'arch', 'noir', 'minimal'], ['circleLine', 'Landmark', 'arch', 'navyGold', 'classic'], ['wordmark', 'Ruler', 'hex', 'steel', 'wide'], ['shapeOnly', 'Building', 'house', 'teal', 'minimal']],
  beauty: [['stacked', 'Flower2', 'leaf', 'rose', 'elegant'], ['circleLine', 'Sparkles', 'heart', 'plum', 'elegant'], ['shapeOnly', 'Gem', 'diamond', 'rose', 'elegant'], ['monogram', 'Flower', 'hex', 'gold', 'classic']],
  brand: [['wordmark', 'Star', 'hex', 'indigo', 'wide'], ['shapeLeft', 'Sparkles', 'blob', 'sunset', 'modern'], ['monogram', 'Type', 'hex', 'noir', 'classic'], ['ring', 'Target', 'hex', 'berry', 'modern']],
  business: [['shapeLeft', 'TrendingUp', 'hex', 'navyGold', 'modern'], ['stacked', 'Briefcase', 'hex', 'steel', 'wide'], ['monogram', 'BarChart3', 'hex', 'teal', 'classic'], ['circleLine', 'Target', 'hex', 'sky', 'minimal']],
  company: [['shapeLeft', 'Building2', 'hex', 'sky', 'wide'], ['cube3d', 'Boxes', 'hex', 'steel', 'bold'], ['wordmark', 'Globe', 'hex', 'ocean', 'modern'], ['letter', 'Type', 'hex', 'indigo', 'bold']],
  construction: [['shieldCrest', 'HardHat', 'shield', 'steel', 'bold'], ['shapeLeft', 'Hammer', 'house', 'brick', 'wide'], ['badgeArc', 'Wrench', 'hex', 'fire', 'vintage'], ['shapeOnly', 'Construction', 'house', 'sunset', 'bold']],
  dj: [['ring', 'Disc3', 'hex', 'neon', 'bold'], ['mascot', 'Headphones', 'blob', 'berry', 'bold'], ['text3d', 'Radio', 'hex', 'neon', 'bold'], ['badgeArc', 'Music', 'hex', 'plum', 'wide']],
  doctor: [['shapeLeft', 'Stethoscope', 'shield', 'mint', 'modern'], ['circleLine', 'HeartPulse', 'heart', 'sky', 'minimal'], ['stacked', 'Activity', 'hex', 'teal', 'modern'], ['shieldCrest', 'Cross', 'shield', 'ocean', 'wide']],
  esports: [['shieldCrest', 'Swords', 'shield', 'esport', 'bold'], ['mascot', 'Skull', 'shield', 'neon', 'bold'], ['shapeOnly', 'Zap', 'eagle', 'fire', 'bold'], ['shieldCrest', 'Crosshair', 'shield', 'berry', 'bold']],
  fashion: [['wordmark', 'Shirt', 'hex', 'noir', 'elegant'], ['monogram', 'Gem', 'hex', 'gold', 'classic'], ['stacked', 'ShoppingBag', 'diamond', 'rose', 'minimal'], ['vintage', 'Scissors', 'hex', 'noir', 'vintage']],
  fitness: [['shieldCrest', 'Dumbbell', 'shield', 'fire', 'bold'], ['shapeLeft', 'Activity', 'burst', 'lime', 'wide'], ['badgeArc', 'Dumbbell', 'hex', 'noir', 'bold'], ['mascot', 'Flame', 'flame', 'sunset', 'bold']],
  food: [['badgeArc', 'Utensils', 'hex', 'fire', 'vintage'], ['stacked', 'Apple', 'leaf', 'lime', 'playful'], ['mascot', 'Pizza', 'burst', 'sunset', 'playful'], ['shapeLeft', 'Soup', 'blob', 'brick', 'modern']],
  gaming: [['mascot', 'Gamepad2', 'hex', 'berry', 'bold'], ['shieldCrest', 'Joystick', 'shield', 'neon', 'bold'], ['cube3d', 'Gamepad', 'hex', 'indigo', 'bold'], ['text3d', 'Trophy', 'hex', 'esport', 'bold']],
  instagram: [['app', 'Camera', 'blob', 'insta', 'modern'], ['ring', 'Heart', 'heart', 'insta', 'modern'], ['shapeLeft', 'Sparkles', 'blob', 'insta', 'playful'], ['circleLine', 'Instagram', 'hex', 'plum', 'minimal']],
  medical: [['shieldCrest', 'Cross', 'shield', 'mint', 'wide'], ['shapeLeft', 'HeartPulse', 'heart', 'sky', 'modern'], ['circleLine', 'Pill', 'hex', 'teal', 'minimal'], ['stacked', 'Building', 'hex', 'ocean', 'modern']],
  music: [['ring', 'Music', 'hex', 'plum', 'modern'], ['shapeLeft', 'Mic', 'blob', 'berry', 'wide'], ['vintage', 'Music', 'hex', 'brick', 'vintage'], ['text3d', 'Music2', 'hex', 'neon', 'bold']],
  photography: [['circleLine', 'Aperture', 'hex', 'noir', 'minimal'], ['app', 'Camera', 'blob', 'sunset', 'modern'], ['badgeArc', 'Camera', 'hex', 'gold', 'vintage'], ['monogram', 'Focus', 'hex', 'noir', 'elegant']],
  realestate: [['shapeLeft', 'Home', 'house', 'navyGold', 'classic'], ['shapeOnly', 'KeyRound', 'house', 'teal', 'wide'], ['circleLine', 'Building2', 'arch', 'sky', 'minimal'], ['badgeArc', 'Home', 'house', 'forest', 'vintage']],
  restaurant: [['vintage', 'ChefHat', 'hex', 'brick', 'vintage'], ['badgeArc', 'UtensilsCrossed', 'hex', 'cherry', 'classic'], ['stacked', 'Wine', 'hex', 'plum', 'elegant'], ['shapeLeft', 'Coffee', 'blob', 'brick', 'modern']],
  social: [['app', 'MessageCircle', 'blob', 'sky', 'modern'], ['ring', 'Share2', 'hex', 'insta', 'modern'], ['shapeLeft', 'ThumbsUp', 'blob', 'indigo', 'playful'], ['app', 'AtSign', 'hex', 'berry', 'modern']],
  sports: [['shieldCrest', 'Trophy', 'shield', 'esport', 'bold'], ['badgeArc', 'Medal', 'hex', 'sky', 'bold'], ['shapeOnly', 'Award', 'shield', 'navyGold', 'bold'], ['mascot', 'Bike', 'blob', 'fire', 'bold']]
};

const NEW = new Set(['logo-3d-1', 'logo-3d-2', 'logo-esports-1', 'logo-gaming-1', 'logo-dj-1', 'logo-instagram-1', 'logo-mascot-2', 'logo-fire-1']);
const POPULAR = new Set(['logo-modern-1', 'logo-letter-1', 'logo-shield-1', 'logo-crown-1', 'logo-realestate-1', 'logo-beauty-1', 'logo-restaurant-1', 'logo-sports-1', 'logo-business-1', 'logo-minimalist-1', 'logo-construction-1', 'logo-app-1']);

/** Build catalogue entries with the element helpers from templates.js. */
export function buildLogoCatalog(kit) {
  const { T, Sq, Ic, R, L, bg, initials } = kit;
  const P = (c, cx, cy, size, d, fill, o = {}) => {
    const s = size * c.u;
    return {
      id: kit.newId(), rotation: o.rot || 0, opacity: o.opacity ?? 1, locked: false, hidden: false, name: o.name || '',
      type: 'path', d, vb: 24, fill, stroke: o.stroke || 'transparent', strokeWidth: o.sw || 0,
      ...(o.gradient ? { gradient: o.gradient } : {}),
      x: cx * c.w - s / 2, y: cy * c.h - s / 2, w: s, h: s
    };
  };
  const G = (from, to, angle = 135) => ({ from, to, angle });
  const ArcT = (c, cx, cy, r, s, text, sweep, o = {}) => {
    const rr = r * c.u;
    const w = 2 * rr * Math.sin(Math.min(Math.abs(sweep), 340) * Math.PI / 360);
    const el = T(c, 0, 0, 0.1, s, text, o);
    const up = sweep > 0;
    return { ...el, arc: sweep, w, h: up ? rr : 2 * rr, x: cx * c.w - w / 2, y: up ? cy * c.h - rr - s * c.u : cy * c.h - rr + 0.2 * s * c.u };
  };
  const txt = (o, extra = {}) => ({ fit: true, font: o.font, weight: o.weight, upper: o.upper, ls: o.ls, italic: o.italic, color: o.ink, ...extra });
  const sub = (o, extra = {}) => ({ fit: true, color: o.c2, ls: 0.2, upper: true, weight: 600, ...extra });
  const shape = (o) => LOGO_SHAPES[o.shape] || LOGO_SHAPES.hex;

  const COMPOSITIONS = {
    shapeOnly: (c, o) => [
      P(c, 0.5, 0.34, 0.42, shape(o), o.c1, { gradient: G(o.c1, o.c2) }),
      Ic(c, 0.5, 0.36, 0.16, o.icon, '#ffffff', { sw: 2 }),
      T(c, 0.05, 0.6, 0.9, 0.12, o.name, txt(o, { align: 'center' })),
      T(c, 0.1, 0.75, 0.8, 0.045, o.slogan, sub(o, { align: 'center' }))
    ],
    shapeLeft: (c, o) => [
      P(c, 0.22, 0.5, 0.34, shape(o), o.c1, { gradient: G(o.c1, o.c2, 160) }),
      Ic(c, 0.22, 0.5, 0.14, o.icon, '#ffffff', { sw: 2 }),
      T(c, 0.43, 0.39, 0.54, 0.14, o.name, txt(o)),
      T(c, 0.435, 0.57, 0.54, 0.05, o.slogan, sub(o))
    ],
    stacked: (c, o) => [
      Ic(c, 0.5, 0.3, 0.28, o.icon, o.c1, { sw: 1.6 }),
      T(c, 0.05, 0.52, 0.9, 0.13, o.name, txt(o, { align: 'center' })),
      L(c, 0.42, 0.72, 0.16, o.c2, { t: 0.008 }),
      T(c, 0.05, 0.76, 0.9, 0.05, o.slogan, sub(o, { align: 'center' }))
    ],
    badgeArc: (c, o) => [
      Sq(c, 0.5, 0.5, 0.84, o.c1, { shape: 'ellipse' }),
      Sq(c, 0.5, 0.5, 0.56, 'transparent', { shape: 'ellipse', stroke: '#ffffff', sw: 0.008 }),
      Ic(c, 0.5, 0.5, 0.24, o.icon, '#ffffff', { sw: 1.8 }),
      ArcT(c, 0.5, 0.5, 0.31, 0.075, o.name, 170, txt(o, { align: 'center', color: '#ffffff', fit: false })),
      ArcT(c, 0.5, 0.5, 0.31, 0.05, o.slogan, -120, { ...sub(o), align: 'center', color: '#ffffff', fit: false })
    ],
    vintage: (c, o) => [
      Sq(c, 0.5, 0.5, 0.86, 'transparent', { shape: 'ellipse', stroke: o.c1, sw: 0.02 }),
      Sq(c, 0.5, 0.5, 0.78, 'transparent', { shape: 'ellipse', stroke: o.c1, sw: 0.006 }),
      Sq(c, 0.5, 0.5, 0.5, o.c1, { shape: 'ellipse' }),
      Ic(c, 0.5, 0.5, 0.22, o.icon, '#ffffff', { sw: 1.8 }),
      ArcT(c, 0.5, 0.5, 0.31, 0.07, o.name, 150, txt(o, { align: 'center', color: o.c1, fit: false })),
      ArcT(c, 0.5, 0.5, 0.31, 0.045, o.slogan, -110, { ...sub(o), align: 'center', color: o.c1, fit: false }),
      Sq(c, 0.16, 0.5, 0.05, o.c1, { shape: 'star' }),
      Sq(c, 0.84, 0.5, 0.05, o.c1, { shape: 'star' })
    ],
    shieldCrest: (c, o) => [
      P(c, 0.5, 0.4, 0.62, LOGO_SHAPES.shield, o.c1, { gradient: G(o.c1, o.c2, 180), stroke: '#ffffff', sw: 0.6 }),
      Ic(c, 0.5, 0.36, 0.2, o.icon, '#ffffff', { sw: 2 }),
      R(c, 0.12, 0.66, 0.76, 0.14, o.ink, { r: 0.02 }),
      T(c, 0.14, 0.685, 0.72, 0.09, o.name, txt(o, { align: 'center', color: '#ffffff' })),
      T(c, 0.15, 0.84, 0.7, 0.045, o.slogan, sub(o, { align: 'center' }))
    ],
    mascot: (c, o) => [
      Sq(c, 0.5, 0.38, 0.6, o.c2, { shape: 'ellipse' }),
      P(c, 0.5, 0.38, 0.5, shape(o), o.c1, { gradient: G(o.c1, o.c2, 200), stroke: o.ink, sw: 0.8 }),
      Ic(c, 0.5, 0.38, 0.24, o.icon, '#ffffff', { sw: 2.2 }),
      R(c, 0.08, 0.68, 0.84, 0.15, o.ink, { r: 0.04, rot: -4 }),
      T(c, 0.1, 0.7, 0.8, 0.1, o.name, txt(o, { align: 'center', color: '#ffffff', rot: -4 }))
    ],
    cube3d: (c, o) => [
      P(c, 0.5, 0.33, 0.42, LOGO_SHAPES.cubeTop, o.c1, { gradient: G('#ffffff', o.c1, 180) }),
      P(c, 0.5, 0.33, 0.42, LOGO_SHAPES.cubeLeft, o.c1),
      P(c, 0.5, 0.33, 0.42, LOGO_SHAPES.cubeRight, o.c2),
      { ...T(c, 0.05, 0.6, 0.9, 0.12, o.name, txt(o, { align: 'center' })), depth: 6 },
      T(c, 0.1, 0.77, 0.8, 0.045, o.slogan, sub(o, { align: 'center' }))
    ],
    text3d: (c, o) => [
      { ...T(c, 0.04, 0.34, 0.92, 0.22, o.name, txt(o, { align: 'center', color: o.c1 })), depth: 10, gradient: G(o.c1, o.c2, 90) },
      Ic(c, 0.5, 0.22, 0.12, o.icon, o.c2, { sw: 2 }),
      T(c, 0.1, 0.66, 0.8, 0.05, o.slogan, sub(o, { align: 'center', color: o.ink }))
    ],
    app: (c, o) => [
      Sq(c, 0.5, 0.36, 0.46, o.c1, { r: 0.11 }),
      { ...Sq(c, 0.5, 0.36, 0.46, o.c1, { r: 0.11 }), gradient: G(o.c1, o.c2, 135) },
      Ic(c, 0.5, 0.36, 0.22, o.icon, '#ffffff', { sw: 2 }),
      T(c, 0.05, 0.65, 0.9, 0.1, o.name, txt(o, { align: 'center' })),
      T(c, 0.1, 0.78, 0.8, 0.045, o.slogan, sub(o, { align: 'center' }))
    ],
    circleLine: (c, o) => [
      Sq(c, 0.5, 0.34, 0.4, 'transparent', { shape: 'ellipse', stroke: o.c1, sw: 0.01 }),
      Ic(c, 0.5, 0.34, 0.18, o.icon, o.c1, { sw: 1.4 }),
      T(c, 0.05, 0.6, 0.9, 0.1, o.name, txt(o, { align: 'center' })),
      T(c, 0.1, 0.74, 0.8, 0.04, o.slogan, sub(o, { align: 'center' }))
    ],
    ring: (c, o) => [
      Sq(c, 0.5, 0.36, 0.44, o.c1, { shape: 'ellipse' }),
      { ...Sq(c, 0.5, 0.36, 0.44, o.c1, { shape: 'ellipse' }), gradient: G(o.c1, o.c2, 45) },
      Sq(c, 0.5, 0.36, 0.3, '#ffffff', { shape: 'ellipse' }),
      Ic(c, 0.5, 0.36, 0.16, o.icon, o.c1, { sw: 2 }),
      T(c, 0.05, 0.64, 0.9, 0.11, o.name, txt(o, { align: 'center' })),
      T(c, 0.1, 0.78, 0.8, 0.045, o.slogan, sub(o, { align: 'center' }))
    ],
    letter: (c, o) => [
      P(c, 0.5, 0.36, 0.5, shape(o), o.c1, { gradient: G(o.c1, o.c2, 135) }),
      T(c, 0.3, 0.22, 0.4, 0.26, o.initials.slice(0, 1), txt(o, { align: 'center', color: '#ffffff', weight: 900 })),
      T(c, 0.05, 0.66, 0.9, 0.1, o.name, txt(o, { align: 'center' })),
      T(c, 0.1, 0.79, 0.8, 0.045, o.slogan, sub(o, { align: 'center' }))
    ],
    monogram: (c, o) => [
      Sq(c, 0.5, 0.38, 0.46, 'transparent', { shape: 'rect', stroke: o.c1, sw: 0.01 }),
      T(c, 0.28, 0.25, 0.44, 0.24, o.initials, txt(o, { align: 'center', color: o.c1 })),
      T(c, 0.05, 0.68, 0.9, 0.09, o.name, txt(o, { align: 'center' })),
      T(c, 0.1, 0.8, 0.8, 0.04, o.slogan, sub(o, { align: 'center' }))
    ],
    wordmark: (c, o) => [
      T(c, 0.04, 0.36, 0.92, 0.18, o.name, txt(o, { align: 'center' })),
      R(c, 0.3, 0.6, 0.4, 0.012, o.c1),
      T(c, 0.04, 0.64, 0.92, 0.055, o.slogan, sub(o, { align: 'center' }))
    ],
    badgeText: (c, o) => [
      R(c, 0.08, 0.32, 0.84, 0.3, o.c1, { r: 0.15 }),
      T(c, 0.12, 0.38, 0.76, 0.16, o.name, txt(o, { align: 'center', color: '#ffffff' })),
      T(c, 0.1, 0.68, 0.8, 0.05, o.slogan, sub(o, { align: 'center' }))
    ]
  };

  const make = (cat, kind, entries) => entries.map(([comp, icon, shp, pal, type], i) => {
    const id = `logo-${cat.id}-${i + 1}`;
    const [c1, c2, ink] = PAL[pal];
    const ty = TYPE[type];
    return {
      id,
      name: `${cat.label} ${i + 1}`,
      category: cat.id,
      styles: kind === 'style' ? [cat.id] : [],
      industries: kind === 'industry' ? [cat.id] : [],
      tags: [cat.label, comp, icon],
      isNew: NEW.has(id),
      popular: POPULAR.has(id),
      style: type,
      build: (c, ctx = {}) => [{
        background: bg('transparent'),
        elements: COMPOSITIONS[comp](c, {
          name: ctx.name || 'Nova Studio', slogan: ctx.slogan || 'Depuis 2024', initials: initials(ctx.name || 'Nova Studio'),
          icon, shape: shp, c1, c2, ink, ...ty
        })
      }]
    };
  });

  return [
    ...LOGO_STYLE_CATS.flatMap((cat) => make(cat, 'style', S[cat.id] || [])),
    ...LOGO_INDUSTRY_CATS.flatMap((cat) => make(cat, 'industry', I[cat.id] || []))
  ];
}

export const LOGO_ICON_NAMES = [...new Set([...Object.values(S), ...Object.values(I)].flat().map((e) => e[1]))];
