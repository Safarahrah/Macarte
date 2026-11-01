'use strict';

const { mmToPx, DEFAULT_DPI } = require('../../src/printable/shared/spec');
const { getQrMatrix } = require('./qr');

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function drawQr(node, url, scale) {
  const matrix = getQrMatrix(url);
  if (!matrix) return '';
  const x = node.x * scale;
  const y = node.y * scale;
  const size = node.w * scale;
  const total = matrix.size + matrix.quietZone * 2;
  const module = size / total;
  const parts = [`<g shape-rendering="crispEdges"><rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#ffffff"/>`];
  for (let row = 0; row < matrix.size; row += 1) {
    for (let col = 0; col < matrix.size; col += 1) {
      if (!matrix.cells[row][col]) continue;
      parts.push(
        `<rect x="${(x + (col + matrix.quietZone) * module).toFixed(3)}" y="${(y + (row + matrix.quietZone) * module).toFixed(3)}" width="${module.toFixed(3)}" height="${module.toFixed(3)}" fill="#000000"/>`
      );
    }
  }
  parts.push('</g>');
  return parts.join('');
}

let gradientSeq = 0;
// Fill attribute; linear gradients ({ type:'linear', angle, stops }) are inlined as <defs>.
function fillAttr(fill) {
  if (!fill || fill === 'none' || fill === 'transparent') return { attr: ' fill="none"', defs: '' };
  if (typeof fill === 'string') return { attr: ` fill="${escapeXml(fill)}"`, defs: '' };
  if (fill.type === 'linear' && Array.isArray(fill.stops)) {
    gradientSeq += 1;
    const id = `g${gradientSeq}`;
    const a = (((fill.angle || 0) - 90) * Math.PI) / 180;
    const x = Math.cos(a) / 2; const y = Math.sin(a) / 2;
    const stops = fill.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${escapeXml(c)}"/>`).join('');
    return {
      attr: ` fill="url(#${id})"`,
      defs: `<defs><linearGradient id="${id}" x1="${0.5 - x}" y1="${0.5 - y}" x2="${0.5 + x}" y2="${0.5 + y}">${stops}</linearGradient></defs>`
    };
  }
  return { attr: ' fill="none"', defs: '' };
}

function strokeAttr(node, scale) {
  if (!node.stroke || node.stroke === 'none') return '';
  const cap = node.linecap ? ` stroke-linecap="${escapeXml(node.linecap)}"` : '';
  const join = node.linejoin ? ` stroke-linejoin="${escapeXml(node.linejoin)}"` : '';
  return ` stroke="${escapeXml(node.stroke)}" stroke-width="${(node.width || 0.35) * scale}"${cap}${join}`;
}

const opacityAttr = (node) => (node.opacity != null ? ` opacity="${Number(node.opacity)}"` : '');

