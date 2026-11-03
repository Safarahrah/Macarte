'use strict';

/**
 * Server-side SVG renderer - Pure JavaScript (no JSX/React)
 * This module generates SVG markup directly, avoiding React JSX compilation issues in Node.js.
 * It reproduces the logic from DesignSvg.jsx without React dependencies.
 */

const { starPoints, gradientVector } = require('../../src/design/engine/geometry');
const { fontCss } = require('../../src/design/shared/fonts');

// QR code support disabled for now (requires QR library)
function qrPath(value) {
  // Placeholder - will return null until QR library is available
  return null;
}

/**
 * Server-side version of wrapLines (no canvas dependency)
 * Simple approximation for text wrapping on the server
 */
function wrapLinesServer(el) {
  const raw = el.uppercase ? String(el.text || '').toUpperCase() : String(el.text || '');
  const size = el.size || 14;
  const maxWidth = Math.max(el.w || 1000, size * 0.6);
  const lines = [];
  
  // Approximate character width (varies by font, using generic estimate)
  const avgCharWidth = size * 0.55;
  const letterSpacing = (el.letterSpacing || 0) * size;
  
  raw.split('\n').forEach((paragraph) => {
    const words = paragraph.split(/(\s+)/).filter((w) => w.length);
    if (!words.length) { lines.push(''); return; }
    let line = '';
    words.forEach((word) => {
      const candidate = line + word;
      const estimatedWidth = candidate.length * (avgCharWidth + letterSpacing);
      if (line && estimatedWidth > maxWidth) {
        lines.push(line.trimEnd());
        line = word.trimStart();
      } else {
        line = candidate;
      }
    });
    lines.push(line.trimEnd());
  });
  return lines;
}

