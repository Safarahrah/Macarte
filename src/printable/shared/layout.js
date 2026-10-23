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
  if (node.locked || ['rect', 'line', 'path'].includes(node.type)) return node;
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
  if (side === 'front' && config.qrOnBack && config.doubleSided) return null;
  return {
    id: `qr-${side}`, type: 'qr',
    x: config.qr?.x != null ? config.qr.x : x,
    y: config.qr?.y != null ? config.qr.y : y,
    w: config.qr?.size || size,
    h: config.qr?.size || size,
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

function line(id, x1, y1, x2, y2, stroke, width = 0.35) {
  return { id, type: 'line', x1, y1, x2, y2, stroke, width, locked: true };
}

// --- MISE EN PAGE DES MODÈLES ---
// Chaque layout reçoit le contexte normalisé et retourne des nœuds imprimables.
function designerLayout(ctx, variant) {
  const { W, H, s, config, colors, heading, body, name, title, company, lines, slogan } = ctx;
  const back = ctx.side === 'back';
  const nodes = [rect('bg', 0, 0, W, H, colors.background)];

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
      nodes.push(rect('gold-accent', 5, 5, 1, H - 10, colors.primary));
      break;
    case 'neon':
      nodes.push(rect('neon-top', 0, 0, W, 2, colors.primary));
      nodes.push(rect('neon-side', W - 3, 0, 3, H, colors.secondary));
      for (let x = 8; x < W - 8; x += 9) nodes.push(line(`neon-grid-${x}`, x, 5, x, H - 5, '#183348', 0.12));
      break;
    case 'artistic':
      nodes.push(rect('art-purple', -5, -7, W * 0.42, H * 0.48, colors.primary));
      nodes.push(rect('art-pink', W * 0.27, H - 9, W * 0.42, 15, colors.secondary));
      nodes.push(rect('art-orange', W - 17, 0, 17, H * 0.24, colors.accent));
      break;
    case 'vintage':
      nodes.push(rect('vintage-frame', 3, 3, W - 6, H - 6, 'transparent', colors.primary));
      nodes.push(line('vintage-rule', 7, 12, W - 7, 12, colors.secondary, 0.45));
      nodes.push(line('vintage-bottom', 7, H - 9, W - 7, H - 9, colors.secondary, 0.45));
      break;
    case 'nordic':
      nodes.push(rect('nordic-band', 0, 0, 4, H, colors.primary));
      nodes.push(line('nordic-rule', 8, H - 10, W - 8, H - 10, colors.secondary, 0.3));
      break;
    case 'botanical':
      nodes.push(rect('botanical-band', 0, 0, 5, H, colors.primary));
      nodes.push(line('leaf-stem', W - 17, 5, W - 8, 16, colors.secondary, 0.55));
      nodes.push(line('leaf-1', W - 16, 7, W - 21, 5, colors.secondary, 0.45));
      nodes.push(line('leaf-2', W - 13, 10, W - 9, 7, colors.secondary, 0.45));
      nodes.push(line('leaf-3', W - 11, 13, W - 15, 17, colors.secondary, 0.45));
      break;
    case 'corporate-bold':
      nodes.push(rect('corp-sidebar', 0, 0, 8, H, colors.primary));
      nodes.push(rect('corp-accent', 8, 0, 2, H, colors.secondary));
      nodes.push(rect('corp-footer', 10, H - 3, W - 10, 3, colors.primary));
      break;
    case 'editorial':
      nodes.push(rect('editorial-block', 0, 0, W * 0.27, H * 0.24, colors.primary));
      nodes.push(rect('editorial-corner', W - 5, H * 0.55, 5, H * 0.45, colors.accent));
      nodes.push(line('editorial-rule', 8, H * 0.48, W - 8, H * 0.48, colors.secondary, 0.3));
      break;
  }

  if (back) {
    const logo = buildLogoNode(config, (W - 12) / 2, 5, 'back');
    if (logo) nodes.push(logo);
    nodes.push(textNode('slogan', {
      x: 8, y: H * 0.32, w: W - 16, h: 12,
      text: slogan || company || name, font: heading.pdfBold || heading.pdf,
      cssFont: heading.css, size: variant === 'tech' ? 8 : 11,
      color: colors.text, align: 'center', bold: true
    }));
    if (company) nodes.push(textNode('back-company', {
      x: 8, y: H * 0.53, w: W - 16, h: 7, text: company,
      font: body.pdf, cssFont: body.css, size: 6.5,
      color: colors.secondary, align: 'center'
    }));
    const qr = buildQrNode(config, (W - 16) / 2, H - 20, 16, 'back');
    if (qr) nodes.push(qr);
    return nodes;
  }

  const contentX = variant === 'corporate' ? 28 : variant === 'corporate-bold' ? 13 : 8;
  const rightPanel = ['modern'].includes(variant) ? 34 : 0;
  const qrSize = variant === 'tech' ? 20 : 15;
  const qrX = variant === 'creative' ? 7 : W - qrSize - 6;
  const textW = Math.max(20, Math.min(W - contentX - qrSize - 12, qrX - contentX - 4));
  const nameY = ['luxury', 'luxury-gold'].includes(variant) ? 14 : variant === 'tech' ? 11 : 7;
  const textColor = colors.text;

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

  const logo = buildLogoNode(config, contentX, 5, 'front');
  if (logo) nodes.push(logo);

  nodes.push(textNode('name', {
    x: contentX, y: nameY, w: textW - rightPanel, h: 10,
    text: name || 'Your name', font: heading.pdfBold || heading.pdf,
    cssFont: heading.css, size: config.typeScale.name,
    color: textColor, align: config.alignment || 'left', bold: true
  }));

  if (title) nodes.push(textNode('title', {
    x: contentX, y: nameY + 11, w: textW - rightPanel, h: 6,
    text: title, font: body.pdf, cssFont: body.css,
    size: config.typeScale.title, color: colors.secondary, align: config.alignment || 'left'
  }));

  if (company && variant !== 'tech' && variant !== 'corporate') nodes.push(textNode('company', {
    x: contentX, y: nameY + (title ? 18 : 11), w: textW - rightPanel, h: 6,
    text: company, font: body.pdf, cssFont: body.css,
    size: config.typeScale.body, color: textColor, align: config.alignment || 'left'
  }));

  nodes.push(textNode('details', {
    x: contentX, y: Math.max(nameY + (title || company ? 22 : 14), H * 0.53),
    w: textW - rightPanel, h: Math.max(8, H * 0.38),
    text: lines.join('\n'), font: body.pdf, cssFont: body.css,
    size: config.typeScale.body, color: textColor, align: 'left', lines: true
  }));

  const qr = buildQrNode(config, qrX, H - qrSize - 5, qrSize, 'front');
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
  editorial: (ctx) => designerLayout(ctx, 'editorial')
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
  nodes = nodes.map((node) => applyOverride(node, config.elementOverrides));
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

    switch (node.type) {
      case 'rect':
        if (node.fill && node.fill !== 'none') {
          ctx2d.fillStyle = node.fill;
          ctx2d.fillRect(x, y, w, h);
        }
        if (node.stroke) {
          ctx2d.strokeStyle = node.stroke;
          ctx2d.lineWidth = (node.width || 0.1) * scale;
          ctx2d.strokeRect(x, y, w, h);
        }
        break;
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
  });
}

module.exports = {
  buildLayout,
  buildSide,
  renderToCanvas,
  fullName,
  contactLines
};
