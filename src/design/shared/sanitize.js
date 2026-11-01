// src/design/shared/sanitize.js
// Normalises design documents. Used by the API (server-side validation) and by
// the editor when a document is loaded, so both sides agree on the schema.
import { DESIGN_FONT_IDS } from './fonts.js';
import { ICON_NAMES } from './icons.js';
import { DESIGN_TYPES, getModule, getKind } from './modules.js';

export const DESIGN_LIMITS = {
  pages: 30,
  elementsPerPage: 400,
  text: 5000,
  title: 120,
  jsonBytes: 2 * 1024 * 1024,
  maxDimension: { mm: 5000, px: 10000 }
};

export const ELEMENT_TYPES = ['text', 'rect', 'ellipse', 'triangle', 'star', 'line', 'icon', 'image', 'qr', 'path'];
const PATH_RE = /^[MmLlHhVvCcSsQqTtAaZzeE0-9.,\s+-]*$/;

const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;
const UPLOAD_RE = /^\/uploads\/[A-Za-z0-9._-]{1,200}\.(png|jpe?g|webp|gif)$/i;
const ALIGNS = ['left', 'center', 'right'];
const FITS = ['cover', 'contain'];

let idCounter = 0;
export function newId(prefix = 'el') {
  idCounter = (idCounter + 1) % 1e6;
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${idCounter.toString(36)}`;
}

function num(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function str(value, max, fallback = '') {
  if (value === undefined || value === null) return fallback;
  return String(value).replace(/\u0000/g, '').substring(0, max);
}

export function color(value, fallback = '#000000') {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'transparent' || raw === 'none') return 'transparent';
  if (/^#[0-9a-f]{6}$/.test(raw)) return raw;
  if (/^#[0-9a-f]{3}$/.test(raw)) return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`;
  return fallback;
}

export function sanitizeImageSrc(value) {
  const raw = String(value || '').trim();
  return UPLOAD_RE.test(raw) && !raw.includes('..') ? raw : '';
}

function sanitizeBackground(raw, fallbackColor) {
  const bg = raw && typeof raw === 'object' ? raw : { color: raw };
  const out = { color: color(bg.color, fallbackColor) };
  if (bg.gradient && typeof bg.gradient === 'object') {
    out.gradient = {
      from: color(bg.gradient.from, out.color === 'transparent' ? '#ffffff' : out.color),
      to: color(bg.gradient.to, '#000000'),
      angle: num(bg.gradient.angle, 135, 0, 360)
    };
  }
  const image = sanitizeImageSrc(bg.image);
  if (image) out.image = image;
  return out;
}

export function sanitizeElement(raw, maxCoord) {
  if (!raw || typeof raw !== 'object' || !ELEMENT_TYPES.includes(raw.type)) return null;
  const lim = maxCoord * 4;
  const el = {
    id: ID_RE.test(String(raw.id || '')) ? String(raw.id) : newId(),
    type: raw.type,
    name: str(raw.name, 60),
    x: num(raw.x, 0, -lim, lim),
    y: num(raw.y, 0, -lim, lim),
    w: num(raw.w, 10, 0.1, lim),
    h: num(raw.h, 10, 0.1, lim),
    rotation: num(raw.rotation, 0, -360, 360),
    opacity: num(raw.opacity, 1, 0, 1),
    locked: Boolean(raw.locked),
    hidden: Boolean(raw.hidden)
  };
  if (raw.gradient && typeof raw.gradient === 'object' && ['rect', 'ellipse', 'triangle', 'star', 'path', 'text'].includes(raw.type)) {
    el.gradient = { from: color(raw.gradient.from, '#4f46e5'), to: color(raw.gradient.to, '#ec4899'), angle: num(raw.gradient.angle, 135, 0, 360) };
  }
  switch (raw.type) {
    case 'text':
      Object.assign(el, {
        text: str(raw.text, DESIGN_LIMITS.text, 'Texte'),
        font: DESIGN_FONT_IDS.includes(raw.font) ? raw.font : 'sans',
        size: num(raw.size, 12, 0.5, lim),
        weight: num(raw.weight, 400, 100, 900),
        italic: Boolean(raw.italic),
        underline: Boolean(raw.underline),
        uppercase: Boolean(raw.uppercase),
        align: ALIGNS.includes(raw.align) ? raw.align : 'left',
        color: color(raw.color, '#111111'),
        lineHeight: num(raw.lineHeight, 1.2, 0.5, 4),
        letterSpacing: num(raw.letterSpacing, 0, -0.5, 2),
        arc: num(raw.arc, 0, -360, 360),
        depth: num(raw.depth, 0, 0, 30)
      });
      break;
    case 'rect':
    case 'ellipse':
    case 'triangle':
    case 'star':
      Object.assign(el, {
        fill: color(raw.fill, '#4f46e5'),
        stroke: color(raw.stroke, 'transparent'),
        strokeWidth: num(raw.strokeWidth, 0, 0, lim / 10),
        radius: num(raw.radius, 0, 0, lim),
        points: Math.round(num(raw.points, 5, 3, 16)),
        innerRatio: num(raw.innerRatio, 0.45, 0.1, 0.95)
      });
      break;
    case 'line':
      Object.assign(el, {
        stroke: color(raw.stroke, '#111111'),
        strokeWidth: num(raw.strokeWidth, 1, 0.05, lim / 10),
        dash: Boolean(raw.dash)
      });
      break;
    case 'icon':
      Object.assign(el, {
        icon: ICON_NAMES.includes(raw.icon) ? raw.icon : 'Star',
        color: color(raw.color, '#111111'),
        strokeWidth: num(raw.strokeWidth, 2, 0.25, 4),
        fill: color(raw.fill, 'transparent')
      });
      break;
    case 'image':
      Object.assign(el, {
        src: sanitizeImageSrc(raw.src),
        fit: FITS.includes(raw.fit) ? raw.fit : 'cover',
        radius: num(raw.radius, 0, 0, lim)
      });
      break;
    case 'path':
      Object.assign(el, {
        d: PATH_RE.test(String(raw.d || '')) ? String(raw.d || '').substring(0, 20000) : '',
        vb: num(raw.vb, 24, 1, 10000),
        fill: color(raw.fill, '#4f46e5'),
        stroke: color(raw.stroke, 'transparent'),
        strokeWidth: num(raw.strokeWidth, 0, 0, 1000)
      });
      break;
    case 'qr':
      Object.assign(el, {
        value: str(raw.value, 1000, 'https://example.com'),
        color: color(raw.color, '#000000'),
        background: color(raw.background, '#ffffff')
      });
      break;
    default:
      return null;
  }
  return el;
}