// Icon paths mapping (simplified version of lucide-react icons)
const ICON_PATHS = {
  Circle: '<circle cx="12" cy="12" r="10" />',
  Square: '<rect x="2" y="2" width="20" height="20" rx="2" />',
  Triangle: '<path d="M12 2L2 22h20L12 2z" />',
  Star: '<polygon points="12 2 15 21 7 14 2 12 10 17 17 14 21 15 12 2" />',
  Diamond: '<rect x="2" y="2" width="20" height="20" rx="2" transform="rotate(45 12 12)" />',
  Line: '<line x1="2" y1="12" x2="22" y2="12" stroke-linecap="round" />',
  Plus: '<line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round" /><line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round" />',
  X: '<line x1="5" y1="5" x2="19" y2="19" stroke-linecap="round" /><line x1="5" y1="19" x2="19" y2="5" stroke-linecap="round" />',
  Heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78-7.78l-1.06 1.06a5.5 5.5 0 0 0 0 7.78L12 21.23l7.78-7.78a5.5 5.5 0 0 0 0-7.78z" />',
  Check: '<polyline points="20 6 9 17 4 12" />',
  Download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />',
  Search: '<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" stroke-linecap="round" /><line x1="11" y1="8" x2="11" y1="14" stroke-linecap="round" />',
  User: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />',
  Calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="10" y1="15" x2="8" y2="18" /><line x1="15" y1="15" x2="18" y2="18" />',
  Mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm2 4h12" />',
  Phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 2 2 0 0 1-.72 2.88 2.08 2 0 0 1-.89 2.72-2.08 2.0 0 1-2.88.72-2 2h-3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8.92a2 2 0 0 1 2 2 2 0 0 1 2.88-.72 2.08 2 0 0 1 .89-2.72 2.08 2 0 0 1 2.88-.72 2-2 2z" />',
  Globe: '<circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /><path d="M2 12h20" />',
  MapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13 9-13 9-13 0 0 18 0 18z" /><circle cx="12" cy="10" r="3" />',
  ExternalLink: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" /><line x1="10" y1="13" x2="21" y2="13" /><line x1="15" y1="9" x2="21" y2="3" /><line x1="15" y1="15" x2="21" y2="9" />',
  MoreHorizontal: '<circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />',
  MoreVertical: '<circle cx="12" cy="5" r="1" /><circle cx="12" coy="12" r="1" /><circle cx="12" cy="19" r="1" />',
  Lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /><circle cx="12" cy="16" r="1" />',
  Unlock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /><circle cx="12" cy="16" r="1" /><path d="M15 11V7a5 5 0 0 0-10 0v4" />',
  Share2: '<circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8" y1="9" x2="21" y2="9" /><line x1="15" y1="15" x2="21" y2="15" /><line x1="15" y1="11" x2="21" y2="11" />',
  FileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><polyline points="16 18 20 22 20 10 2 12 10 2 4 6 10 4 14 6 16" /><line x1="2" y1="6" x2="22" y2="6" x2="22" y2="6" y2="18" />',
  Image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21 5 21 15" /><line x1="21" y1="9" x2="9" y2="9" x2="9" y2="21" />',
  Printer: '<polyline points="6 9 6 2 12 2 12 6 9 6 15 6 9 6 20 6 20 6 20 18 6 6 16 18 6 16 16 18 6 16 14 6 6 10 6 6 10 6 16 10 6 16 10 6 16 6 14 6 14 10 6 10 6 10 6 10 14 6 10 14 10 14 10 10 14 10 14 10 10 10 10 14 10 10 10 10 10 10 14 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10  wrapping -1.5rem" />',
  Gem: '<path d="M6 3h12l3 13-1.5 7.5a4 4 0 0 1-6.27 0L12 20.5 10.5 7.5a4 4 0 0 1-6.27 0L6 3z" />',
  LayoutGrid: '<rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />',
  Contact: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 2 2 0 0 1-.72 2.88 2.08 2 0 0 1-.89 2.72 2.08 2 0 0 1 2.88-.72 2.08 2 0 0 1 2.88-.72 2-2 2z" /><path d="M16 2v2" /><circle cx="12" cy="14" r="2" />',
  QrCode: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M3 3v18h18V3H3z M9 3h6v6H9V3z" />',
};

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function shade(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return '#000000';
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.round(v * 0.55).toString(16).padStart(2, '0');
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

/**
 * Generate SVG element for a design element
 */
function generateElementSvg(el, uid, resolveSrc) {
  const common = `opacity="${el.opacity || 1}"`;
  const stroke = el.stroke && el.stroke !== 'transparent' && el.strokeWidth > 0
    ? `stroke="${escapeXml(el.stroke)}" stroke-width="${el.strokeWidth}"`
    : '';
  const gid = `gr-${uid}-${el.id}`;
  const gradDef = el.gradient ? gradientVector(el.gradient.angle) : null;
  const fill = el.gradient ? `url(#${gid})` : (el.fill === 'transparent' ? 'none' : escapeXml(el.fill));

  let defs = '';
  let content = '';

  // Gradient definition
  if (el.gradient && gradDef) {
    defs = `<defs>
      <linearGradient id="${gid}" x1="${gradDef.x1}" y1="${gradDef.y1}" x2="${gradDef.x2}" y2="${gradDef.y2}">
        <stop offset="0" stop-color="${escapeXml(el.gradient.from)}" />
        <stop offset="1" stop-color="${escapeXml(el.gradient.to)}" />
      </linearGradient>
    </defs>`;
  }

  switch (el.type) {
    case 'path': {
      const k = Math.max(el.w, el.h) ? 1 : 1;
      content = `<g transform="scale(${el.w / el.vb} ${el.h / el.vb})">
        <path d="${escapeXml(el.d)} fill="${fill}" ${stroke} ${common} stroke-linecap="round" stroke-linejoin="round" />
      </g>`;
      break;
    }
    case 'rect': {
      const k = Math.max(el.w, el.h) ? 1 : 1;
      content = `<g transform="scale(${el.w / el.vb} ${el.h / el.vb})">
        <rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="${el.rx || 0}" ry="${el.ry || 0}" fill="${fill}" ${stroke} ${common} />
      </g>`;
      break;
    }
    case 'ellipse': {
      const k = Math.max(el.w, el.h) ? 1 : 1;
      content = `<g transform="scale(${el.w / el.vb} ${el.h / el.vb})">
        <ellipse cx="${el.cx}" cy="${el.cy}" rx="${el.rx}" ry="${el.ry}" fill="${fill}" ${stroke} ${common} />
      </g>`;
      break;
    }
    case 'triangle': {
      const k = Math.max(el.w, el.h) ? 1 : 1;
      content = `<g transform="scale(${el.w / el.vb} ${el.h / el.vb})">
        <polygon points="${el.points}" fill="${fill}" ${stroke} ${common} />
      </g>`;
      break;
    }
    case 'star': {
      const k = Math.max(el.w, el.h) ? 1 : 1;
      const points = starPoints(el.w, el.h, el.n || 5, el.inner || 0.5);
      content = `<g transform="scale(${el.w / el.vb} ${el.h / el.vb})">
        <polygon points="${points}" fill="${fill}" ${stroke} ${common} />
      </g>`;
      break;
    }
    case 'line': {
      const k = Math.max(el.w, el.h) ? 1 : 1;
      content = `<g transform="scale(${el.w / el.vb} ${el.h / el.vb})">
        <line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="${el.stroke || '#000'}" stroke-width="${el.strokeWidth || 1}" ${common} stroke-linecap="round" />
      </g>`;
      break;
    }
    case 'icon': {
      const iconPath = ICON_PATHS[el.icon] || ICON_PATHS.Circle;
      const k = Math.max(el.w, el.h) ? 1 : 1;
      content = `<g transform="scale(${el.w / el.vb} ${el.h / el.vb})" fill="${fill}" ${common}>
        ${iconPath}
      </g>`;
      break;
    }
    case 'image': {
      const k = Math.max(el.w, el.h) ? 1 : 1;
      const src = resolveSrc(el.src) || '';
      content = `<g transform="scale(${el.w / el.vb} ${el.h / el.vb})">
        <image href="${src}" x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" preserveAspectRatio="xMidYMid slice" ${common} />
      </g>`;
      break;
    }
    case 'text': {
      const k = Math.max(el.w, el.h) ? 1 : 1;
      const lines = wrapLinesServer(el);
      const fontSize = el.fontSize || 14;
      const fontFamily = el.fontFamily || 'Inter';
      const fontWeight = el.fontWeight || 'normal';
      const fontStyle = el.italic ? 'italic' : 'normal';
      const textAlign = el.textAlign || 'left';
      const lineHeight = el.lineHeight || 1.4;
      
      let textY = el.y;
      const lineHeightPx = fontSize * lineHeight;
      
      const textLines = lines.map(line => 
        `<tspan x="${el.x}" dy="${line === lines[0] ? 0 : lineHeightPx}" text-anchor="${textAlign}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" fill="${fill}">${escapeXml(line)}</tspan>`
      ).join('');
      
      content = `<g transform="scale(${k})">
        <text x="${el.x}" y="${textY}" ${common}>
          ${textLines}
        </text>
      </g>`;
      break;
    }
    default:
      content = '';
  }

  return defs + content;
}

/**
 * Render a design page to SVG string
 * @param {Object} doc - Design document
 * @param {number} pageIndex - Page index to render
 * @param {Object} options - Rendering options
 * @returns {string} SVG markup
 */
function renderPageToSvgString(doc, pageIndex, options = {}) {
  const {
    mode = 'export',
    includeBleed = false,
    uid = `page-${pageIndex}`,
    resolveSrc = (src) => src,
    width = '100%',
    height = '100%'
  } = options;

  const page = doc.pages[pageIndex];
  if (!page) {
    return `<svg width="${width}" height="${height}"><text x="50%" y="50%" text-anchor="middle">Page not found</text></svg>`;
  }

  const b = includeBleed ? doc.bleed || 0 : 0;
  const w = doc.width + 2 * b;
  const h = doc.height + 2 * b;
  const unit = doc.unit === 'mm' ? 'mm' : '';

  const finalWidth = width === '100%' ? `${w}${unit}` : width;
  const finalHeight = height === '100%' ? `${h}${unit}` : height;

  // Build SVG elements
  const elementsSvg = page.elements.map((el, i) => {
    return generateElementSvg(el, `${uid}-${i}`, resolveSrc);
  }).join('\n');

  // Background
  let backgroundSvg = '';
  if (page.background) {
    if (page.background.color && page.background.color !== 'transparent') {
      backgroundSvg = `<rect x="0" y="0" width="${w}" height="${h}" fill="${escapeXml(page.background.color)}" />`;
    }
    if (page.background.image) {
      const bgSrc = resolveSrc(page.background.image) || '';
      backgroundSvg = `<image href="${bgSrc}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" />`;
    }
  }

  // SVG header
  const svgHeader = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${finalWidth}" height="${finalHeight}" xmlns="http://www.w3.org/2000/svg">`;

  // SVG body
  const svgBody = `
  <g>
    ${backgroundSvg}
    ${elementsSvg}
  </g>
</svg>`;

  return svgHeader + svgBody;
}

module.exports = {
  renderPageToSvgString
};
