'use strict';

/** Bleed on each side, in millimetres. */
const BLEED_MM = 3;
/** Inner safety margin from the trim edge, in millimetres (within the 3–5 mm range). */
const SAFETY_MM = 4;
/** Extra page margin used only when crop marks are requested. */
const CROP_MARK_MARGIN_MM = 8;
const CROP_MARK_LENGTH_MM = 5;
const CROP_MARK_OFFSET_MM = 2;
const DEFAULT_DPI = 300;
const DEFAULT_FORMAT_ID = 'na';

const FORMATS = {
  na: {
    id: 'na',
    label: 'Canada / United States (3.5 × 2 in)',
    trimWidthMm: 88.9,
    trimHeightMm: 50.8,
    orientation: 'landscape'
  },
  eu: {
    id: 'eu',
    label: 'Europe (85 × 55 mm)',
    trimWidthMm: 85,
    trimHeightMm: 55,
    orientation: 'landscape'
  }
};

const FONT_STACKS = {
  sans: {
    id: 'sans',
    label: 'Sans (Helvetica)',
    css: 'Helvetica, Arial, sans-serif',
    pdf: 'Helvetica',
    pdfBold: 'Helvetica-Bold'
  },
  serif: {
    id: 'serif',
    label: 'Serif (Times)',
    css: '"Times New Roman", Times, serif',
    pdf: 'Times-Roman',
    pdfBold: 'Times-Bold'
  },
  mono: {
    id: 'mono',
    label: 'Mono (Courier)',
    css: '"Courier New", Courier, monospace',
    pdf: 'Courier',
    pdfBold: 'Courier-Bold'
  }
};

function getFormat(formatId) {
  return FORMATS[formatId] || FORMATS[DEFAULT_FORMAT_ID];
}

function getFont(fontId) {
  return FONT_STACKS[fontId] || FONT_STACKS.sans;
}

function withBleed(format) {
  return {
    widthMm: roundMm(format.trimWidthMm + BLEED_MM * 2),
    heightMm: roundMm(format.trimHeightMm + BLEED_MM * 2)
  };
}

function getGeometry(formatId) {
  const format = getFormat(formatId);
  const bleed = withBleed(format);
  return {
    format,
    bleedMm: BLEED_MM,
    safetyMm: SAFETY_MM,
    document: {
      widthMm: bleed.widthMm,
      heightMm: bleed.heightMm
    },
    trim: {
      x: BLEED_MM,
      y: BLEED_MM,
      widthMm: format.trimWidthMm,
      heightMm: format.trimHeightMm
    },
    safety: {
      x: BLEED_MM + SAFETY_MM,
      y: BLEED_MM + SAFETY_MM,
      widthMm: roundMm(format.trimWidthMm - SAFETY_MM * 2),
      heightMm: roundMm(format.trimHeightMm - SAFETY_MM * 2)
    }
  };
}

function mmToPt(mm) {
  return (Number(mm) * 72) / 25.4;
}

function mmToPx(mm, dpi = DEFAULT_DPI) {
  return Math.round((Number(mm) * dpi) / 25.4);
}

function roundMm(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

function getExportPixelSize(formatId, { includeBleed = true, dpi = DEFAULT_DPI } = {}) {
  const format = getFormat(formatId);
  const widthMm = includeBleed ? format.trimWidthMm + BLEED_MM * 2 : format.trimWidthMm;
  const heightMm = includeBleed ? format.trimHeightMm + BLEED_MM * 2 : format.trimHeightMm;
  return {
    widthPx: mmToPx(widthMm, dpi),
    heightPx: mmToPx(heightMm, dpi),
    widthMm: roundMm(widthMm),
    heightMm: roundMm(heightMm),
    dpi
  };
}

function getPdfPageSizeMm(formatId, { cropMarks = false } = {}) {
  const bleed = withBleed(getFormat(formatId));
  if (!cropMarks) {
    return { widthMm: bleed.widthMm, heightMm: bleed.heightMm };
  }
  return {
    widthMm: roundMm(bleed.widthMm + CROP_MARK_MARGIN_MM * 2),
    heightMm: roundMm(bleed.heightMm + CROP_MARK_MARGIN_MM * 2)
  };
}

module.exports = {
  BLEED_MM,
  SAFETY_MM,
  CROP_MARK_MARGIN_MM,
  CROP_MARK_LENGTH_MM,
  CROP_MARK_OFFSET_MM,
  DEFAULT_DPI,
  DEFAULT_FORMAT_ID,
  FORMATS,
  FONT_STACKS,
  getFormat,
  getFont,
  withBleed,
  getGeometry,
  mmToPt,
  mmToPx,
  roundMm,
  getExportPixelSize,
  getPdfPageSizeMm
};
