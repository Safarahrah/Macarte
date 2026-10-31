// src/design/shared/modules.js
// Declarative definition of every design module (formats, units, pages, print
// guides and allowed exports). Shared by the editor, the API and the sanitizer.

export const DESIGN_TYPES = ['pocket', 'logo', 'flyer', 'poster', 'social_design', 'other'];

const mm = (id, label, width, height, extra = {}) => ({ id, label, width, height, unit: 'mm', ...extra });
const px = (id, label, width, height, extra = {}) => ({ id, label, width, height, unit: 'px', ...extra });

const PRINT_EXPORTS = ['pdf', 'png', 'jpg'];
const SCREEN_EXPORTS = ['png', 'jpg'];

export const POCKET_PAGES = [
  { id: 'front', name: 'Recto (couverture)' },
  { id: 'back', name: 'Verso (dos)' },
  { id: 'inside-left', name: 'Intérieur gauche' },
  { id: 'inside-right', name: 'Intérieur droit + rabat' }
];

export const SOCIAL_PLATFORMS = [
  {
    id: 'instagram', label: 'Instagram', formats: [
      px('ig-square', 'Publication carrée', 1080, 1080),
      px('ig-portrait', 'Publication portrait', 1080, 1350),
      px('ig-story', 'Story', 1080, 1920),
      px('ig-reel', 'Reel (couverture)', 1080, 1920),
      px('ig-highlight', 'Couverture de story à la une', 1080, 1080)
    ]
  },
  {
    id: 'facebook', label: 'Facebook', formats: [
      px('fb-post', 'Publication', 1200, 630),
      px('fb-post-square', 'Publication carrée', 1080, 1080),
      px('fb-story', 'Story', 1080, 1920),
      px('fb-cover', 'Couverture de page', 1640, 624),
      px('fb-event', 'Couverture d’événement', 1920, 1005),
      px('fb-ad', 'Publicité', 1080, 1080)
    ]
  },
  {
    id: 'linkedin', label: 'LinkedIn', formats: [
      px('li-post', 'Publication', 1200, 627),
      px('li-banner', 'Bannière de profil', 1584, 396),
      px('li-profile', 'Photo de profil', 400, 400)
    ]
  },
  {
    id: 'pinterest', label: 'Pinterest', formats: [
      px('pin-pin', 'Épingle', 1000, 1500),
      px('pin-cover', 'Couverture de tableau', 600, 600)
    ]
  },
  {
    id: 'tiktok', label: 'TikTok', formats: [
      px('tt-post', 'Publication', 1080, 1920),
      px('tt-cover', 'Couverture vidéo', 1080, 1920),
      px('tt-profile', 'Visuel de profil', 720, 720)
    ]
  },
  {
    id: 'youtube', label: 'YouTube', formats: [
      px('yt-thumbnail', 'Miniature', 1280, 720),
      px('yt-banner', 'Bannière de chaîne', 2560, 1440),
      px('yt-shorts', 'Shorts', 1080, 1920),
      px('yt-channel', 'Photo de chaîne', 800, 800)
    ]
  },
  { id: 'x', label: 'X', formats: [px('x-post', 'Publication', 1600, 900), px('x-header', 'En-tête', 1500, 500)] },
  { id: 'whatsapp', label: 'WhatsApp', formats: [px('wa-status', 'Statut', 1080, 1920), px('wa-profile', 'Photo de profil', 500, 500)] },
  { id: 'twitch', label: 'Twitch', formats: [px('tw-banner', 'Bannière de profil', 1200, 480), px('tw-offline', 'Écran hors ligne', 1920, 1080)] },
  { id: 'snapchat', label: 'Snapchat', formats: [px('sc-story', 'Story', 1080, 1920)] },
  { id: 'tumblr', label: 'Tumblr', formats: [px('tb-post', 'Publication', 1280, 1920), px('tb-header', 'En-tête', 3000, 1055)] },
  { id: 'soundcloud', label: 'SoundCloud', formats: [px('sc-banner', 'Bannière', 2480, 520), px('sc-artwork', 'Pochette de piste', 800, 800)] }
];

