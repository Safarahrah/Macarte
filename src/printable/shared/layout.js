// src/printable/shared/layout.js
'use strict';

const { getGeometry, getFont, mmToPx } = require('./spec');
const { getTemplate } = require('./templates');
const { sanitizeConfig } = require('./sanitize');

// --- TEXTE ET COORDONNÉES ---
function visibleText(config, key) {
  if (!config.visibility?.[key]) return '';
  return (config.fields?.[key] || '').trim();
}

function fullName(config) {
  return `${config.fields?.firstName || ''} ${config.fields?.lastName || ''}`.trim();
}

function contactLines(config) {
  const lines = [];
  ['phone', 'email', 'website', 'address', 'social', 'extra'].forEach((key) => {
    const value = visibleText(config, key);
    if (value) lines.push(value);
  });
  return lines;
}

function applyOverride(node, overrides) {
  const override = overrides?.[node.id];
  if (!override || node.locked) return node;
  return {
    ...node,
    x: Number.isFinite(override.x) ? override.x : node.x,
    y: Number.isFinite(override.y) ? override.y : node.y,
    w: Number.isFinite(override.w) ? override.w : node.w,
    h: Number.isFinite(override.h) ? override.h : node.h
  };
}

function constrainToDocument(node, widthMm, heightMm) {
  if (node.locked || ['rect', 'line', 'path', 'polygon', 'circle'].includes(node.type)) return node;
  const w = node.w || 10;
  const h = node.h || 6;
  return {
    ...node,
    x: Math.min(Math.max(0, node.x), Math.max(0, widthMm - w)),
    y: Math.min(Math.max(0, node.y), Math.max(0, heightMm - h))
  };
}

function buildQrNode(config, x, y, size, side) {
  if (!config.visibility?.qr) return null;
  if (side === 'back' && !config.qrOnBack) return null;
  if (side === 'front' && config.qrOnBack && config.doubleSided) {
    return null;
  }

  // Dimensions et position du QR en millimètres.
  const qrSize = Number(config.qr?.size) > 0
    ? Number(config.qr.size)
    : Number(size);

  const qrX = Number.isFinite(Number(config.qr?.x))
    && config.qr?.x !== null
    && config.qr?.x !== ''
    ? Number(config.qr.x)
    : Number(x);

  const qrY = Number.isFinite(Number(config.qr?.y))
    && config.qr?.y !== null
    && config.qr?.y !== ''
    ? Number(config.qr.y)
    : Number(y);

  return {
    id: `qr-${side}`,
    type: 'qr',
    x: qrX,
    y: qrY,
    w: qrSize,
    h: qrSize,
    selectable: true
  };
}

function buildLogoNode(config, x, y, side) {
  if (!config.visibility?.logo || !config.logo?.url) return null;
  return {
    id: `logo-${side}`, type: 'image', src: config.logo.url,
    x: config.logo.x != null ? config.logo.x : x,
    y: config.logo.y != null ? config.logo.y : y,
    w: config.logo.w || 12, h: config.logo.h || 12, selectable: true
  };
}

function textNode(id, opts) {
  return { type: 'text', selectable: true, ...opts, id };
}

function rect(id, x, y, w, h, fill, stroke) {
  return {
    id, type: 'rect', x, y, w, h, fill,
    ...(stroke ? { stroke, width: 0.35 } : {}), locked: true
  };
}

function line(id, x1, y1, x2, y2, stroke, width = 0.35, opacity) {
  return { id, type: 'line', x1, y1, x2, y2, stroke, width, locked: true, ...(opacity != null ? { opacity } : {}) };
}


// --- NOUVEAUX PRIMITIFS GRAPHIQUES (polygone, cercle, courbe, dégradé, opacité) ---
function mix(a, b, t) {
  const ok = (h) => /^#[0-9a-f]{6}$/i.test(h || '');
  if (!ok(a) || !ok(b)) return a;
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a); const B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function gradient(from, to, angle = 135) {
  return { type: 'linear', angle, stops: [[0, from], [1, to]] };
}
function poly(id, points, fill, opts = {}) {
  return { id, type: 'polygon', points, fill, locked: true, ...opts };
}
function circle(id, cx, cy, r, fill, opts = {}) {
  return { id, type: 'circle', cx, cy, r, fill, locked: true, ...opts };
}
// d = chemin SVG exprimé en millimètres
function curve(id, d, opts = {}) {
  return { id, type: 'path', d, locked: true, width: 0.3, ...opts };
}
function leaf(id, cx, cy, len, deg, wid, fill, opacity = 0.9) {
  const a = (deg * Math.PI) / 180;
  const tx = cx + len * Math.cos(a); const ty = cy + len * Math.sin(a);
  const mx = (cx + tx) / 2; const my = (cy + ty) / 2;
  const nx = -Math.sin(a) * wid; const ny = Math.cos(a) * wid;
  const f = (n) => n.toFixed(2);
  return curve(id, `M${f(cx)} ${f(cy)} Q${f(mx + nx)} ${f(my + ny)} ${f(tx)} ${f(ty)} Q${f(mx - nx)} ${f(my - ny)} ${f(cx)} ${f(cy)}Z`,
    { fill, opacity, width: 0 });
}
// Générateur pseudo-aléatoire déterministe (même rendu à l'écran et au PDF)
function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}


 // Paramètres de mise en page propres à chaque nouveau design (carte 85 x 55 mm)
