'use strict';

const { getGeometry, getFont } = require('./spec');
const { getTemplate } = require('./templates');
const { sanitizeConfig } = require('./sanitize');

function visibleText(config, key) {
  if (!config.visibility[key]) return '';
  return (config.fields[key] || '').trim();
}

function fullName(config) {
  return `${config.fields.firstName || ''} ${config.fields.lastName || ''}`.trim();
}

function contactLines(config) {
  const lines = [];
  const phone = visibleText(config, 'phone');
  const email = visibleText(config, 'email');
  const website = visibleText(config, 'website');
  const address = visibleText(config, 'address');
  const social = visibleText(config, 'social');
  const extra = visibleText(config, 'extra');
  if (phone) lines.push(phone);
  if (email) lines.push(email);
  if (website) lines.push(website);
  if (address) lines.push(address);
  if (social) lines.push(social);
  if (extra) lines.push(extra);
  return lines;
}

function applyOverride(node, overrides) {
  const override = overrides[node.id];
  if (!override || node.locked) return node;
  return {
    ...node,
    x: override.x != null && Number.isFinite(override.x) ? override.x : node.x,
    y: override.y != null && Number.isFinite(override.y) ? override.y : node.y,
    w: override.w != null && Number.isFinite(override.w) ? override.w : node.w,
    h: override.h != null && Number.isFinite(override.h) ? override.h : node.h
  };
}

function constrainToDocument(node, widthMm, heightMm) {
  if (node.locked || node.type === 'rect' || node.type === 'line' || node.type === 'path') {
    return node;
  }
  const w = node.w || 10;
  const h = node.h || 6;
  return {
    ...node,
    x: Math.min(Math.max(0, node.x), Math.max(0, widthMm - w)),
    y: Math.min(Math.max(0, node.y), Math.max(0, heightMm - h))
  };
}

function buildQrNode(config, x, y, size, side) {
  if (!config.visibility.qr) return null;
  if (side === 'back' && !config.qrOnBack) return null;
  if (side === 'front' && config.qrOnBack && config.doubleSided) return null;
  const qrX = config.qr.x != null ? config.qr.x : x;
  const qrY = config.qr.y != null ? config.qr.y : y;
  const qrSize = config.qr.size || size;
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
  if (!config.visibility.logo || !config.logo.url) return null;
  return {
    id: `logo-${side}`,
    type: 'image',
    src: config.logo.url,
    x: config.logo.x != null ? config.logo.x : x,
    y: config.logo.y != null ? config.logo.y : y,
    w: config.logo.w,
    h: config.logo.h,
    selectable: true
  };
}

function textNode(id, opts) {
  return {
    type: 'text',
    selectable: true,
    ...opts,
    id
  };
}

