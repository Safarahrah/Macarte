'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { renderSideSvg } = require('./render-svg');

async function embedLocalImages(svg, resolveImage) {
  const matches = [...svg.matchAll(/href="([^"]+)"/g)];
  let output = svg;
  for (const match of matches) {
    const src = match[1];
    if (src.startsWith('data:')) continue;
    const file = resolveImage ? resolveImage(src) : null;
    if (!file) {
      output = output.replace(match[0], 'href=""');
      continue;
    }
    try {
      const buffer = Buffer.isBuffer(file) ? file : fs.readFileSync(file);
      const mime = path.extname(String(file)).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
      const dataUri = `data:${mime};base64,${buffer.toString('base64')}`;
      output = output.replace(src, dataUri);
    } catch (err) {
      output = output.replace(match[0], 'href=""');
    }
  }
  return output;
}

async function renderJpgBuffer(layout, side, { includeBleed = true, dpi, resolveImage } = {}) {
  const rendered = renderSideSvg(layout, side, {
    dpi: dpi || layout.config.dpi,
    includeBleed
  });
  const svg = await embedLocalImages(rendered.svg, resolveImage);
  return sharp(Buffer.from(svg))
    .flatten({ background: layout.config.colors.background || '#ffffff' })
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toBuffer();
}

module.exports = {
  renderJpgBuffer
};