const FRONT_PARAMS = {
  'luxury-gold': { nameX: 10, nameW: 65, nameY: 13, align: 'center', upper: true, spacing: 0.5, titleUpper: true, titleSpacing: 0.4,
    detailsX: 17, detailsW: 48, detailsY: 35, detailsAlign: 'center', qrSize: 13, backX: 8, backW: 69 },
  neon: { nameX: 10, nameW: 46, nameY: 14, titleY: 21, detailsX: 10, detailsY: 29, detailsW: 46, qrSize: 17, hideCompany: true, backX: 12, backW: 61 },
  artistic: { nameX: 30, nameW: 48, nameY: 15, detailsX: 30, detailsY: 37, detailsW: 48, qrSize: 14, backX: 26, backW: 52 },
  vintage: { nameX: 9, nameW: 50, nameY: 15, detailsX: 9, detailsY: 37, detailsW: 50, qrSize: 14, backX: 10, backW: 65 },
  nordic: { nameX: 12, nameW: 50, nameY: 12, detailsX: 12, detailsY: 37, detailsW: 48, qrSize: 14, backX: 14, backW: 57 },
  botanical: { nameX: 13, nameW: 45, nameY: 10, detailsX: 13, detailsY: 33, detailsW: 48, qrSize: 14, backX: 14, backW: 57 },
  'corporate-bold': { nameX: 30, nameW: 42, nameY: 10, upper: true, spacing: 0.3, detailsX: 30, detailsY: 31, detailsW: 33, qrSize: 13, backX: 30, backW: 47 },
  'minimal-ink': { nameX: 16, nameW: 48, nameY: 16, titleUpper: true, titleSpacing: 0.3, detailsX: 16, detailsY: 36, detailsW: 44, qrSize: 14, backX: 16, backW: 53 },
  'modern-gradient': { nameX: 9, nameW: 48, nameY: 13, detailsX: 9, detailsY: 36, detailsW: 46, qrSize: 15, backX: 12, backW: 61 },
  'corporate-executive': { nameX: 10, nameW: 49, nameY: 17, titleUpper: true, spacing: 0.2, detailsX: 10, detailsY: 36, detailsW: 46, qrSize: 15, backX: 12, backW: 61 },
  'luxury-noir': { nameX: 13, nameW: 45, nameY: 15, upper: true, spacing: 0.5, titleUpper: true, titleSpacing: 0.4, detailsX: 13, detailsY: 36, detailsW: 45, qrSize: 14, backX: 15, backW: 55 },
  'creative-pop': { nameX: 12, nameW: 46, nameY: 22, detailsX: 12, detailsY: 37, detailsW: 44, qrSize: 15, backX: 14, backW: 57 },
  'healthcare-clean': { nameX: 13, nameW: 45, nameY: 16, detailsX: 13, detailsY: 36, detailsW: 44, qrSize: 15, backX: 14, backW: 57 },
  'healthcare-soft': { nameX: 12, nameW: 46, nameY: 15, detailsX: 12, detailsY: 36, detailsW: 45, qrSize: 15, backX: 14, backW: 57 },
  'tech-circuit': { nameX: 10, nameW: 50, nameY: 13, titleUpper: true, detailsX: 10, detailsY: 34, detailsW: 47, qrSize: 16, hideCompany: true, backX: 12, backW: 61 },
  custom: { nameX: 9, nameW: 46, nameY: 35, detailsX: 9, detailsY: 41, detailsW: 44, detailsAlign: 'left', qrSize: 15, backX: 12, backW: 61 }
};


