'use strict';

const QRCode = require('qrcode');

const QUIET_ZONE_MODULES = 4;

function createQrModel(url) {
  if (!url) return null;
  return QRCode.create(url, { errorCorrectionLevel: 'M' });
}

function getQrMatrix(url) {
  const model = createQrModel(url);
  if (!model) return null;
  const size = model.modules.size;
  const cells = [];
  for (let y = 0; y < size; y += 1) {
    const row = [];
    for (let x = 0; x < size; x += 1) {
      row.push(Boolean(model.modules.get(x, y)));
    }
    cells.push(row);
  }
  return { size, cells, quietZone: QUIET_ZONE_MODULES };
}

function qrSvg(url, pixelSize = 256) {
  const matrix = getQrMatrix(url);
  if (!matrix) return '';
  const total = matrix.size + matrix.quietZone * 2;
  const module = pixelSize / total;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pixelSize} ${pixelSize}" width="${pixelSize}" height="${pixelSize}" shape-rendering="crispEdges">`,
    `<rect width="${pixelSize}" height="${pixelSize}" fill="#ffffff"/>`
  ];
  for (let y = 0; y < matrix.size; y += 1) {
    for (let x = 0; x < matrix.size; x += 1) {
      if (!matrix.cells[y][x]) continue;
      const px = (x + matrix.quietZone) * module;
      const py = (y + matrix.quietZone) * module;
      parts.push(`<rect x="${px.toFixed(3)}" y="${py.toFixed(3)}" width="${module.toFixed(3)}" height="${module.toFixed(3)}" fill="#000000"/>`);
    }
  }
  parts.push('</svg>');
  return parts.join('');
}

module.exports = {
  QUIET_ZONE_MODULES,
  createQrModel,
  getQrMatrix,
  qrSvg
};