function renderNode(node, publicUrl, scale) {
  if (node.type === 'polygon' && Array.isArray(node.points)) {
    const f = fillAttr(node.fill);
    const pts = node.points.map(([x, y]) => `${x * scale},${y * scale}`).join(' ');
    return `${f.defs}<polygon points="${pts}"${f.attr}${strokeAttr(node, scale)}${opacityAttr(node)}/>`;
  }
  if (node.type === 'circle') {
    const f = fillAttr(node.fill);
    return `${f.defs}<circle cx="${node.cx * scale}" cy="${node.cy * scale}" r="${node.r * scale}"${f.attr}${strokeAttr(node, scale)}${opacityAttr(node)}/>`;
  }
  if (node.type === 'path' && node.d) {
    const f = fillAttr(node.fill);
    return `${f.defs}<path d="${escapeXml(node.d)}" transform="scale(${scale}) translate(${node.tx || 0} ${node.ty || 0})"${f.attr}${node.stroke && node.stroke !== 'none' ? ` stroke="${escapeXml(node.stroke)}" stroke-width="${node.width || 0.35}"${node.linecap ? ` stroke-linecap="${escapeXml(node.linecap)}"` : ''}${node.linejoin ? ` stroke-linejoin="${escapeXml(node.linejoin)}"` : ''}` : ''}${opacityAttr(node)}/>`;
  }
  if (node.type === 'rect' && node.fill && typeof node.fill === 'object') {
    const f = fillAttr(node.fill);
    return `${f.defs}<rect x="${node.x * scale}" y="${node.y * scale}" width="${node.w * scale}" height="${node.h * scale}"${f.attr}${strokeAttr(node, scale)}${opacityAttr(node)}/>`;
  }
  if (node.type === 'rect') {
    const fill = node.fill && node.fill !== 'none' ? ` fill="${escapeXml(node.fill)}"` : ' fill="none"';
    const stroke = node.stroke ? ` stroke="${escapeXml(node.stroke)}" stroke-width="${(node.width || 0.4) * scale}"` : '';
    return `<rect x="${node.x * scale}" y="${node.y * scale}" width="${node.w * scale}" height="${node.h * scale}"${fill}${stroke}/>`;
  }
  if (node.type === 'line') {
    return `<line x1="${node.x1 * scale}" y1="${node.y1 * scale}" x2="${node.x2 * scale}" y2="${node.y2 * scale}" stroke="${escapeXml(node.stroke || '#000')}" stroke-width="${(node.width || 0.35) * scale}"/>`;
  }
  if (node.type === 'text') {
    const px = (node.size || 8) * 0.352777 * scale;
    const anchor = node.align === 'center' ? 'middle' : node.align === 'right' ? 'end' : 'start';
    const x = node.align === 'center'
      ? (node.x + node.w / 2) * scale
      : node.align === 'right'
        ? (node.x + node.w) * scale
        : node.x * scale;
    const lines = String(node.text || '').split('\n');
    const lineHeight = px * 1.25;
    const tspans = lines.map((line, index) => (
      `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    )).join('');
    return `<text x="${x}" y="${node.y * scale + px}" font-family="${escapeXml(node.cssFont || 'Helvetica, Arial, sans-serif')}" font-size="${px}" font-weight="${node.bold ? '700' : '400'}" fill="${escapeXml(node.color || '#111')}" text-anchor="${anchor}">${tspans}</text>`;
  }
  if (node.type === 'qr') {
    return drawQr(node, publicUrl, scale);
  }
  if (node.type === 'image' && node.src) {
    return `<image href="${escapeXml(node.src)}" x="${node.x * scale}" y="${node.y * scale}" width="${node.w * scale}" height="${node.h * scale}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return '';
}

function renderSideSvg(layout, side, { dpi = DEFAULT_DPI, includeBleed = true } = {}) {
  const geo = layout.geometry;
  const widthMm = includeBleed ? geo.document.widthMm : geo.format.trimWidthMm;
  const heightMm = includeBleed ? geo.document.heightMm : geo.format.trimHeightMm;
  const offsetX = includeBleed ? 0 : -geo.trim.x;
  const offsetY = includeBleed ? 0 : -geo.trim.y;
  const scale = mmToPx(1, dpi);
  const widthPx = mmToPx(widthMm, dpi);
  const heightPx = mmToPx(heightMm, dpi);
  const nodes = layout.sides[side] || [];
  const content = nodes.map((node) => {
    const shifted = shiftNode(node, offsetX, offsetY);
    return renderNode(shifted, layout.publicUrl, scale);
  }).join('');
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">${content}</svg>`,
    widthPx,
    heightPx
  };
}

function shiftNode(node, dx, dy) {
  if (!dx && !dy) return node;
  if (node.type === 'line') {
    return { ...node, x1: node.x1 + dx, y1: node.y1 + dy, x2: node.x2 + dx, y2: node.y2 + dy };
  }
  if (node.type === 'polygon' && Array.isArray(node.points)) {
    return { ...node, points: node.points.map(([x, y]) => [x + dx, y + dy]) };
  }
  if (node.type === 'circle') return { ...node, cx: node.cx + dx, cy: node.cy + dy };
  if (node.type === 'path') return { ...node, tx: (node.tx || 0) + dx, ty: (node.ty || 0) + dy };
  return { ...node, x: (node.x || 0) + dx, y: (node.y || 0) + dy };
}

module.exports = {
  renderSideSvg,
  renderNode
};
