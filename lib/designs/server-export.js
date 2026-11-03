'use strict';

const sharp = require('sharp');
const { renderPageToSvgString } = require('./server-svg-renderer');

const MAX_EDGE_PX = 9000;
const MM_PER_INCH = 25.4;

/**
 * Calculate pixel size for export based on document dimensions and DPI
 */
function calculatePixelSize(doc, { includeBleed = false, dpi = 300, scale = 1 } = {}) {
  const b = includeBleed ? doc.bleed || 0 : 0;
  const w = doc.width + 2 * b;
  const h = doc.height + 2 * b;
  let factor = doc.unit === 'mm' ? dpi / MM_PER_INCH : scale;
  
  // Cap size to prevent huge files
  if (Math.max(w, h) * factor > MAX_EDGE_PX) {
    factor = MAX_EDGE_PX / Math.max(w, h);
  }
  
  return {
    width: Math.round(w * factor),
    height: Math.round(h * factor),
    effectiveDpi: doc.unit === 'mm' ? Math.round(factor * MM_PER_INCH) : null
  };
}

/**
 * Collect uploaded images used by a document and inline them as data URLs.
 */
async function buildResolver(doc, uploadsDir) {
  const fs = require('fs');
  const path = require('path');

  const srcs = new Set();
  doc.pages.forEach((p) => {
    if (p.background && p.background.image) srcs.add(p.background.image);
    p.elements.forEach((el) => { if (el.type === 'image' && el.src) srcs.add(el.src); });
  });

  const map = {};
  await Promise.all([...srcs].map(async (src) => {
    try {
      if (!src.startsWith('/uploads/')) {
        map[src] = '';
        return;
      }
      const filename = path.basename(src);
      const safePath = path.resolve(uploadsDir, filename);
      if (!safePath.startsWith(path.resolve(uploadsDir))) {
        map[src] = '';
        return;
      }
      const buffer = await fs.promises.readFile(safePath);
      const ext = path.extname(filename).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
      map[src] = `data:${mime};base64,${buffer.toString('base64')}`;
    } catch (e) {
      map[src] = '';
    }
  }));
  return (src) => map[src] || '';
}

/**
 * Render a page to SVG string using React SSR.
 */
async function renderPageSvg(doc, pageIndex, uploadsDir) {
  const resolver = await buildResolver(doc, uploadsDir);
  
  const b = doc.bleed || 0;
  const w = doc.width + 2 * b;
  const h = doc.height + 2 * b;
  const unit = doc.unit === 'mm' ? 'mm' : '';

  return renderPageToSvgString(doc, pageIndex, {
    mode: 'export',
    includeBleed: true,
    uid: `page-${pageIndex}`,
    resolveSrc: resolver,
    width: `${w}${unit}`,
    height: `${h}${unit}`
  });
}

/**
 * Render a page to PNG buffer using sharp.
 */
async function renderPagePng(doc, pageIndex, options = {}, uploadsDir) {
  const { includeBleed = false, dpi = 300, scale = 1, transparent = false } = options;
  const resolver = await buildResolver(doc, uploadsDir);
  
  const svg = await renderPageToSvgString(doc, pageIndex, {
    mode: 'export',
    includeBleed,
    uid: `page-${pageIndex}`,
    resolveSrc: resolver
  });
  
  const size = calculatePixelSize(doc, { includeBleed, dpi, scale });

  let sharpInstance = sharp(Buffer.from(svg))
    .resize(size.width, size.height, { fit: 'fill' });

  if (!transparent) {
    sharpInstance = sharpInstance.flatten({ background: '#ffffff' });
  }

  return await sharpInstance.png().toBuffer();
}

/**
 * Render a page to JPG buffer using sharp.
 */
async function renderPageJpg(doc, pageIndex, options = {}, uploadsDir) {
  const { includeBleed = false, dpi = 300, scale = 1 } = options;
  const resolver = await buildResolver(doc, uploadsDir);
  
  const svg = await renderPageToSvgString(doc, pageIndex, {
    mode: 'export',
    includeBleed,
    uid: `page-${pageIndex}`,
    resolveSrc: resolver
  });
  
  const size = calculatePixelSize(doc, { includeBleed, dpi, scale });

  return await sharp(Buffer.from(svg))
    .resize(size.width, size.height, { fit: 'fill' })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 92 })
    .toBuffer();
}

/**
 * Render pages to PDF buffer using jsPDF.
 */
async function renderPdf(doc, options = {}, uploadsDir) {
  const { jsPDF } = require('jspdf');
  const { includeBleed = false, dpi = 300 } = options;

  const isMm = doc.unit === 'mm';
  const toUnit = (v) => (isMm ? v : v * 0.75);
  const b = includeBleed ? doc.bleed : 0;

  const pdf = new jsPDF({
    unit: isMm ? 'mm' : 'pt',
    format: [toUnit(doc.width + 2 * b), toUnit(doc.height + 2 * b)],
    compress: true
  });

  const resolver = await buildResolver(doc, uploadsDir);

  for (let i = 0; i < doc.pages.length; i++) {
    if (i > 0) pdf.addPage([toUnit(doc.width + 2 * b), toUnit(doc.height + 2 * b)]);

    const svg = await renderPageToSvgString(doc, i, {
      mode: 'export',
      includeBleed,
      uid: `page-${i}`,
      resolveSrc: resolver
    });
    
    const size = calculatePixelSize(doc, { includeBleed, dpi });
    const scale = toUnit(doc.width + 2 * b) / size.width;

    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(size.width, size.height, { fit: 'fill' })
      .flatten({ background: '#ffffff' })
      .png()
      .toBuffer();

    const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    pdf.addImage(dataUrl, 'PNG', 0, 0, toUnit(doc.width + 2 * b), toUnit(doc.height + 2 * b));
  }

  return Buffer.from(pdf.output('arraybuffer'));
}

module.exports = {
  renderPageSvg,
  renderPagePng,
  renderPageJpg,
  renderPdf
};
