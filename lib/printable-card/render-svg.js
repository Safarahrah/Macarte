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

function renderNode(node, publicUrl, scale) {
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
  return { ...node, x: (node.x || 0) + dx, y: (node.y || 0) + dy };
}

module.exports = {
  renderSideSvg,
  renderNode
};