export const OTHER_KINDS = [
  { id: 'email-signature', label: 'Signature email', icon: 'Mail', formats: [px('sig', 'Signature', 600, 200)], exports: ['png', 'jpg', 'svg'] },
  { id: 'qr-code', label: 'QR code personnalisé', icon: 'QrCode', formats: [px('qr-square', 'Carré', 1000, 1000), mm('qr-sticker', 'Autocollant 50 mm', 50, 50, { bleed: 2 })], exports: ['png', 'svg', 'pdf', 'jpg'] },
  { id: 'postcard', label: 'Carte postale', icon: 'Mails', formats: [mm('postcard-a6', 'A6 (148 × 105 mm)', 148, 105), mm('postcard-us', '6 × 4 po', 152, 102)], pages: ['Recto', 'Verso'], exports: PRINT_EXPORTS },
  { id: 'thank-you', label: 'Carte de remerciement', icon: 'Heart', formats: [mm('thanks-a6', 'A6 (105 × 148 mm)', 105, 148), mm('thanks-sq', 'Carrée 140 mm', 140, 140)], pages: ['Recto', 'Verso'], exports: PRINT_EXPORTS },
  { id: 'invitation', label: 'Invitation', icon: 'Calendar', formats: [mm('invite-5x7', '5 × 7 po', 127, 178), mm('invite-a5', 'A5', 148, 210)], pages: ['Recto', 'Verso'], exports: PRINT_EXPORTS },
  { id: 'gift-certificate', label: 'Certificat cadeau', icon: 'Gift', formats: [mm('gift-dl', 'DL (210 × 99 mm)', 210, 99), mm('gift-a5', 'A5 paysage', 210, 148)], exports: PRINT_EXPORTS },
  { id: 'presentation', label: 'Présentation', icon: 'Monitor', formats: [px('slides-169', '16:9 (1920 × 1080)', 1920, 1080), px('slides-43', '4:3 (1024 × 768)', 1024, 768)], freePages: true, exports: ['pdf', 'png', 'jpg'] },
  { id: 'menu', label: 'Menu de restaurant', icon: 'UtensilsCrossed', formats: [mm('menu-a4', 'A4', 210, 297), mm('menu-dl', 'DL (99 × 210 mm)', 99, 210), mm('menu-a3', 'A3', 297, 420)], freePages: true, exports: PRINT_EXPORTS },
  { id: 'invoice', label: 'Facture', icon: 'FileText', formats: [mm('invoice-a4', 'A4', 210, 297, { bleed: 0 }), mm('invoice-letter', 'Lettre US', 216, 279, { bleed: 0 })], freePages: true, exports: ['pdf', 'png', 'jpg'] },
  { id: 'resume', label: 'CV', icon: 'Contact', formats: [mm('cv-a4', 'A4', 210, 297, { bleed: 0 }), mm('cv-letter', 'Lettre US', 216, 279, { bleed: 0 })], freePages: true, exports: ['pdf', 'png', 'jpg'] },
  { id: 'banner', label: 'Bannière', icon: 'Flag', formats: [px('banner-web', 'Web 1500 × 500', 1500, 500), px('banner-leader', 'Leaderboard 728 × 90', 728, 90), mm('banner-rollup', 'Roll-up 850 × 2000 mm', 850, 2000, { bleed: 5 })], exports: ['png', 'jpg', 'pdf'] },
  { id: 'illustration', label: 'Illustration', icon: 'PenTool', formats: [px('illu-square', 'Carrée 2000 px', 2000, 2000), px('illu-land', 'Paysage 2400 × 1600', 2400, 1600)], exports: ['png', 'jpg', 'svg', 'pdf'] },
  { id: 'icon', label: 'Icône', icon: 'Sparkles', formats: [px('icon-512', '512 × 512', 512, 512), px('icon-1024', '1024 × 1024', 1024, 1024)], transparent: true, exports: ['png', 'svg'] },
  { id: 'zoom-background', label: 'Arrière-plan Zoom', icon: 'Video', formats: [px('zoom-hd', '1920 × 1080', 1920, 1080)], exports: ['png', 'jpg'] },
  { id: 'video', label: 'Vidéo & animation', icon: 'Clapperboard', formats: [px('video-169', 'Paysage 16:9', 1920, 1080), px('video-916', 'Vertical 9:16', 1080, 1920), px('video-sq', 'Carré', 1080, 1080)], freePages: true, exports: ['webm', 'png', 'jpg'] }
];