// --- MISE EN PAGE DES MODÈLES ---
// Chaque layout reçoit le contexte normalisé et retourne des nœuds imprimables.
function designerLayout(ctx, variant) {
  const { W, H, s, config, colors, heading, body, name, title, company, lines, slogan } = ctx;
  const back = ctx.side === 'back';
  const bgFill = variant === 'luxury-gold' ? gradient(mix(colors.background, '#ffffff', 0.07), mix(colors.background, '#000000', 0.45), 135)
    : variant === 'neon' ? gradient(colors.background, mix(colors.background, colors.secondary, 0.3), 120)
    : variant === 'artistic' ? gradient('#ffffff', colors.background, 90)
    : variant === 'modern-gradient' ? gradient(colors.background, mix(colors.background, colors.secondary, 0.55), 125)
    : variant === 'luxury-noir' ? gradient(mix(colors.background, '#ffffff', 0.06), colors.background, 135)
    : colors.background;
  const nodes = [rect('bg', 0, 0, W, H, bgFill)];

  // Imported artwork ("Importer ma carte") is used as a full-bleed background
  // layer, right above the base fill and below every editable element.
  const backgroundUrl = config.background && config.background.url;
  if (backgroundUrl) {
    nodes.push({ id: 'bg-image', type: 'image', src: backgroundUrl, x: 0, y: 0, w: W, h: H, fit: 'cover', locked: true });
  }

  // Motifs décoratifs. Ils sont dessinés avant le texte et le QR.
  switch (variant) {
    case 'minimal':
      nodes.push(line('minimal-rule', s.x, H * 0.49, W - s.x, H * 0.49, colors.primary, 0.35));
      break;
    case 'corporate':
      nodes.push(rect('corporate-sidebar', 0, 0, 22, H, colors.primary));
      nodes.push(rect('corporate-gold-rule', 22, 0, 1.2, H, colors.secondary));
      break;
    case 'modern':
      nodes.push(rect('modern-panel', W - 31, 0, 31, H, '#0f172a'));
      nodes.push(rect('modern-accent', 0, 0, W * 0.32, 7, colors.secondary));
      break;
    case 'luxury':
      nodes.push(rect('luxury-frame', 2.5, 2.5, W - 5, H - 5, 'transparent', colors.primary));
      nodes.push(line('luxury-rule', W / 2 - 12, H * 0.53, W / 2 + 12, H * 0.53, colors.primary, 0.45));
      break;
    case 'creative':
      nodes.push(rect('creative-shape', -5, -7, W * 0.43, H * 0.72, colors.primary));
      nodes.push(rect('creative-accent', W * 0.28, H - 9, W * 0.45, 14, colors.accent));
      break;
    case 'tech':
      for (let x = 0; x < W; x += 6) nodes.push(line(`tech-grid-${x}`, x, 0, x, H, '#164e63', 0.15));
      nodes.push(rect('tech-topbar', 0, 0, W, 8, '#04111d'));
      break;
    case 'luxury-gold':
      nodes.push(rect('gold-frame', 2.5, 2.5, W - 5, H - 5, 'transparent', colors.primary));
      nodes.push(rect('gold-frame-inner', 4.2, 4.2, W - 8.4, H - 8.4, 'transparent', mix(colors.primary, colors.background, 0.55)));
      [[4.2, 4.2, 1, 1], [W - 4.2, 4.2, -1, 1], [4.2, H - 4.2, 1, -1], [W - 4.2, H - 4.2, -1, -1]].forEach(([cx, cy, dx, dy], i) => {
        nodes.push(circle(`gold-dot-${i}`, cx, cy, 0.9, colors.primary));
      });
      if (!back) {
        nodes.push(line('gold-rule-l', W / 2 - 15, 29.5, W / 2 - 3, 29.5, colors.primary, 0.3));
        nodes.push(line('gold-rule-r', W / 2 + 3, 29.5, W / 2 + 15, 29.5, colors.primary, 0.3));
        nodes.push(poly('gold-diamond', [[W / 2, 28], [W / 2 + 1.5, 29.5], [W / 2, 31], [W / 2 - 1.5, 29.5]], colors.primary));
      } else {
        nodes.push(poly('gold-diamond-b', [[W / 2, H * 0.5 - 1.5], [W / 2 + 1.5, H * 0.5], [W / 2, H * 0.5 + 1.5], [W / 2 - 1.5, H * 0.5]], colors.primary));
      }
      break;
    case 'neon':
      for (let x = 6; x < W; x += 6) nodes.push(line(`neon-gx-${x}`, x, 0, x, H, colors.primary, 0.1, 0.18));
      for (let y = 6; y < H; y += 6) nodes.push(line(`neon-gy-${y}`, 0, y, W, y, colors.primary, 0.1, 0.18));
      nodes.push(circle('neon-glow-a', W - 8, 6, 22, colors.secondary, { opacity: 0.16 }));
      nodes.push(circle('neon-glow-b', 10, H - 4, 18, colors.primary, { opacity: 0.1 }));
      nodes.push(poly('neon-frame', [[4, 9], [9, 4], [W - 4, 4], [W - 4, H - 9], [W - 9, H - 4], [4, H - 4]], 'none', { stroke: colors.primary, width: 0.4 }));
      nodes.push(poly('neon-frame-glow', [[3.2, 9.4], [9.4, 3.2], [W - 3.2, 3.2], [W - 3.2, H - 9.4], [W - 9.4, H - 3.2], [3.2, H - 3.2]], 'none', { stroke: colors.primary, width: 1, opacity: 0.18 }));
      nodes.push(poly('neon-tab-top', [[9, 4], [43, 4], [39, 10.5], [4, 10.5], [4, 9]], colors.primary));
      nodes.push(poly('neon-tab-bottom', [[W - 40, H - 4], [W - 36, H - 9.5], [W - 4, H - 9.5], [W - 4, H - 4]], colors.secondary, { opacity: 0.9 }));
      nodes.push(poly('neon-corner', [[W - 4, 4], [W - 11, 4], [W - 4, 11]], colors.secondary, { opacity: 0.8 }));
      break;
    case 'artistic':
      nodes.push(curve('art-blob-a', `M0 0 L40 0 C43 9 33 16 23 20 C14 24 6 27 0 30 Z`, { fill: gradient(colors.primary, colors.secondary, 120), width: 0 }));
      nodes.push(curve('art-blob-b', `M0 0 L26 0 C27 7 18 11 10 14 C5 16 2 18 0 19 Z`, { fill: colors.accent, opacity: 0.55, width: 0 }));
      nodes.push(curve('art-wave', `M${W * 0.46} ${H + 1} C${W * 0.5} ${H - 9} ${W * 0.65} ${H - 11} ${W * 0.78} ${H - 7} C${W * 0.9} ${H - 4} ${W} ${H - 6} ${W} ${H - 6} L${W} ${H + 1} Z`, { fill: gradient(colors.secondary, colors.primary, 20), width: 0 }));
      nodes.push(circle('art-sun', W - 9, 9, 11, colors.accent, { opacity: 0.95 }));
      nodes.push(circle('art-sun-ring', W - 9, 9, 14, 'none', { stroke: colors.secondary, width: 0.25, opacity: 0.8 }));
      nodes.push(curve('art-line', `M0 42 C16 33 30 50 52 38 S76 28 ${W} 32`, { stroke: '#d9a441', width: 0.25 }));
      break;
    case 'vintage':
      nodes.push(rect('vintage-frame', 3, 3, W - 6, H - 6, 'transparent', colors.primary));
      nodes.push(rect('vintage-frame-inner', 4.6, 4.6, W - 9.2, H - 9.2, 'transparent', colors.secondary));
      { const rnd = seeded(42); for (let i = 0; i < 70; i += 1) nodes.push(circle(`paper-${i}`, rnd() * W, rnd() * H, 0.15 + rnd() * 0.3, colors.primary, { opacity: 0.07 })); }
      [[7.5, 7.5], [W - 7.5, 7.5], [7.5, H - 7.5], [W - 7.5, H - 7.5]].forEach(([cx, cy], i) => nodes.push(circle(`vintage-orn-${i}`, cx, cy, 1, colors.primary)));
      nodes.push(line('vintage-rule', 12, 12, W / 2 - 3, 12, colors.secondary, 0.35));
      nodes.push(line('vintage-rule-r', W / 2 + 3, 12, W - 12, 12, colors.secondary, 0.35));
      nodes.push(poly('vintage-diamond', [[W / 2, 10.3], [W / 2 + 1.7, 12], [W / 2, 13.7], [W / 2 - 1.7, 12]], colors.primary));
      nodes.push(line('vintage-bottom', 12, H - 10, W - 12, H - 10, colors.secondary, 0.35));
      break;
    case 'nordic':
      nodes.push(rect('nordic-band', 0, 0, 2.5, H, colors.primary));
      nodes.push(rect('nordic-band-soft', 2.5, 0, 1.2, H, colors.accent));
      nodes.push(circle('nordic-sun', W - 13, 13, 7, colors.accent, { opacity: 0.8 }));
      nodes.push(circle('nordic-sun-core', W - 13, 13, 3, colors.secondary, { opacity: 0.6 }));
      nodes.push(line('nordic-rule', 12, 34.5, 30, 34.5, colors.secondary, 0.3));
      break;
    case 'botanical':
      nodes.push(rect('botanical-band', 0, 0, 5, H, colors.primary));
      nodes.push(circle('botanical-halo', W - 8, 8, 20, colors.accent, { opacity: 0.12 }));
      nodes.push(curve('leaf-stem', `M${W - 3} 3 C${W - 11} 9 ${W - 17} 11 ${W - 26} 17`, { stroke: colors.primary, width: 0.4 }));
      [[W - 7, 5.5, 9, 175, 2], [W - 11, 8, 9, 215, 2], [W - 14, 10, 9, 150, 2.2], [W - 18, 12.2, 9, 195, 2.2], [W - 22, 14.5, 8, 160, 2], [W - 26, 17, 8, 200, 2]].forEach(([cx, cy, len, deg, wid], i) => nodes.push(leaf(`leaf-${i}`, cx, cy, len, deg, wid, i % 2 ? colors.secondary : colors.primary, 0.85)));
      nodes.push(curve('botanical-fern', `M7 ${H - 3} C9 ${H - 14} 12 ${H - 20} 11 ${H - 30}`, { stroke: colors.secondary, width: 0.3 }));
      [[8, H - 8, 5, 300, 1.2], [9.5, H - 13, 5, 240, 1.2], [10.5, H - 18, 5, 300, 1.2], [11, H - 24, 4.5, 235, 1.1]].forEach(([cx, cy, len, deg, wid], i) => nodes.push(leaf(`fern-${i}`, cx, cy, len, deg, wid, colors.secondary, 0.7)));
      break;
    case 'corporate-bold':
      nodes.push(poly('cb-navy', [[0, 0], [W * 0.3, 0], [W * 0.18, H], [0, H]], colors.primary));
      nodes.push(poly('cb-gray', [[W * 0.3, 0], [W * 0.345, 0], [W * 0.225, H], [W * 0.18, H]], '#e5e7eb'));
      nodes.push(poly('cb-orange', [[W * 0.345, 0], [W * 0.365, 0], [W * 0.245, H], [W * 0.225, H]], colors.secondary));
      nodes.push(poly('cb-top-right', [[W - 14, 0], [W, 0], [W, 14]], colors.secondary));
      nodes.push(poly('cb-bottom-right', [[W, H], [W - 18, H], [W, H - 14]], colors.primary));
      nodes.push(rect('cb-bar', W - 3, 22, 1.2, 11, colors.secondary));
      break;
    case 'editorial':
      nodes.push(rect('editorial-block', 0, 0, W * 0.27, H * 0.24, colors.primary));
      nodes.push(rect('editorial-corner', W - 5, H * 0.55, 5, H * 0.45, colors.accent));
      nodes.push(line('editorial-rule', 8, H * 0.48, W - 8, H * 0.48, colors.secondary, 0.3));
      break;
    case 'minimal-ink':
      nodes.push(rect('ink-rule', 9.5, 9, 1.4, H - 18, colors.primary));
      nodes.push(rect('ink-accent', W - 34, H - 11.5, 25, 1.4, colors.secondary));
      break;
    case 'modern-gradient':
      nodes.push(circle('mg-blob-a', W - 5, 5, 25, colors.accent, { opacity: 0.28 }));
      nodes.push(circle('mg-blob-b', 13, H - 3, 19, colors.secondary, { opacity: 0.22 }));
      nodes.push(rect('mg-spine', 0, 0, 2.6, H, colors.secondary));
      break;
    case 'corporate-executive':
      nodes.push(rect('exec-band', 0, 0, W, 11, colors.primary));
      nodes.push(rect('exec-hairline', 0, 11, W, 0.9, colors.secondary));
      nodes.push(rect('exec-accent', 10, H - 10, 20, 1, colors.secondary));
      break;
    case 'luxury-noir':
      nodes.push(rect('noir-frame', 3, 3, W - 6, H - 6, 'none', colors.secondary));
      nodes.push(line('noir-rule', 13, 12.5, 31, 12.5, colors.primary, 0.3));
      nodes.push(poly('noir-diamond', [[W - 13, 11.5], [W - 11.5, 13], [W - 13, 14.5], [W - 14.5, 13]], colors.primary));
      break;
    case 'creative-pop':
      nodes.push(poly('pop-corner', [[0, 0], [W * 0.3, 0], [0, H * 0.34]], colors.primary));
      nodes.push(rect('pop-stripe', 0, H - 9, W * 0.46, 4.5, colors.secondary));
      nodes.push(circle('pop-dot-a', W - 10, 9, 5, colors.accent, { opacity: 0.9 }));
      nodes.push(circle('pop-dot-b', W - 16, 14, 2.4, colors.primary, { opacity: 0.85 }));
      break;
    case 'healthcare-clean':
      nodes.push(rect('hc-band', 0, 0, 4.5, H, colors.primary));
      nodes.push(rect('hc-cross-v', W - 16, 10, 2.4, 7.5, colors.accent));
      nodes.push(rect('hc-cross-h', W - 18.2, 12.5, 6.2, 2.4, colors.accent));
      nodes.push(circle('hc-halo', 11, H - 7, 14, colors.secondary, { opacity: 0.14 }));
      break;
    case 'healthcare-soft':
      nodes.push(circle('hs-blob-a', W - 3, 3, 21, colors.accent, { opacity: 0.35 }));
      nodes.push(circle('hs-blob-b', 9, H - 2, 15, colors.secondary, { opacity: 0.5 }));
      nodes.push(rect('hs-accent', 12, 9, 13, 1.4, colors.primary));
      break;
    case 'tech-circuit': {
      nodes.push(rect('cir-spine', 0, 0, 3, H, colors.primary));
      const rnd = seeded(7);
      for (let i = 0; i < 22; i += 1) {
        const gx = 6 + Math.round((rnd() * (W - 12)) / 6) * 6;
        const gy = 4 + Math.round((rnd() * (H - 8)) / 6) * 6;
        const len = 6 + Math.round(rnd() * 2) * 6;
        if (rnd() > 0.5) nodes.push(line(`cir-h-${i}`, gx, gy, Math.min(W, gx + len), gy, colors.primary, 0.15, 0.45));
        else nodes.push(line(`cir-v-${i}`, gx, gy, gx, Math.min(H, gy + len), colors.primary, 0.15, 0.45));
        nodes.push(circle(`cir-n-${i}`, gx, gy, 0.55, colors.primary, { opacity: 0.7 }));
      }
      break;
    }
    case 'custom':
      // No decoration: the imported artwork is the whole background.
      break;
  }

  const P = FRONT_PARAMS[variant] || {};
  if (back) {
    const bx = P.backX != null ? P.backX : 8;
    const bw = P.backW != null ? P.backW : W - 16;
    const logo = buildLogoNode(config, bx + (bw - 12) / 2, 5, 'back');
    if (logo) nodes.push(logo);
    nodes.push(textNode('slogan', {
      x: bx, y: H * 0.32, w: bw, h: 12,
      text: P.upper ? String(slogan || company || name).toUpperCase() : (slogan || company || name), spacing: P.spacing, font: heading.pdfBold || heading.pdf,
      cssFont: heading.css, size: variant === 'tech' ? 8 : 11,
      color: colors.text, align: 'center', bold: true
    }));
    if (company) nodes.push(textNode('back-company', {
      x: bx, y: H * 0.56, w: bw, h: 7, text: company,
      font: body.pdf, cssFont: body.css, size: 6.5,
      color: colors.secondary, align: 'center'
    }));
    const qr = buildQrNode(config, bx + (bw - 16) / 2, H - 20, 16, 'back');
    if (qr) nodes.push(qr);
    return nodes;
  }

  const contentX = P.nameX != null ? P.nameX : variant === 'corporate' ? 28 : variant === 'corporate-bold' ? 13 : 8;
  const rightPanel = ['modern'].includes(variant) ? 34 : 0;
  const qrSize = P.qrSize || (variant === 'tech' ? 20 : 15);
  const qrX = P.qrX != null ? P.qrX : variant === 'creative' ? 7 : W - qrSize - 6;
  const qrY = P.qrY != null ? P.qrY : H - qrSize - 5;
  const textW = P.nameW || Math.max(20, Math.min(W - contentX - qrSize - 12, qrX - contentX - 4));
  const nameY = P.nameY != null ? P.nameY : ['luxury', 'luxury-gold'].includes(variant) ? 14 : variant === 'tech' ? 11 : 7;
  const textColor = colors.text;
  const align = P.align || config.alignment || 'left';
  const up = (t, on) => (on ? String(t).toUpperCase() : t);

  if (variant === 'corporate') {
    nodes.push(textNode('company-side', {
      x: 3, y: H - 25, w: 16, h: 18, text: company,
      font: body.pdfBold || body.pdf, cssFont: body.css, size: 5.5,
      color: '#ffffff', align: 'left', lines: true
    }));
  }

  if (variant === 'tech') nodes.push(textNode('tech-company', {
    x: 8, y: 2, w: W - 18, h: 5,
    text: (company || 'DIGITAL CARD').toUpperCase(), font: heading.pdfBold || heading.pdf,
    cssFont: heading.css, size: 6, color: colors.primary, align: 'left', bold: true
  }));

  if (variant === 'neon') nodes.push(textNode('neon-company', {
    x: 7, y: 5.2, w: 32, h: 4, text: (company || 'COMPANY').toUpperCase(),
    font: heading.pdfBold || heading.pdf, cssFont: heading.css, size: 5.5,
    color: '#04111d', align: 'left', bold: true, spacing: 0.3
  }));

  if (variant === 'neon' && slogan) nodes.push(textNode('neon-slogan', {
    x: W - 38, y: H - 8.6, w: 32, h: 4, text: slogan, font: body.pdf, cssFont: body.css,
    size: 5, color: '#07111F', align: 'center'
  }));

  const logo = buildLogoNode(config, variant === 'luxury-gold' ? (W - 12) / 2 : contentX, variant === 'luxury-gold' ? 6 : 5, 'front');
  if (logo && variant !== 'luxury-gold') nodes.push(logo);

  nodes.push(textNode('name', {
    x: contentX, y: nameY, w: textW - rightPanel, h: 10,
    text: up(name || 'Your name', P.upper), font: heading.pdfBold || heading.pdf,
    cssFont: heading.css, size: config.typeScale.name,
    color: variant === 'neon' ? colors.primary : textColor, align, bold: true, spacing: P.spacing
  }));

  if (title) nodes.push(textNode('title', {
    x: contentX, y: P.titleY != null ? P.titleY : nameY + 11, w: textW - rightPanel, h: 6,
    text: up(title, P.titleUpper), font: body.pdf, cssFont: body.css,
    size: config.typeScale.title, color: colors.secondary, align, spacing: P.titleSpacing
  }));

  if (company && variant !== 'tech' && variant !== 'corporate' && !P.hideCompany && variant !== 'luxury-gold') nodes.push(textNode('company', {
    x: contentX, y: nameY + (title ? 18 : 11), w: textW - rightPanel, h: 6,
    text: company, font: body.pdf, cssFont: body.css,
    size: config.typeScale.body, color: textColor, align
  }));

  nodes.push(textNode('details', {
    x: P.detailsX != null ? P.detailsX : contentX,
    y: P.detailsY != null ? P.detailsY : Math.max(nameY + (title || company ? 22 : 14), H * 0.53),
    w: (P.detailsW || textW) - rightPanel, h: Math.max(8, H * 0.38),
    text: lines.join('\n'), font: body.pdf, cssFont: body.css,
    size: config.typeScale.body, color: textColor, align: P.detailsAlign || 'left', lines: true
  }));

  const qr = buildQrNode(config, qrX, qrY, qrSize, 'front');
  if (qr) nodes.push(qr);
  return nodes;
}

