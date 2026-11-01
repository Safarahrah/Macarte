// src/design/flyerCatalog.js
// Flyer catalogue by use case and style. Compositions are relative to the page
// so they adapt to A4, A5, DL… Every element (texts, photos, shapes, QR) stays editable.

export const FLYER_USES = [
  { id: 'promo', label: 'Promotions' }, { id: 'event', label: 'Événements' }, { id: 'restaurant', label: 'Restaurants' },
  { id: 'beauty', label: 'Beauté' }, { id: 'realestate', label: 'Immobilier' }, { id: 'construction', label: 'Construction' },
  { id: 'music', label: 'Musique' }, { id: 'party', label: 'Fêtes' }, { id: 'services', label: 'Services professionnels' },
  { id: 'advertising', label: 'Publicité' }, { id: 'social', label: 'Réseaux sociaux' }, { id: 'hiring', label: 'Recrutement' }
];

export const FLYER_STYLES = [
  { id: 'modern', label: 'Moderne' }, { id: 'elegant', label: 'Élégant' }, { id: 'bold', label: 'Audacieux' },
  { id: 'minimal', label: 'Minimal' }, { id: 'colorful', label: 'Coloré' }, { id: 'dark', label: 'Sombre' }
];

// brand, accent, ink (text on background), background
const PAL = {
  navyOrange: ['#0f2a4a', '#f97316', '#0f172a', '#ffffff'], tealGold: ['#0f766e', '#f59e0b', '#0f172a', '#f8fafc'],
  hazard: ['#111111', '#facc15', '#111111', '#ffffff'], wine: ['#7f1d1d', '#f59e0b', '#1c1917', '#fffbeb'],
  blush: ['#be185d', '#f9a8d4', '#3b0a24', '#fdf2f8'], noirGold: ['#111111', '#d4af37', '#f5f5f4', '#111111'],
  neon: ['#7c3aed', '#22d3ee', '#ffffff', '#0b1020'], sunset: ['#db2777', '#f97316', '#ffffff', '#1e1b4b'],
  forest: ['#14532d', '#a3e635', '#14532d', '#f7fee7'], royal: ['#1e3a8a', '#fbbf24', '#0f172a', '#ffffff'],
  coral: ['#e11d48', '#fb923c', '#1f2937', '#fff7ed'], mint: ['#0d9488', '#5eead4', '#134e4a', '#f0fdfa'],
  plum: ['#581c87', '#f0abfc', '#ffffff', '#2e1065'], sand: ['#7c5c3b', '#d6b26e', '#2b2118', '#faf6ef'],
  sky: ['#0369a1', '#38bdf8', '#0c4a6e', '#f0f9ff'], candy: ['#9333ea', '#facc15', '#1f2937', '#fdf4ff'],
  red: ['#dc2626', '#111827', '#111827', '#ffffff'], olive: ['#3f6212', '#eab308', '#1a2e05', '#fefce8']
};