function layoutMinimal(ctx) {
  const { W, H, s, config, colors, heading, body, name, title, company, lines, slogan } = ctx;
  const nodes = [
    { id: 'bg', type: 'rect', x: 0, y: 0, w: W, h: H, fill: colors.background, locked: true }
  ];
  const logo = buildLogoNode(config, s.x, s.y, ctx.side);
  if (logo) nodes.push(logo);
  nodes.push(textNode('name', {
    x: s.x, y: s.y + (logo ? 16 : 2), w: s.widthMm - 24, h: 10,
    text: name, font: heading.pdfBold, cssFont: heading.css, size: config.typeScale.name,
    color: colors.text, align: config.alignment, bold: true
  }));
  if (title) {
    nodes.push(textNode('title', {
      x: s.x, y: s.y + 14, w: s.widthMm - 24, h: 6,
      text: title, font: body.pdf, cssFont: body.css, size: config.typeScale.title,
      color: colors.secondary, align: config.alignment
    }));
  }
  if (company) {
    nodes.push(textNode('company', {
      x: s.x, y: s.y + 20, w: s.widthMm - 24, h: 6,
      text: company, font: body.pdf, cssFont: body.css, size: config.typeScale.body,
      color: colors.text, align: config.alignment
    }));
  }
  nodes.push({
    id: 'rule', type: 'line', x1: s.x, y1: H / 2, x2: s.x + s.widthMm - 22, y2: H / 2,
    stroke: colors.primary, width: 0.35, locked: true
  });
  nodes.push(textNode('details', {
    x: s.x, y: H / 2 + 3, w: s.widthMm - 24, h: 18,
    text: lines.join('\n'), font: body.pdf, cssFont: body.css, size: config.typeScale.body,
    color: colors.text, align: config.alignment, lines: true
  }));
  const qr = buildQrNode(config, s.x + s.widthMm - 18, s.y, 18, ctx.side);
  if (qr) nodes.push(qr);
  if (ctx.side === 'back') {
    return [
      { id: 'bg', type: 'rect', x: 0, y: 0, w: W, h: H, fill: colors.background, locked: true },
      textNode('slogan', {
        x: s.x, y: H / 2 - 6, w: s.widthMm, h: 12,
        text: slogan || company || name, font: heading.pdf, cssFont: heading.css,
        size: 11, color: colors.text, align: 'center'
      }),
      buildLogoNode(config, (W - 16) / 2, s.y + 2, 'back'),
      buildQrNode(config, (W - 18) / 2, H - s.y - 20, 18, 'back')
    ].filter(Boolean);
  }
  return nodes;
}

function layoutCorporate(ctx) {
  const { W, H, s, config, colors, heading, body, name, title, company, lines, slogan } = ctx;
  if (ctx.side === 'back') {
    return [
      { id: 'bg', type: 'rect', x: 0, y: 0, w: W, h: H, fill: colors.primary, locked: true },
      buildLogoNode(config, (W - 18) / 2, H / 2 - 16, 'back'),
      textNode('slogan', {
        x: s.x, y: H / 2 + 6, w: s.widthMm, h: 10,
        text: slogan || company, font: heading.pdf, cssFont: heading.css,
        size: 10, color: '#ffffff', align: 'center'
      }),
      textNode('website', {
        x: s.x, y: H - s.y - 8, w: s.widthMm, h: 6,
        text: visibleText(config, 'website'), font: body.pdf, cssFont: body.css,
        size: 6.5, color: colors.secondary, align: 'center'
      }),
      buildQrNode(config, s.x + s.widthMm - 18, s.y, 16, 'back')
    ].filter(Boolean);
  }
  const nodes = [
    { id: 'bg', type: 'rect', x: 0, y: 0, w: W, h: H, fill: colors.background, locked: true },
    { id: 'sidebar', type: 'rect', x: 0, y: 0, w: 22, h: H, fill: colors.primary, locked: true },
    { id: 'gold', type: 'rect', x: 22, y: 0, w: 1.2, h: H, fill: colors.secondary, locked: true }
  ];
  const logo = buildLogoNode(config, 4, 6, 'front');
  if (logo) nodes.push({ ...logo, w: 14, h: 14 });
  nodes.push(textNode('company-side', {
    x: 3, y: H - 28, w: 16, h: 20,
    text: company, font: body.pdfBold, cssFont: body.css, size: 5.5,
    color: '#ffffff', align: 'left'
  }));
  nodes.push(textNode('name', {
    x: 28, y: s.y, w: s.widthMm - 28, h: 10,
    text: name, font: heading.pdfBold, cssFont: heading.css, size: config.typeScale.name,
    color: colors.primary, align: 'left', bold: true
  }));
  if (title) {
    nodes.push(textNode('title', {
      x: 28, y: s.y + 12, w: 40, h: 6,
      text: title, font: body.pdf, cssFont: body.css, size: config.typeScale.title,
      color: colors.text, align: 'left'
    }));
  }
  nodes.push(textNode('details', {
    x: 28, y: s.y + 22, w: 38, h: 20,
    text: lines.join('\n'), font: body.pdf, cssFont: body.css, size: config.typeScale.body,
    color: colors.text, align: 'left', lines: true
  }));
  const qr = buildQrNode(config, W - s.x - 18, H - s.y - 18, 18, 'front');
  if (qr) nodes.push(qr);
  return nodes;
}