const LAYOUT_ENGINES = {
  minimal: (ctx) => designerLayout(ctx, 'minimal'),
  corporate: (ctx) => designerLayout(ctx, 'corporate'),
  modern: (ctx) => designerLayout(ctx, 'modern'),
  luxury: (ctx) => designerLayout(ctx, 'luxury'),
  creative: (ctx) => designerLayout(ctx, 'creative'),
  tech: (ctx) => designerLayout(ctx, 'tech'),
  'luxury-gold': (ctx) => designerLayout(ctx, 'luxury-gold'),
  neon: (ctx) => designerLayout(ctx, 'neon'),
  artistic: (ctx) => designerLayout(ctx, 'artistic'),
  vintage: (ctx) => designerLayout(ctx, 'vintage'),
  nordic: (ctx) => designerLayout(ctx, 'nordic'),
  botanical: (ctx) => designerLayout(ctx, 'botanical'),
  'corporate-bold': (ctx) => designerLayout(ctx, 'corporate-bold'),
  editorial: (ctx) => designerLayout(ctx, 'editorial'),
  'minimal-ink': (ctx) => designerLayout(ctx, 'minimal-ink'),
  'modern-gradient': (ctx) => designerLayout(ctx, 'modern-gradient'),
  'corporate-executive': (ctx) => designerLayout(ctx, 'corporate-executive'),
  'luxury-noir': (ctx) => designerLayout(ctx, 'luxury-noir'),
  'creative-pop': (ctx) => designerLayout(ctx, 'creative-pop'),
  'healthcare-clean': (ctx) => designerLayout(ctx, 'healthcare-clean'),
  'healthcare-soft': (ctx) => designerLayout(ctx, 'healthcare-soft'),
  'tech-circuit': (ctx) => designerLayout(ctx, 'tech-circuit'),
  custom: (ctx) => designerLayout(ctx, 'custom')
};