const TXT = {
  promo: { kicker: 'OFFRE LIMITÉE', title: 'Soldes\nd’été', body: 'Jusqu’à -50 % sur une sélection d’articles, en boutique et en ligne.', items: ['Livraison offerte', 'Retours gratuits', 'Paiement en 3 fois', 'Cadeau dès 50 €'], cta: 'J’en profite', price: '-50%', icon: 'ShoppingBag' },
  event: { kicker: 'SAMEDI 14 JUIN · 19H', title: 'Grande\nconférence', body: 'Une soirée d’échanges avec des intervenants inspirants.', items: ['Keynotes', 'Ateliers', 'Networking', 'Cocktail'], cta: 'Réserver ma place', price: '25 €', icon: 'CalendarDays' },
  restaurant: { kicker: 'NOUVEAU MENU', title: 'Saveurs\nde saison', body: 'Une cuisine maison, des produits frais et locaux.', items: ['Burger signature · 14 €', 'Salade du chef · 12 €', 'Pâtes fraîches · 15 €', 'Dessert maison · 7 €'], cta: 'Réserver une table', price: '19,90 €', icon: 'UtensilsCrossed' },
  beauty: { kicker: 'INSTITUT DE BEAUTÉ', title: 'Révélez\nvotre éclat', body: 'Soins du visage, manucure et massages relaxants.', items: ['Soin visage', 'Manucure', 'Massage', 'Épilation'], cta: 'Prendre rendez-vous', price: '-20%', icon: 'Sparkles' },
  realestate: { kicker: 'À VENDRE', title: 'Maison\nfamiliale', body: 'Belle maison lumineuse avec jardin, proche écoles et commerces.', items: ['4 chambres', '2 salles de bain', '180 m²', 'Garage'], cta: 'Planifier une visite', price: '450 000 €', icon: 'Home' },
  construction: { kicker: 'BÂTIMENT & RÉNOVATION', title: 'Nous\nconstruisons\nvos projets', body: 'Construction, rénovation et extension clés en main.', items: ['Gros œuvre', 'Rénovation', 'Toiture', 'Devis gratuit'], cta: 'Devis gratuit', price: '10 ans', icon: 'HardHat' },
  music: { kicker: 'LIVE · 21 JUIN', title: 'Festival\nde musique', body: 'Trois scènes, vingt artistes, une nuit inoubliable.', items: ['DJ Nova', 'The Waves', 'Luna & Co', 'Echo Band'], cta: 'Billetterie', price: '35 €', icon: 'Music' },
  party: { kicker: 'VOUS ÊTES INVITÉS', title: 'Soirée\nd’anniversaire', body: 'Venez célébrer avec nous autour d’un buffet et de musique.', items: ['Buffet', 'DJ', 'Photobooth', 'Surprises'], cta: 'Je confirme', price: '30 ans', icon: 'PartyPopper' },
  services: { kicker: 'CABINET CONSEIL', title: 'Des experts\nà vos côtés', body: 'Comptabilité, juridique et stratégie pour les entreprises.', items: ['Comptabilité', 'Juridique', 'Fiscalité', 'Stratégie'], cta: 'Contactez-nous', price: '1er RDV offert', icon: 'Briefcase' },
  advertising: { kicker: 'NOUVEAUTÉ', title: 'Le produit\nqui change tout', body: 'Découvrez notre nouvelle gamme, pensée pour vous simplifier la vie.', items: ['Innovant', 'Durable', 'Garanti 2 ans', 'Made in France'], cta: 'Découvrir', price: '49 €', icon: 'Megaphone' },
  social: { kicker: '@VOTRECOMPTE', title: 'Suivez-nous\nen ligne', body: 'Astuces, coulisses et concours chaque semaine.', items: ['Instagram', 'Facebook', 'TikTok', 'LinkedIn'], cta: 'Abonnez-vous', price: '+10K', icon: 'Instagram' },
  hiring: { kicker: 'ON RECRUTE', title: 'Rejoignez\nnotre équipe', body: 'Nous recherchons des talents motivés pour accompagner notre croissance.', items: ['CDI temps plein', 'Mutuelle', 'Télétravail', 'Formation'], cta: 'Postuler', price: '5 postes', icon: 'Users' }
};

// [composition, palette, style]
const SETS = {
  promo: [['saleBurst', 'red', 'bold'], ['diagonalHero', 'navyOrange', 'modern'], ['bigType', 'candy', 'colorful'], ['splitPhoto', 'noirGold', 'elegant']],
  event: [['eventGlow', 'neon', 'dark'], ['bigType', 'royal', 'modern'], ['archPhoto', 'sand', 'elegant'], ['diagonalHero', 'tealGold', 'bold']],
  restaurant: [['menu', 'wine', 'elegant'], ['splitPhoto', 'coral', 'modern'], ['menu', 'noirGold', 'dark'], ['waveFooter', 'olive', 'colorful']],
  beauty: [['archPhoto', 'blush', 'elegant'], ['serviceList', 'plum', 'dark'], ['waveFooter', 'blush', 'modern'], ['minimalPhoto', 'sand', 'minimal']],
  realestate: [['property', 'royal', 'modern'], ['property', 'tealGold', 'elegant'], ['splitPhoto', 'navyOrange', 'bold'], ['minimalPhoto', 'sand', 'minimal']],
  construction: [['diagonalHero', 'hazard', 'bold'], ['serviceList', 'navyOrange', 'modern'], ['stripesHero', 'hazard', 'bold'], ['property', 'royal', 'modern']],
  music: [['eventGlow', 'sunset', 'dark'], ['bigType', 'neon', 'bold'], ['eventGlow', 'plum', 'colorful'], ['stripesHero', 'noirGold', 'dark']],
  party: [['eventGlow', 'candy', 'colorful'], ['archPhoto', 'blush', 'elegant'], ['bigType', 'sunset', 'bold'], ['confetti', 'candy', 'colorful']],
  services: [['serviceList', 'royal', 'modern'], ['diagonalHero', 'tealGold', 'modern'], ['minimalPhoto', 'sky', 'minimal'], ['splitPhoto', 'navyOrange', 'elegant']],
  advertising: [['bigType', 'coral', 'bold'], ['splitPhoto', 'mint', 'modern'], ['saleBurst', 'candy', 'colorful'], ['minimalPhoto', 'noirGold', 'minimal']],
  social: [['confetti', 'sunset', 'colorful'], ['bigType', 'plum', 'modern'], ['waveFooter', 'sky', 'modern'], ['eventGlow', 'neon', 'dark']],
  hiring: [['serviceList', 'mint', 'modern'], ['bigType', 'royal', 'bold'], ['diagonalHero', 'forest', 'modern'], ['minimalPhoto', 'sky', 'minimal']]
};