function layoutModern(ctx) {
  const { W, H, s, config, colors, heading, body, name, title, company, lines, slogan } = ctx;
  if (ctx.side === 'back') {
    return [
      { id: 'bg', type: 'rect', x: 0, y: 0, w: W, h: H, fill: '#0f172a', locked: true },
      { id: 'bar', type: 'rect', x: 0, y: 0, w: W, h: 10, fill: colors.secondary, locked: true },
      textNode('slogan', {
        x: s.x, y: H / 2 - 6, w: s.widthMm, h: 12,
        text: slogan || company, font: heading.pdfBold, cssFont: heading.css,
        size: 14, color: '#ffffff', align: 'center'
      }),
      buildQrNode(config, (W - 20) / 2, H - 28, 20, 'back')
    ].filter(Boolean);
  }
  const nodes = [
    { id: 'bg', type: 'rect', x: 0, y: 0, w: W, h: H, fill: colors.background, locked: true },
    { id: 'panel', type: 'rect', x: W - 32, y: 0, w: 32, h: H, fill: '#0f172a', locked: true },
    { id: 'blob', type: 'rect', x: -8, y: -8, w: 28, h: 22, fill: colors.secondary, locked: true }
  ];
  nodes.push(textNode('name', {
    x: s.x, y: s.y + 8, w: s.widthMm - 30, h: 14,
    text: name, font: heading.pdfBold, cssFont: heading.css, size: config.typeScale.name,
    color: colors.text, align: 'left', bold: true
  }));
  if (title || company) {
    nodes.push(textNode('title', {
      x: s.x, y: s.y + 24, w: 50, h: 8,
      text: [title, company].filter(Boolean).join(' · '), font: body.pdf, cssFont: body.css,
      size: config.typeScale.title, color: '#dbeafe', align: 'left'
    }));
  }
  nodes.push(textNode('details', {
    x: s.x, y: s.y + 34, w: 50, h: 16,
    text: lines.join('\n'), font: body.pdf, cssFont: body.css, size: config.typeScale.body,
    color: '#eff6ff', align: 'left', lines: true
  }));
  const logo = buildLogoNode(config, s.x, H - s.y - 14, 'front');
  if (logo) nodes.push(logo);
  const qr = buildQrNode(config, W - 26, (H - 20) / 2, 20, 'front');
  if (qr) nodes.push(qr);
  return nodes;
}

function layoutLuxury(ctx) {
  const { W, H, s, config, colors, heading, body, name, title, company, lines, slogan } = ctx;
  const frame = [
    { id: 'bg', type: 'rect', x: 0, y: 0, w: W, h: H, fill: colors.background, locked: true },
    {
      id: 'frame', type: 'rect', x: s.x - 1, y: s.y - 1, w: s.widthMm + 2, h: s.heightMm + 2,
      fill: 'none', stroke: colors.primary, width: 0.4, locked: true
    }
  ];
  if (ctx.side === 'back') {
    return [
      ...frame,
      textNode('slogan', {
        x: s.x, y: H / 2 - 8, w: s.widthMm, h: 16,
        text: slogan || company, font: heading.pdf, cssFont: heading.css,
        size: 12, color: colors.primary, align: 'center'
      }),
      buildLogoNode(config, (W - 16) / 2, s.y + 4, 'back'),
      buildQrNode(config, (W - 16) / 2, H - s.y - 18, 16, 'back')
    ].filter(Boolean);
  }
  const nodes = [...frame];
  nodes.push(textNode('company', {
    x: s.x, y: s.y + 2, w: s.widthMm, h: 6,
    text: company, font: body.pdf, cssFont: body.css, size: 6.2,
    color: colors.secondary, align: 'center'
  }));
  nodes.push(textNode('name', {
    x: s.x, y: H / 2 - 12, w: s.widthMm, h: 10,
    text: name, font: heading.pdfBold, cssFont: heading.css, size: config.typeScale.name,
    color: colors.text, align: 'center', bold: true
  }));
  nodes.push({
    id: 'gold-rule', type: 'line', x1: W / 2 - 12, y1: H / 2, x2: W / 2 + 12, y2: H / 2,
    stroke: colors.primary, width: 0.45, locked: true
  });
  if (title) {
    nodes.push(textNode('title', {
      x: s.x, y: H / 2 + 2, w: s.widthMm, h: 6,
      text: title, font: body.pdf, cssFont: body.css, size: config.typeScale.title,
      color: colors.secondary, align: 'center'
    }));
  }
  nodes.push(textNode('details', {
    x: s.x, y: H - s.y - 14, w: s.widthMm - 22, h: 12,
    text: lines.slice(0, 3).join('  ·  '), font: body.pdf, cssFont: body.css,
    size: 5.8, color: colors.text, align: 'center'
  }));
  const qr = buildQrNode(config, s.x + s.widthMm - 16, H - s.y - 16, 16, 'front');
  if (qr) nodes.push(qr);
  const logo = buildLogoNode(config, s.x, s.y, 'front');
  if (logo) nodes.push(logo);
  return nodes;
}