export const DESIGN_MODULES = {
  pocket: {
    type: 'pocket',
    slug: 'pochettes',
    api: '/api/pockets',
    label: 'Pochettes publicitaires',
    singular: 'pochette',
    description: 'Pochettes à rabat avec recto, verso, panneaux intérieurs et aperçu du pliage.',
    icon: 'FolderOpen',
    bleed: 3,
    safe: 5,
    flap: 100,
    formats: [
      mm('folder-a4', 'Pochette A4 (220 × 310 mm)', 220, 310),
      mm('folder-9x12', 'Pochette 9 × 12 po (229 × 305 mm)', 229, 305),
      mm('folder-a5', 'Pochette A5 (160 × 220 mm)', 160, 220)
    ],
    fixedPages: POCKET_PAGES,
    spreads: [['back', 'front'], ['inside-left', 'inside-right']],
    exports: PRINT_EXPORTS,
    customFormat: true
  },
  logo: {
    type: 'logo',
    slug: 'logos',
    api: '/api/logos',
    label: 'Logos',
    singular: 'logo',
    description: 'Générateur et éditeur de logos vectoriels avec variantes et aperçus sur fond.',
    icon: 'Gem',
    bleed: 0,
    safe: 0,
    transparent: true,
    formats: [
      px('logo-square', 'Carré (1000 × 1000)', 1000, 1000),
      px('logo-horizontal', 'Horizontal (1600 × 800)', 1600, 800),
      px('logo-vertical', 'Vertical (800 × 1200)', 800, 1200)
    ],
    exports: ['png', 'png-hd', 'svg', 'pdf'],
    customFormat: true
  },
  flyer: {
    type: 'flyer',
    slug: 'flyers',
    api: '/api/flyers',
    label: 'Flyers',
    singular: 'flyer',
    description: 'Flyers recto ou recto-verso aux formats A4, A5, A6, DL ou personnalisés.',
    icon: 'FileText',
    bleed: 3,
    safe: 4,
    formats: [
      mm('a4', 'A4 (210 × 297 mm)', 210, 297),
      mm('a5', 'A5 (148 × 210 mm)', 148, 210),
      mm('a6', 'A6 (105 × 148 mm)', 105, 148),
      mm('dl', 'DL (99 × 210 mm)', 99, 210),
      mm('letter', 'Lettre US (216 × 279 mm)', 216, 279)
    ],
    pages: ['Recto'],
    optionalBack: true,
    exports: PRINT_EXPORTS,
    customFormat: true
  },
  poster: {
    type: 'poster',
    slug: 'affiches',
    api: '/api/posters',
    label: 'Affiches',
    singular: 'affiche',
    description: 'Affiches grand format A3, A2, A1 ou personnalisées, prêtes pour l’impression.',
    icon: 'Image',
    bleed: 3,
    safe: 10,
    formats: [
      mm('a3', 'A3 (297 × 420 mm)', 297, 420),
      mm('a2', 'A2 (420 × 594 mm)', 420, 594),
      mm('a1', 'A1 (594 × 841 mm)', 594, 841),
      mm('poster-18x24', '18 × 24 po (457 × 610 mm)', 457, 610)
    ],
    pages: ['Affiche'],
    exports: PRINT_EXPORTS,
    customFormat: true
  },
  social_design: {
    type: 'social_design',
    slug: 'reseaux-sociaux',
    api: '/api/social-designs',
    label: 'Publications sociales',
    singular: 'publication',
    description: 'Visuels aux dimensions de chaque réseau, avec adaptation vers d’autres formats.',
    icon: 'Share2',
    bleed: 0,
    safe: 0,
    platforms: SOCIAL_PLATFORMS,
    formats: SOCIAL_PLATFORMS.flatMap((p) => p.formats.map((f) => ({ ...f, platform: p.id, group: p.label }))),
    freePages: true,
    exports: SCREEN_EXPORTS,
    customFormat: true
  },
  other: {
    type: 'other',
    slug: 'autres',
    api: '/api/other-designs',
    label: 'Autres créations',
    singular: 'création',
    description: 'Signatures email, QR codes, invitations, menus, CV, présentations, vidéos…',
    icon: 'Shapes',
    bleed: 0,
    safe: 0,
    kinds: OTHER_KINDS,
    formats: OTHER_KINDS.flatMap((k) => k.formats.map((f) => ({ ...f, kind: k.id, group: k.label }))),
    exports: ['png', 'jpg', 'pdf', 'svg'],
    customFormat: true
  }
};

export const MODULE_LIST = DESIGN_TYPES.map((t) => DESIGN_MODULES[t]);

export function getModuleBySlug(slug) {
  return MODULE_LIST.find((m) => m.slug === slug) || null;
}

export function getModule(type) {
  return DESIGN_MODULES[type] || null;
}

export function getKind(subtype) {
  return OTHER_KINDS.find((k) => k.id === subtype) || null;
}

export function findFormat(type, formatId, subtype) {
  const mod = getModule(type);
  if (!mod) return null;
  const pool = type === 'other' && getKind(subtype) ? getKind(subtype).formats : mod.formats;
  return pool.find((f) => f.id === formatId) || null;
}

/** Exports allowed for a module / subtype (e.g. WebM only for video). */
export function getExports(type, subtype) {
  if (type === 'other') {
    const kind = getKind(subtype);
    if (kind && kind.exports) return kind.exports;
  }
  return (getModule(type) || {}).exports || ['png'];
}

/** Print parameters (bleed / safety margin) for a document. */
export function getPrintSpec(type, unit, format, subtype) {
  const mod = getModule(type) || {};
  if (unit !== 'mm') return { bleed: 0, safe: 0 };
  const kindBleed = format && typeof format.bleed === 'number' ? format.bleed : null;
  const bleed = kindBleed !== null ? kindBleed : (mod.bleed || (type === 'other' ? 3 : 0));
  const safe = mod.safe || (type === 'other' ? 4 : 0);
  return { bleed, safe };
}

/** Default page names for a new document. */
export function getDefaultPages(type, subtype) {
  const mod = getModule(type);
  if (!mod) return ['Page 1'];
  if (mod.fixedPages) return mod.fixedPages.map((p) => p.name);
  if (type === 'other') {
    const kind = getKind(subtype);
    if (kind && kind.pages) return kind.pages;
    return ['Page 1'];
  }
  return mod.pages || ['Page 1'];
}

export function allowsFreePages(type, subtype) {
  if (type === 'other') return Boolean(getKind(subtype)?.freePages);
  return Boolean(getModule(type)?.freePages);
}

export function isTransparentByDefault(type, subtype) {
  if (type === 'other') return Boolean(getKind(subtype)?.transparent);
  return Boolean(getModule(type)?.transparent);
}
