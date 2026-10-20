'use strict';

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const {
  mmToPt,
  CROP_MARK_MARGIN_MM,
  CROP_MARK_LENGTH_MM,
  CROP_MARK_OFFSET_MM,
  getPdfPageSizeMm
} = require('../../src/printable/shared/spec');
const { getQrMatrix } = require('./qr');

function toPt(mm) {
  return mmToPt(mm);
}

function drawQr(doc, node, url, originX, originY) {
  const matrix = getQrMatrix(url);
  if (!matrix) return;
  const x = originX + toPt(node.x);
  const y = originY + toPt(node.y);
  const size = toPt(node.w);
  const total = matrix.size + matrix.quietZone * 2;
  const module = size / total;
  doc.save();
  doc.rect(x, y, size, size).fill('#ffffff');
  doc.fillColor('#000000');
  for (let row = 0; row < matrix.size; row += 1) {
    for (let col = 0; col < matrix.size; col += 1) {
      if (!matrix.cells[row][col]) continue;
      doc.rect(
        x + (col + matrix.quietZone) * module,
        y + (row + matrix.quietZone) * module,
        module,
        module
      ).fill();
    }
  }
  doc.restore();
}

function drawImage(doc, node, originX, originY, resolveImage) {
  const file = resolveImage ? resolveImage(node.src) : null;
  if (!file) return;
  try {
    doc.image(file, originX + toPt(node.x), originY + toPt(node.y), {
      width: toPt(node.w),
      height: toPt(node.h),
      fit: [toPt(node.w), toPt(node.h)]
    });
  } catch (err) {
    // Skip unreadable logos rather than failing the whole export.
  }
}

function drawNode(doc, node, publicUrl, originX, originY, resolveImage) {
  if (node.type === 'rect') {
    const x = originX + toPt(node.x);
    const y = originY + toPt(node.y);
    const w = toPt(node.w);
    const h = toPt(node.h);
    if (node.fill && node.fill !== 'none') {
      doc.save();
      doc.rect(x, y, w, h).fill(node.fill);
      doc.restore();
    }
    if (node.stroke) {
      doc.save();
      doc.lineWidth(toPt(node.width || 0.4));
      doc.strokeColor(node.stroke);
      doc.rect(x, y, w, h).stroke();
      doc.restore();
    }
    return;
  }
  if (node.type === 'line') {
    doc.save();
    doc.lineWidth(toPt(node.width || 0.35));
    doc.strokeColor(node.stroke || '#000000');
    doc.moveTo(originX + toPt(node.x1), originY + toPt(node.y1));
    doc.lineTo(originX + toPt(node.x2), originY + toPt(node.y2));
    doc.stroke();
    doc.restore();
    return;
  }
  if (node.type === 'text') {
    const fontName = node.bold ? (node.font && node.font.includes('Bold') ? node.font : `${node.font}-Bold`) : (node.font || 'Helvetica');
    const safeFont = ['Helvetica', 'Helvetica-Bold', 'Times-Roman', 'Times-Bold', 'Courier', 'Courier-Bold'].includes(fontName)
      ? fontName
      : (node.bold ? 'Helvetica-Bold' : 'Helvetica');
    const x = originX + toPt(node.x);
    const y = originY + toPt(node.y);
    const width = toPt(node.w || 40);
    const align = node.align || 'left';
    doc.save();
    doc.font(safeFont).fontSize(node.size || 8).fillColor(node.color || '#111111');
    doc.text(node.text || '', x, y, {
      width,
      align,
      lineGap: 1.1,
      ellipsis: true
    });
    doc.restore();
    return;
  }
  if (node.type === 'qr') {
    drawQr(doc, node, publicUrl, originX, originY);
    return;
  }
  if (node.type === 'image') {
    drawImage(doc, node, originX, originY, resolveImage);
  }
}

function drawCropMarks(doc, originX, originY, trim) {
  const x0 = originX + toPt(trim.x);
  const y0 = originY + toPt(trim.y);
  const x1 = x0 + toPt(trim.widthMm);
  const y1 = y0 + toPt(trim.heightMm);
  const mark = toPt(CROP_MARK_LENGTH_MM);
  const gap = toPt(CROP_MARK_OFFSET_MM);
  doc.save();
  doc.strokeColor('#000000').lineWidth(0.25);
  // Top-left
  doc.moveTo(x0 - gap - mark, y0).lineTo(x0 - gap, y0).stroke();
  doc.moveTo(x0, y0 - gap - mark).lineTo(x0, y0 - gap).stroke();
  // Top-right
  doc.moveTo(x1 + gap, y0).lineTo(x1 + gap + mark, y0).stroke();
  doc.moveTo(x1, y0 - gap - mark).lineTo(x1, y0 - gap).stroke();
  // Bottom-left
  doc.moveTo(x0 - gap - mark, y1).lineTo(x0 - gap, y1).stroke();
  doc.moveTo(x0, y1 + gap).lineTo(x0, y1 + gap + mark).stroke();
  // Bottom-right
  doc.moveTo(x1 + gap, y1).lineTo(x1 + gap + mark, y1).stroke();
  doc.moveTo(x1, y1 + gap).lineTo(x1, y1 + gap + mark).stroke();
  doc.restore();
}

function renderPdfBuffer(layout, { cropMarks = false, sides, resolveImage } = {}) {
  const pageMm = getPdfPageSizeMm(layout.config.formatId, { cropMarks });
  const pageWidth = toPt(pageMm.widthMm);
  const pageHeight = toPt(pageMm.heightMm);
  const origin = cropMarks ? toPt(CROP_MARK_MARGIN_MM) : 0;
  const requestedSides = sides || (layout.config.doubleSided ? ['front', 'back'] : ['front']);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [pageWidth, pageHeight],
      margin: 0,
      autoFirstPage: false,
      info: {
        Title: 'Printable business card',
        Creator: 'Macarte',
        Producer: 'Macarte printable-card'
      }
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    requestedSides.forEach((side) => {
      const nodes = layout.sides[side];
      if (!nodes) return;
      doc.addPage({ size: [pageWidth, pageHeight], margin: 0 });
      nodes.forEach((node) => drawNode(doc, node, layout.publicUrl, origin, origin, resolveImage));
      if (cropMarks) {
        drawCropMarks(doc, origin, origin, layout.geometry.trim);
      }
    });
    doc.end();
  });
}

function defaultResolveImage(uploadsDir) {
  return function resolveImage(src) {
    if (!src || typeof src !== 'string') return null;
    if (src.startsWith('data:image/')) {
      const match = src.match(/^data:image\/\w+;base64,(.+)$/);
      if (!match) return null;
      return Buffer.from(match[1], 'base64');
    }
    if (!src.startsWith('/uploads/')) return null;
    const filename = path.basename(src);
    const fullPath = path.resolve(uploadsDir, filename);
    if (!fullPath.startsWith(path.resolve(uploadsDir))) return null;
    if (!fs.existsSync(fullPath)) return null;
    return fullPath;
  };
}

module.exports = {
  renderPdfBuffer,
  defaultResolveImage,
  getPdfPageSizeMm
};