function layoutCreative(ctx) {
  const { W, H, s, config, colors, heading, body, name, title, company, lines, slogan } = ctx;
  if (ctx.side === 'back') {
    return [
      { id: 'bg', type: 'rect', x: 0, y: 0, w: W, h: H, fill: colors.primary, locked: true },
      { id: 'shape', type: 'rect', x: W - 40, y: -6, w: 48, h: H + 12, fill: colors.secondary, locked: true },
      textNode('slogan', {
        x: s.x, y: H / 2 - 6, w: 50, h: 14,
        text: slogan || name, font: heading.pdfBold, cssFont: heading.css,
        size: 13, color: '#ffffff', align: 'left'
      }),
      buildQrNode(config, W - 28, (H - 18) / 2, 18, 'back')
    ].filter(Boolean);
  }
  const nodes = [
    { id: 'bg', type: 'rect', x: 0, y: 0, w: W, h: H, fill: colors.background, locked: true },
    { id: 'shape', type: 'rect', x: -10, y: -12, w: 42, h: 40, fill: colors.primary, locked: true },
    { id: 'accent', type: 'rect', x: 20, y: H - 10, w: 30, h: 16, fill: colors.accent, locked: true }
  ];
  nodes.push(textNode('name', {
    x: s.x + 18, y: s.y + 6, w: 48, h: 14,
    text: name, font: heading.pdfBold, cssFont: heading.css, size: config.typeScale.name,
    color: colors.secondary, align: 'left', bold: true
  }));
  if (title) {
    nodes.push(textNode('title', {
      x: s.x + 18, y: s.y + 20, w: 48, h: 6,
      text: title, font: body.pdf, cssFont: body.css, size: config.typeScale.title,
      color: colors.primary, align: 'left'
    }));
  }
  nodes.push(textNode('details', {
    x: W / 2 + 2, y: s.y + 4, w: 32, h: 24,
    text: [company, ...lines].filter(Boolean).join('\n'), font: body.pdf, cssFont: body.css,
    size: config.typeScale.body, color: colors.secondary, align: 'left', lines: true
  }));
  const qr = buildQrNode(config, s.x, H - s.y - 18, 16, 'front');
  if (qr) nodes.push(qr);
  const logo = buildLogoNode(config, s.x + 2, s.y, 'front');
  if (logo) nodes.push(logo);
  return nodes;
}