/**
 * Sanitise a full design document.
 * @param {object} raw     untrusted document
 * @param {object} ctx     { type, subtype }
 */
export function sanitizeDesignData(raw, ctx = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const unit = src.unit === 'px' ? 'px' : 'mm';
  const maxDim = DESIGN_LIMITS.maxDimension[unit];
  const minDim = unit === 'px' ? 16 : 10;
  const width = num(src.width, unit === 'px' ? 1080 : 210, minDim, maxDim);
  const height = num(src.height, unit === 'px' ? 1080 : 297, minDim, maxDim);
  const transparent = Boolean(src.transparent);
  const defaultBg = transparent ? 'transparent' : '#ffffff';
  const pagesIn = Array.isArray(src.pages) && src.pages.length ? src.pages : [{ name: 'Page 1', elements: [] }];
  const pages = pagesIn.slice(0, DESIGN_LIMITS.pages).map((p, i) => {
    const page = p && typeof p === 'object' ? p : {};
    const elements = (Array.isArray(page.elements) ? page.elements : [])
      .slice(0, DESIGN_LIMITS.elementsPerPage)
      .map((e) => sanitizeElement(e, Math.max(width, height)))
      .filter(Boolean);
    return {
      id: ID_RE.test(String(page.id || '')) ? String(page.id) : newId('pg'),
      name: str(page.name, 60, `Page ${i + 1}`) || `Page ${i + 1}`,
      background: sanitizeBackground(page.background, defaultBg),
      elements
    };
  });

  const meta = src.meta && typeof src.meta === 'object' ? src.meta : {};
  const mod = getModule(ctx.type);
  const out = {
    version: 1,
    unit,
    width,
    height,
    formatId: str(src.formatId, 40, 'custom') || 'custom',
    bleed: unit === 'mm' ? num(src.bleed, 0, 0, 20) : 0,
    safe: unit === 'mm' ? num(src.safe, 0, 0, 50) : 0,
    transparent,
    pages,
    meta: {
      platform: str(meta.platform, 40),
      sector: str(meta.sector, 40),
      style: str(meta.style, 40),
      brandColor: color(meta.brandColor, '#4f46e5'),
      sceneDuration: num(meta.sceneDuration, 3, 1, 20)
    }
  };
  if (ctx.type === 'pocket' || (mod && mod.flap)) {
    out.flap = num(src.flap, mod ? mod.flap : 100, 0, height * 0.6);
  }
  return out;
}

export function isValidType(type) {
  return DESIGN_TYPES.includes(type);
}

export function sanitizeSubtype(type, subtype) {
  if (type !== 'other') return null;
  return getKind(subtype) ? subtype : 'illustration';
}