const WAVE = 'M0 10 C6 4 12 4 18 9 C21 11.5 23 12 24 11.5 V24 H0 Z';
const BURST = 'M12 1 L14.5 6.5 L20.5 4.5 L18.5 10 L23 12 L18.5 14 L20.5 19.5 L14.5 17.5 L12 23 L9.5 17.5 L3.5 19.5 L5.5 14 L1 12 L5.5 10 L3.5 4.5 L9.5 6.5 Z';

const NEW = new Set(['flyer-music-1', 'flyer-party-4', 'flyer-social-1', 'flyer-hiring-1', 'flyer-beauty-1']);
const POPULAR = new Set(['flyer-promo-1', 'flyer-event-1', 'flyer-restaurant-1', 'flyer-realestate-1', 'flyer-construction-1', 'flyer-services-1', 'flyer-beauty-2', 'flyer-advertising-1']);

export function buildFlyerCatalog(kit) {
  const { T, Sq, Ic, R, L, Img, Q, bg } = kit;
  const P = (c, x, y, w, h, d, fill, o = {}) => ({
    id: kit.newId(), rotation: o.rot || 0, opacity: o.opacity ?? 1, locked: false, hidden: false, name: '',
    type: 'path', d, vb: 24, fill, stroke: 'transparent', strokeWidth: 0, ...(o.gradient ? { gradient: o.gradient } : {}),
    x: x * c.w, y: y * c.h, w: w * c.w, h: h * c.h
  });
  const poly = (c, pts, fill, o = {}) => {
    const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * 24).toFixed(2)} ${(y * 24).toFixed(2)}`).join(' ') + ' Z';
    return P(c, 0, 0, 1, 1, d, fill, o);
  };
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
    diagonalHero: (c, p, t, s) => ({
      background: bg(p[3]),
      elements: [
        Img(c, 0, 0, 1, 0.46),
        poly(c, [[0, 0.38], [1, 0.3], [1, 0.52], [0, 0.6]], p[0]),
        poly(c, [[0, 0.6], [1, 0.52], [1, 0.545], [0, 0.625]], p[1]),
        T(c, 0.07, 0.4, 0.86, 0.03, t.kicker, { color: p[1], weight: 700, ls: 0.2, fit: true }),
        T(c, 0.07, 0.445, 0.6, 0.065, t.title.replace('\n', ' '), { ...head(s), color: '#ffffff', fit: true }),
        ...list(c, 0.07, 0.67, 0.5, t.items, p[2], p[1]),
        Sq(c, 0.8, 0.75, 0.3, p[0], { shape: 'ellipse' }),
        T(c, 0.65, 0.72, 0.3, 0.06, t.price, { color: '#ffffff', weight: 900, align: 'center', fit: true }),
        ...cta(c, 0.07, 0.9, 0.45, t.cta, p[1], '#111111'),
        T(c, 0.57, 0.915, 0.38, 0.026, '01 23 45 67 89', { color: p[2], weight: 700, align: 'right', fit: true })
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
        T(c, 0.42, 0.485, 0.16, 0.035, t.price, { color: '#111111', weight: 900, align: 'center', fit: true }),
        ...cta(c, 0.55, 0.86, 0.38, t.cta, p[1], '#111111')
      ]
    }),
    bigType: (c, p, t, s) => ({
      background: bg(p[3]),
      elements: [
        R(c, 0, 0, 1, 0.07, p[0]),
        T(c, 0.07, 0.11, 0.86, 0.03, t.kicker, { color: p[0], weight: 800, ls: 0.25, fit: true }),
        R(c, 0.07, 0.17, 0.12, 0.012, p[1]),
        T(c, 0.07, 0.2, 0.86, 0.12, t.title, { ...head(s), color: p[2], lh: 0.98 }),
        T(c, 0.07, 0.55, 0.7, 0.03, t.body, { color: p[2], lh: 1.45, opacity: 0.85 }),
        Img(c, 0.07, 0.66, 0.5, 0.22, { r: 0.03 }),
        Sq(c, 0.78, 0.74, 0.28, p[1], { shape: 'ellipse' }),
        T(c, 0.64, 0.715, 0.28, 0.055, t.price, { color: '#111111', weight: 900, align: 'center', fit: true }),
        R(c, 0, 0.92, 1, 0.08, p[0]),
        T(c, 0.07, 0.945, 0.86, 0.028, `${t.cta} · www.votresite.com`, { color: '#ffffff', weight: 700, align: 'center', fit: true })
      ]
    }),
    eventGlow: (c, p, t, s) => ({
      background: bg(p[3], { from: p[3], to: p[0], angle: 200 }),
      elements: [
        Sq(c, 0.3, 0.3, 0.7, p[0], { shape: 'ellipse', opacity: 0.45 }),
        Sq(c, 0.75, 0.42, 0.55, p[1], { shape: 'ellipse', opacity: 0.3 }),
        T(c, 0.07, 0.08, 0.86, 0.032, t.kicker, { color: p[1], weight: 800, ls: 0.2, align: 'center', fit: true }),
        { ...T(c, 0.05, 0.4, 0.9, 0.12, t.title, { ...head('bold'), color: '#ffffff', align: 'center', lh: 1 }), depth: 4 },
        L(c, 0.35, 0.68, 0.3, p[1], { t: 0.006 }),
        T(c, 0.1, 0.71, 0.8, 0.03, t.items.join(' · '), { color: '#ffffff', align: 'center', weight: 600, fit: true }),
        ...cta(c, 0.3, 0.8, 0.4, t.cta, p[1], '#111111'),
        T(c, 0.07, 0.92, 0.86, 0.026, 'Lieu · Ville · www.votresite.com', { color: '#ffffff', align: 'center', opacity: 0.8, fit: true })
      ]
    }),
    menu: (c, p, t, s) => ({
      background: bg(p[3]),
      elements: [
        R(c, 0.05, 0.03, 0.9, 0.94, 'transparent', { stroke: p[1], sw: 0.004 }),
        Ic(c, 0.5, 0.1, 0.07, t.icon, p[1], { sw: 1.6 }),
        T(c, 0.1, 0.15, 0.8, 0.03, t.kicker, { color: p[1], weight: 700, ls: 0.25, align: 'center', fit: true }),
        T(c, 0.1, 0.2, 0.8, 0.08, t.title.replace('\n', ' '), { ...head('elegant'), color: p[3] === '#111111' ? '#ffffff' : p[0], align: 'center', fit: true }),
        Img(c, 0.12, 0.33, 0.76, 0.22, { r: 0.02 }),
        ...t.items.flatMap((it, i) => {
          const [label, price] = it.split(' · ');
          const color = p[3] === '#111111' ? '#f5f5f4' : p[2];
          return [
            T(c, 0.12, 0.6 + i * 0.065, 0.55, 0.032, label, { color, weight: 600, fit: true }),
            L(c, 0.5, 0.62 + i * 0.065, 0.22, p[1], { t: 0.002, dash: true }),
            T(c, 0.72, 0.6 + i * 0.065, 0.16, 0.032, price || '', { color: p[1], weight: 700, align: 'right', fit: true })
          ];
        }),
        T(c, 0.1, 0.9, 0.8, 0.026, `${t.cta} · 01 23 45 67 89`, { color: p[1], align: 'center', weight: 600, fit: true })
      ]
    }),
    serviceList: (c, p, t, s) => ({
      background: bg(p[3]),
      elements: [
        R(c, 0, 0, 1, 0.34, p[0]),
        Ic(c, 0.88, 0.07, 0.07, t.icon, p[1], { sw: 1.8 }),
        T(c, 0.07, 0.07, 0.7, 0.028, t.kicker, { color: p[1], weight: 700, ls: 0.2, fit: true }),
        T(c, 0.07, 0.12, 0.86, 0.07, t.title, { ...head(s), color: '#ffffff', lh: 1.05 }),
        Img(c, 0.55, 0.26, 0.38, 0.26, { r: 0.03 }),
        T(c, 0.07, 0.4, 0.44, 0.026, t.body, { color: p[2], lh: 1.45 }),
        ...list(c, 0.07, 0.58, 0.86, t.items, p[2], p[0], { s: 0.034, gap: 0.065 }),
        ...cta(c, 0.07, 0.88, 0.5, t.cta, p[0], '#ffffff'),
        Q(c, 0.86, 0.9, 0.12, 'https://macarte.app')
      ]
    }),
    property: (c, p, t, s) => ({
      background: bg(p[3]),
      elements: [
        Img(c, 0, 0, 1, 0.5),
        R(c, 0.07, 0.42, 0.42, 0.1, p[1], { r: 0.02 }),
        T(c, 0.07, 0.448, 0.42, 0.045, t.price, { color: '#111111', weight: 900, align: 'center', fit: true }),
        T(c, 0.07, 0.56, 0.86, 0.028, t.kicker, { color: p[0], weight: 800, ls: 0.2, fit: true }),
        T(c, 0.07, 0.6, 0.86, 0.06, t.title.replace('\n', ' '), { ...head(s), color: p[2], fit: true }),
        ...['BedDouble', 'Bath', 'Ruler', 'Car'].flatMap((ic, i) => [
          Ic(c, 0.13 + i * 0.22, 0.73, 0.06, ic, p[0], { sw: 1.8 }),
          T(c, 0.03 + i * 0.22, 0.77, 0.2, 0.024, t.items[i], { color: p[2], align: 'center', weight: 600, fit: true })
        ]),
        R(c, 0, 0.85, 1, 0.15, p[0]),
        T(c, 0.07, 0.885, 0.6, 0.03, 'Votre agent · 01 23 45 67 89', { color: '#ffffff', weight: 700, fit: true }),
        T(c, 0.07, 0.93, 0.6, 0.024, t.cta, { color: p[1], weight: 600, fit: true }),
        Q(c, 0.86, 0.925, 0.11, 'https://macarte.app')
      ]
    }),
    saleBurst: (c, p, t, s) => ({
      background: bg(p[3]),
      elements: [
        R(c, 0, 0, 1, 0.55, p[0]),
        P(c, 0.52, 0.08, 0.42, 0.42 * (c.w / c.h), BURST, p[1]),
        T(c, 0.55, 0.2, 0.36, 0.08, t.price, { ...head('bold'), color: '#111111', align: 'center', fit: true }),
        T(c, 0.07, 0.08, 0.44, 0.03, t.kicker, { color: '#ffffff', weight: 800, ls: 0.15, fit: true }),
        T(c, 0.07, 0.14, 0.45, 0.085, t.title, { ...head('bold'), color: '#ffffff', lh: 1 }),
        Img(c, 0.07, 0.6, 0.27, 0.2, { r: 0.02 }), Img(c, 0.365, 0.6, 0.27, 0.2, { r: 0.02 }), Img(c, 0.66, 0.6, 0.27, 0.2, { r: 0.02 }),
        T(c, 0.07, 0.83, 0.86, 0.026, t.body, { color: p[2], align: 'center', lh: 1.4 }),
        ...cta(c, 0.28, 0.9, 0.44, t.cta, p[0], '#ffffff')
      ]
    }),
    archPhoto: (c, p, t, s) => ({
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
    waveFooter: (c, p, t, s) => ({
      background: bg(p[3]),
      elements: [
        T(c, 0.07, 0.07, 0.86, 0.03, t.kicker, { color: p[0], weight: 800, ls: 0.2, fit: true }),
        T(c, 0.07, 0.12, 0.86, 0.085, t.title, { ...head(s), color: p[2], lh: 1.02 }),
        T(c, 0.07, 0.33, 0.6, 0.027, t.body, { color: p[2], lh: 1.45, opacity: 0.85 }),
        Img(c, 0.07, 0.45, 0.86, 0.3, { r: 0.03 }),
        P(c, 0, 0.7, 1, 0.3, WAVE, p[0], { gradient: { from: p[0], to: p[1], angle: 90 } }),
        T(c, 0.07, 0.86, 0.55, 0.035, t.cta, { color: '#ffffff', weight: 800, upper: true, fit: true }),
        T(c, 0.07, 0.91, 0.55, 0.025, '01 23 45 67 89 · www.votresite.com', { color: '#ffffff', fit: true }),
        Q(c, 0.85, 0.88, 0.13, 'https://macarte.app')
      ]
    }),
    minimalPhoto: (c, p, t, s) => ({
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
    stripesHero: (c, p, t, s) => ({
      background: bg(p[0]),
      elements: [
        ...Array.from({ length: 12 }, (_, i) => poly(c, [[i * 0.1 - 0.05, 0], [i * 0.1, 0], [i * 0.1 - 0.05, 0.04], [i * 0.1 - 0.1, 0.04]], p[1])),
        ...Array.from({ length: 12 }, (_, i) => poly(c, [[i * 0.1 - 0.05, 0.96], [i * 0.1, 0.96], [i * 0.1 - 0.05, 1], [i * 0.1 - 0.1, 1]], p[1])),
        Img(c, 0.07, 0.08, 0.86, 0.38),
        T(c, 0.07, 0.5, 0.86, 0.03, t.kicker, { color: p[1], weight: 800, ls: 0.2, fit: true }),
        T(c, 0.07, 0.55, 0.86, 0.075, t.title, { ...head('bold'), color: '#ffffff', lh: 1 }),
        ...list(c, 0.07, 0.75, 0.5, t.items.slice(0, 3), '#ffffff', p[1]),
        ...cta(c, 0.58, 0.8, 0.35, t.cta, p[1], '#111111')
      ]
    }),
    confetti: (c, p, t, s) => ({
      background: bg(p[3]),
      elements: [
        ...[[0.1, 0.08, p[0]], [0.85, 0.12, p[1]], [0.2, 0.3, p[1]], [0.9, 0.4, p[0]], [0.08, 0.6, p[0]], [0.88, 0.7, p[1]], [0.5, 0.05, p[1]]]
          .map(([x, y, col], i) => Sq(c, x, y, 0.035 + (i % 3) * 0.015, col, { shape: i % 2 ? 'star' : 'ellipse', rot: i * 20 })),
        Ic(c, 0.5, 0.17, 0.12, t.icon, p[0], { sw: 1.6 }),
        T(c, 0.1, 0.27, 0.8, 0.03, t.kicker, { color: p[0], weight: 800, ls: 0.2, align: 'center', fit: true }),
        { ...T(c, 0.06, 0.33, 0.88, 0.1, t.title, { font: 'trebuchet', weight: 800, color: p[0], align: 'center', lh: 1.02 }), gradient: { from: p[0], to: p[1], angle: 90 } },
        T(c, 0.12, 0.57, 0.76, 0.027, t.body, { color: p[2], align: 'center', lh: 1.45 }),
        Img(c, 0.25, 0.65, 0.5, 0.18, { r: 0.09 }),
        ...cta(c, 0.28, 0.87, 0.44, t.cta, p[0], '#ffffff')
      ]
    })
  };

  return FLYER_USES.flatMap((use) => (SETS[use.id] || []).map(([comp, pal, style], i) => {
    const id = `flyer-${use.id}-${i + 1}`;
    const p = PAL[pal];
    const t = TXT[use.id];
    return {
      id,
      name: `${use.label} ${i + 1}`,
      category: use.id,
      industries: [use.id],
      styles: [style],
      tags: [use.label, comp, style],
      isNew: NEW.has(id),
      popular: POPULAR.has(id),
      palette: { brand: p[0], accent: p[1], ink: p[2] },
      build: (c) => [C[comp](c, p, t, style)]
    };
  }));
}

export const FLYER_ICON_NAMES = [...new Set([...Object.values(TXT).map((t) => t.icon), 'CheckCircle2', 'BedDouble', 'Bath', 'Ruler', 'Car'])];
