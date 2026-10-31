// src/design/engine/factory.js
// Document and element factories shared by the studio and the editor.
import {
  getModule, getDefaultPages, getPrintSpec, isTransparentByDefault
} from '../shared/modules.js';
import { sanitizeDesignData, newId } from '../shared/sanitize.js';
import { textHeight } from './text';

/** Build an empty document for a module / format. */
export function createDocument({ type, subtype, format, platform }) {
  const mod = getModule(type);
  const unit = format.unit || 'mm';
  const { bleed, safe } = getPrintSpec(type, unit, format, subtype);
  const transparent = isTransparentByDefault(type, subtype);
  const names = getDefaultPages(type, subtype);
  const fixed = mod && mod.fixedPages;
  const doc = {
    version: 1,
    unit,
    width: format.width,
    height: format.height,
    formatId: format.id || 'custom',
    bleed,
    safe,
    transparent,
    pages: names.map((name, i) => ({
      id: fixed ? fixed[i].id : newId('pg'),
      name,
      background: { color: transparent ? 'transparent' : '#ffffff' },
      elements: []
    })),
    meta: { platform: platform || format.platform || '', sector: '', style: '', brandColor: '#4f46e5', sceneDuration: 3 }
  };
  if (mod && mod.flap) doc.flap = Math.min(mod.flap, format.height * 0.4);
  return sanitizeDesignData(doc, { type, subtype });
}

/** Base unit for sizing new elements relative to the page. */
export function docUnit(doc) {
  return Math.min(doc.width, doc.height);
}

export function fitText(el) {
  if (el.type !== 'text') return el;
  const h = textHeight(el);
  return Math.abs(h - el.h) > 0.01 ? { ...el, h } : el;
}

const TEXT_PRESETS = {
  heading: { text: 'Titre principal', sizeRatio: 0.09, weight: 700 },
  subheading: { text: 'Sous-titre', sizeRatio: 0.055, weight: 600 },
  body: { text: 'Votre texte ici. Double-cliquez ou utilisez le panneau de droite pour le modifier.', sizeRatio: 0.035, weight: 400 }
};

export function createElement(kind, doc, extra = {}) {
  const u = docUnit(doc);
  const base = { id: newId(), rotation: 0, opacity: 1, locked: false, hidden: false, name: '' };
  let el;
  if (kind.startsWith('text')) {
    const preset = TEXT_PRESETS[kind.split(':')[1] || 'body'] || TEXT_PRESETS.body;
    const w = doc.width * 0.7;
    el = {
      ...base, type: 'text', text: preset.text, font: 'sans', size: u * preset.sizeRatio, weight: preset.weight,
      italic: false, underline: false, uppercase: false, align: 'center', color: '#111111', lineHeight: 1.2, letterSpacing: 0,
      x: (doc.width - w) / 2, y: doc.height * 0.4, w, h: u * preset.sizeRatio * 1.2
    };
  } else if (kind === 'line') {
    const w = doc.width * 0.5;
    el = { ...base, type: 'line', stroke: '#111111', strokeWidth: u * 0.006, dash: false, x: (doc.width - w) / 2, y: doc.height / 2 - u * 0.01, w, h: u * 0.02 };
  } else if (kind === 'icon') {
    const s = u * 0.2;
    el = { ...base, type: 'icon', icon: 'Star', color: '#111111', strokeWidth: 2, fill: 'transparent', x: (doc.width - s) / 2, y: (doc.height - s) / 2, w: s, h: s };
  } else if (kind === 'image') {
    const s = u * 0.4;
    el = { ...base, type: 'image', src: '', fit: 'cover', radius: 0, x: (doc.width - s) / 2, y: (doc.height - s) / 2, w: s, h: s };
  } else if (kind === 'qr') {
    const s = u * 0.25;
    el = { ...base, type: 'qr', value: 'https://macarte.app', color: '#000000', background: '#ffffff', x: (doc.width - s) / 2, y: (doc.height - s) / 2, w: s, h: s };
  } else {
    const s = u * 0.3;
    el = {
      ...base, type: kind, fill: '#4f46e5', stroke: 'transparent', strokeWidth: 0, radius: 0, points: 5, innerRatio: 0.45,
      x: (doc.width - s) / 2, y: (doc.height - s) / 2, w: s, h: s
    };
  }
  return fitText({ ...el, ...extra });
}

/** Scale every element of a document to new dimensions (format adaptation). */
export function adaptDocument(doc, format) {
  const sx = format.width / doc.width;
  const sy = format.height / doc.height;
  const s = Math.min(sx, sy);
  const pages = doc.pages.map((p) => ({
    ...p,
    id: newId('pg'),
    elements: p.elements.map((el) => {
      const cx = (el.x + el.w / 2) * sx;
      const cy = (el.y + el.h / 2) * sy;
      const isFullBleed = el.w >= doc.width * 0.98 || el.h >= doc.height * 0.98;
      const w = isFullBleed ? el.w * sx : el.w * s;
      const h = isFullBleed ? el.h * sy : el.h * s;
      const next = {
        ...el,
        id: newId(),
        w,
        h,
        x: cx - w / 2,
        y: cy - h / 2,
        size: el.size ? el.size * s : el.size,
        strokeWidth: el.strokeWidth && el.type !== 'icon' ? el.strokeWidth * s : el.strokeWidth,
        radius: el.radius ? el.radius * s : el.radius
      };
      return fitText(next);
    })
  }));
  return { ...doc, width: format.width, height: format.height, formatId: format.id || 'custom', pages, meta: { ...doc.meta, platform: format.platform || doc.meta.platform } };
}

export function cloneElements(elements, offset) {
  return elements.map((el) => ({ ...el, id: newId(), x: el.x + offset, y: el.y + offset, locked: false }));
}