function layoutTech(ctx) {
  const { W, H, s, config, colors, heading, body, name, title, company, lines, slogan } = ctx;
  const grid = [];
  for (let x = 0; x < W; x += 6) {
    grid.push({
      id: `gx-${x}`, type: 'line', x1: x, y1: 0, x2: x, y2: H,
      stroke: '#164e63', width: 0.15, locked: true
    });
  }
  if (ctx.side === 'back') {
    return [
      { id: 'bg', type: 'rect', x: 0, y: 0, w: W, h: H, fill: colors.background, locked: true },
      ...grid.slice(0, 8),
      textNode('slogan', {
        x: s.x, y: s.y + 2, w: s.widthMm, h: 8,
        text: (slogan || 'SCAN TO CONNECT').toUpperCase(), font: heading.pdfBold, cssFont: heading.css,
        size: 8, color: colors.primary, align: 'left'
      }),
      buildQrNode(config, s.x, s.y + 12, 24, 'back'),
      textNode('url', {
        x: s.x + 28, y: s.y + 20, w: 40, h: 16,
        text: company || name, font: body.pdf, cssFont: body.css,
        size: 7, color: colors.text, align: 'left'
      })
    ].filter(Boolean);
  }
  const nodes = [
    { id: 'bg', type: 'rect', x: 0, y: 0, w: W, h: H, fill: colors.background, locked: true },
    ...grid,
    { id: 'topbar', type: 'rect', x: 0, y: 0, w: W, h: 9, fill: '#04111d', locked: true }
  ];
  nodes.push(textNode('company', {
    x: s.x, y: 2.2, w: s.widthMm, h: 6,
    text: (company || 'DIGITAL CARD').toUpperCase(), font: heading.pdfBold, cssFont: heading.css,
    size: 6, color: colors.primary, align: 'left'
  }));
  nodes.push(textNode('name', {
    x: s.x, y: s.y + 6, w: 48, h: 10,
    text: name, font: heading.pdfBold, cssFont: heading.css, size: config.typeScale.name,
    color: colors.text, align: 'left', bold: true
  }));
  if (title) {
    nodes.push(textNode('title', {
      x: s.x, y: s.y + 16, w: 48, h: 6,
      text: title, font: body.pdf, cssFont: body.css, size: config.typeScale.title,
      color: colors.secondary, align: 'left'
    }));
  }
  nodes.push(textNode('details', {
    x: s.x, y: s.y + 24, w: 46, h: 18,
    text: lines.join('\n'), font: body.pdf, cssFont: body.css, size: config.typeScale.body,
    color: colors.text, align: 'left', lines: true
  }));
  const qr = buildQrNode(config, s.x + s.widthMm - 22, s.y + 8, 22, 'front');
  if (qr) nodes.push(qr);
  const logo = buildLogoNode(config, s.x + s.widthMm - 14, 1.5, 'front');
  if (logo) nodes.push({ ...logo, w: 6, h: 6 });
  return nodes;
}

const BUILDERS = {
  minimal: layoutMinimal,
  corporate: layoutCorporate,
  modern: layoutModern,
  luxury: layoutLuxury,
  creative: layoutCreative,
  tech: layoutTech
};

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
    colors: config.colors,
    heading,
    body,
    name: fullName(config) || 'Your name',
    title: visibleText(config, 'title'),
    company: visibleText(config, 'company'),
    lines: contactLines(config),
    slogan: visibleText(config, 'slogan'),
    publicUrl
  };
  const builder = BUILDERS[template.id] || layoutMinimal;
  let nodes = builder(ctx).filter(Boolean);
  nodes = nodes.map((node) => applyOverride(node, config.elementOverrides));
  nodes = nodes.map((node) => constrainToDocument(node, ctx.W, ctx.H));
  return nodes;
}

function buildLayout(rawConfig, publicUrl) {
  const config = sanitizeConfig(rawConfig);
  const geometry = getGeometry(config.formatId);
  const sides = {
    front: buildSide(config, 'front', publicUrl)
  };
  if (config.doubleSided) {
    sides.back = buildSide(config, 'back', publicUrl);
  }
  return {
    config,
    geometry,
    publicUrl: publicUrl || '',
    sides
  };
}

module.exports = {
  buildLayout,
  buildSide,
  fullName,
  contactLines
};
