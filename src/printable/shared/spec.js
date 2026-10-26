// src/printable/shared/spec.js

/** Bleed on each side, in millimetres. */
export const BLEED_MM = 3;
/** Inner safety margin from the trim edge, in millimetres (within the 3–5 mm range). */
export const SAFETY_MM = 4;
/** Extra page margin used only when crop marks are requested. */
export const CROP_MARK_MARGIN_MM = 8;
export const CROP_MARK_LENGTH_MM = 5;
export const CROP_MARK_OFFSET_MM = 2;
export const DEFAULT_DPI = 300;
export const DEFAULT_FORMAT_ID = 'na';

export const FORMATS = {
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

// Font stacks used by the printable designer.
// `css` is used on screen (physical preview); `pdf` maps to a standard PDF font
// because exports rely on core PDF fonts (Helvetica / Times / Courier).
export const FONT_STACKS = {
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
  },
  inter: {
    id: 'inter',
    label: 'Inter',
    css: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
    pdf: 'Helvetica',
    pdfBold: 'Helvetica-Bold'
  },
  poppins: {
    id: 'poppins',
    label: 'Poppins',
    css: 'Poppins, Inter, Helvetica, Arial, sans-serif',
    pdf: 'Helvetica',
    pdfBold: 'Helvetica-Bold'
  },
  montserrat: {
    id: 'montserrat',
    label: 'Montserrat',
    css: 'Montserrat, Inter, Helvetica, Arial, sans-serif',
    pdf: 'Helvetica',
    pdfBold: 'Helvetica-Bold'
  },
  roboto: {
    id: 'roboto',
    label: 'Roboto',
    css: 'Roboto, Inter, Helvetica, Arial, sans-serif',
    pdf: 'Helvetica',
    pdfBold: 'Helvetica-Bold'
  },
  lato: {
    id: 'lato',
    label: 'Lato',
    css: 'Lato, Inter, Helvetica, Arial, sans-serif',
    pdf: 'Helvetica',
    pdfBold: 'Helvetica-Bold'
  }
};

export function getFormat(formatId) {
  return FORMATS[formatId] || FORMATS[DEFAULT_FORMAT_ID];
}

export function getFont(fontId) {
  return FONT_STACKS[fontId] || FONT_STACKS.sans;
}

export function withBleed(format) {
  return {
    widthMm: roundMm(format.trimWidthMm + BLEED_MM * 2),
    heightMm: roundMm(format.trimHeightMm + BLEED_MM * 2)
  };
}

export function getGeometry(formatId) {
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

export function mmToPt(mm) {
  return (Number(mm) * 72) / 25.4;
}

export function mmToPx(mm, dpi = DEFAULT_DPI) {
  return Math.round((Number(mm) * dpi) / 25.4);
}

export function roundMm(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

export function getExportPixelSize(formatId, { includeBleed = true, dpi = DEFAULT_DPI } = {}) {
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

export function getPdfPageSizeMm(formatId, { cropMarks = false } = {}) {
  const bleed = withBleed(getFormat(formatId));
  if (!cropMarks) {
    return { widthMm: bleed.widthMm, heightMm: bleed.heightMm };
  }
  return {
    widthMm: roundMm(bleed.widthMm + CROP_MARK_MARGIN_MM * 2),
    heightMm: roundMm(bleed.heightMm + CROP_MARK_MARGIN_MM * 2)
  };
}