// --- CONSTRUCTION DU RECTO ET DU VERSO ---
function buildSide(config, side, publicUrl) {
  const geometry = getGeometry(config.formatId);
  const template = getTemplate(config.templateId);
  const heading = getFont(config.fonts.heading);
  const body = getFont(config.fonts.body);
  const ctx = {
    side,
    W: geometry.document.widthMm,
    H: geometry.document.heightMm,
    s: geometry.safety,
    config,
    colors: config.colors || template.colors,
    heading,
    body,
    name: fullName(config) || 'Your name',
    title: visibleText(config, 'title'),
    company: visibleText(config, 'company'),
    lines: contactLines(config),
    slogan: visibleText(config, 'slogan'),
    publicUrl
  };
  const builder = LAYOUT_ENGINES[template.id] || LAYOUT_ENGINES.minimal;
  
let nodes = builder(ctx).filter(Boolean);

// Éléments ajoutés par l'utilisateur (texte libre, image) — dessinés par-dessus.
const extras = Array.isArray(config.customElements) ? config.customElements : [];
extras.forEach((el) => {
  if (el.type === 'image' && el.src) {
    nodes.push({ id: el.id, type: 'image', src: el.src, x: el.x, y: el.y, w: el.w, h: el.h, fit: el.fit, selectable: true });
  } else if (el.type === 'text' && typeof el.text === 'string') {
    const font = getFont(el.font);
    nodes.push(textNode(el.id, {
      x: el.x, y: el.y, w: el.w, h: el.h,
      text: el.text,
      font: el.bold ? (font.pdfBold || font.pdf) : font.pdf,
      cssFont: font.css,
      size: el.size, color: el.color, align: el.align,
      bold: el.bold, italic: el.italic, spacing: el.spacing,
      lines: true
    }));
  }
});

nodes = nodes.map((node) => {
  // Appliquer les positions enregistrées aux autres éléments.
  if (node.type !== 'qr') {
    return applyOverride(node, config.elementOverrides);
  }

  // Le QR reste carré. La taille vient de config.qr.size (ou de la valeur du
  // modèle), la position de config.qr.x/y, puis des déplacements manuels.
  const qrSize = Number(config.qr?.size) > 0
    ? Number(config.qr.size)
    : (Number(node.w) > 0 ? Number(node.w) : 14);
  const margin = 5;
  const hasX = config.qr?.x != null && config.qr.x !== '' && Number.isFinite(Number(config.qr.x));
  const hasY = config.qr?.y != null && config.qr.y !== '' && Number.isFinite(Number(config.qr.y));

  let placed = {
    ...node,
    w: qrSize,
    h: qrSize,
    x: hasX ? Number(config.qr.x) : ctx.W - qrSize - margin,
    y: hasY ? Number(config.qr.y) : ctx.H - qrSize - margin
  };

  const override = config.elementOverrides?.[node.id];
  if (override) {
    placed = {
      ...placed,
      x: Number.isFinite(override.x) ? override.x : placed.x,
      y: Number.isFinite(override.y) ? override.y : placed.y,
      w: Number.isFinite(override.w) ? override.w : placed.w,
      h: Number.isFinite(override.w) ? override.w : placed.h
    };
  }

  return placed;
});

nodes = nodes.map((node) => constrainToDocument(node, ctx.W, ctx.H));

  return nodes;
}

function buildLayout(rawConfig, publicUrl) {
  const config = sanitizeConfig(rawConfig);
  const geometry = getGeometry(config.formatId);
  const sides = { front: buildSide(config, 'front', publicUrl) };
  if (config.doubleSided) sides.back = buildSide(config, 'back', publicUrl);
  return { config, geometry, publicUrl: publicUrl || '', sides };
}

// --- APERÇU CANVAS HTML5 ---
// Résout un remplissage : couleur simple ou dégradé { type:'linear', angle, stops }
function resolveFill(c, fill, bx, by, bw, bh) {
  if (!fill || typeof fill === 'string') return fill;
  const a = ((fill.angle || 0) * Math.PI) / 180;
  const cx = bx + bw / 2; const cy = by + bh / 2;
  const half = (Math.abs(Math.cos(a)) * bw + Math.abs(Math.sin(a)) * bh) / 2;
  const g = c.createLinearGradient(cx - Math.cos(a) * half, cy - Math.sin(a) * half, cx + Math.cos(a) * half, cy + Math.sin(a) * half);
  fill.stops.forEach(([o, col]) => g.addColorStop(o, col));
  return g;
}

function paint(c, node, scale, bbox) {
  const [bx, by, bw, bh] = bbox;
  if (node.fill && node.fill !== 'none' && node.fill !== 'transparent') {
    c.fillStyle = resolveFill(c, node.fill, bx, by, bw, bh);
    c.fill();
  }
  if (node.stroke && node.width !== 0) {
    c.strokeStyle = node.stroke;
    c.lineWidth = (node.width || 0.1) * scale;
    c.stroke();
  }
}

function renderToCanvas(ctx2d, nodes, geometry, dpi = 300) {
  const scale = mmToPx(1, dpi);
  const widthPx = geometry.document.widthMm * scale;
  const heightPx = geometry.document.heightMm * scale;
  ctx2d.clearRect(0, 0, widthPx, heightPx);

  nodes.forEach((node) => {
    const x = (node.x || 0) * scale;
    const y = (node.y || 0) * scale;
    const w = (node.w || 0) * scale;
    const h = (node.h || 0) * scale;
    ctx2d.save();
    if (node.opacity != null) ctx2d.globalAlpha = node.opacity;

    switch (node.type) {
      case 'rect':
        ctx2d.beginPath();
        ctx2d.rect(x, y, w, h);
        paint(ctx2d, node, scale, [x, y, w, h]);
        break;
      case 'polygon': {
        const pts = node.points.map(([px, py]) => [px * scale, py * scale]);
        const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
        ctx2d.beginPath();
        pts.forEach(([px, py], i) => (i ? ctx2d.lineTo(px, py) : ctx2d.moveTo(px, py)));
        ctx2d.closePath();
        paint(ctx2d, node, scale, [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]);
        break;
      }
      case 'circle': {
        const r = node.r * scale;
        ctx2d.beginPath();
        ctx2d.arc(node.cx * scale, node.cy * scale, r, 0, Math.PI * 2);
        paint(ctx2d, node, scale, [node.cx * scale - r, node.cy * scale - r, r * 2, r * 2]);
        break;
      }
      case 'path': {
        // Path2D est défini en mm : on met le contexte à l'échelle pour tracer
        const p = new Path2D(node.d);
        ctx2d.save();
        ctx2d.scale(scale, scale);
        if (node.fill && node.fill !== 'none') {
          ctx2d.fillStyle = resolveFill(ctx2d, node.fill, 0, 0, geometry.document.widthMm, geometry.document.heightMm);
          ctx2d.fill(p);
        }
        if (node.stroke && node.width !== 0) {
          ctx2d.strokeStyle = node.stroke;
          ctx2d.lineWidth = node.width || 0.1;
          ctx2d.lineCap = 'round';
          ctx2d.stroke(p);
        }
        ctx2d.restore();
        break;
      }
      case 'line':
        ctx2d.beginPath();
        ctx2d.moveTo(node.x1 * scale, node.y1 * scale);
        ctx2d.lineTo(node.x2 * scale, node.y2 * scale);
        ctx2d.strokeStyle = node.stroke || '#000000';
        ctx2d.lineWidth = (node.width || 0.1) * scale;
        ctx2d.stroke();
        break;
      case 'text': {
        ctx2d.fillStyle = node.color || '#000000';
        ctx2d.font = `${node.bold ? 'bold ' : ''}${(node.size || 6) * scale}px ${node.cssFont || 'sans-serif'}`;
        ctx2d.textAlign = node.align || 'left';
        ctx2d.textBaseline = 'top';
        if (node.spacing && 'letterSpacing' in ctx2d) ctx2d.letterSpacing = `${node.spacing * scale}px`;
        const textX = node.align === 'center' ? x + w / 2 : node.align === 'right' ? x + w : x;
        if (node.lines) {
          const lineHeight = (node.size || 6) * scale * 1.2;
          String(node.text || '').split('\n').forEach((textLine, i) => {
            ctx2d.fillText(textLine, textX, y + i * lineHeight, w);
          });
        } else {
          ctx2d.fillText(node.text || '', textX, y, w);
        }
        break;
      }
      case 'image':
        if (node._loadedImage) {
          ctx2d.drawImage(node._loadedImage, x, y, w, h);
        } else {
          ctx2d.fillStyle = '#eeeeee';
          ctx2d.fillRect(x, y, w, h);
          ctx2d.fillStyle = '#999999';
          ctx2d.font = `${scale * 2}px sans-serif`;
          ctx2d.textAlign = 'center';
          ctx2d.fillText('IMG', x + w / 2, y + h / 2);
        }
        break;
      case 'qr':
        // Placeholder d'aperçu : le composant React doit le remplacer par le QR réel.
        ctx2d.fillStyle = '#ffffff';
        ctx2d.fillRect(x, y, w, h);
        ctx2d.fillStyle = '#000000';
        ctx2d.fillRect(x + w * 0.1, y + h * 0.1, w * 0.8, h * 0.8);
        break;
      default:
        break;
    }
    ctx2d.restore();
  });
}

module.exports = {
  buildLayout,
  buildSide,
  renderToCanvas,
  fullName,
  contactLines
};