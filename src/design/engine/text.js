// src/design/engine/text.js
// Text measuring / wrapping for SVG text (SVG has no native wrapping).
import { fontCss } from '../shared/fonts.js';

let ctx = null;
function context() {
  if (ctx) return ctx;
  if (typeof document === 'undefined') return null;
  ctx = document.createElement('canvas').getContext('2d');
  return ctx;
}

export function textFont(el, size = 100) {
  return `${el.italic ? 'italic ' : ''}${el.weight || 400} ${size}px ${fontCss(el.font)}`;
}

/** Width of `text` rendered at font size `size` (same unit as size). */
export function measure(el, text, size) {
  const c = context();
  const base = 100;
  const spacing = (el.letterSpacing || 0) * size * Math.max(0, text.length - 1);
  if (!c) return text.length * size * 0.55 + spacing;
  c.font = textFont(el, base);
  return (c.measureText(text).width / base) * size + spacing;
}

/** Split text into lines that fit `el.w`, honouring explicit line breaks. */
export function wrapLines(el) {
  const raw = el.uppercase ? String(el.text || '').toUpperCase() : String(el.text || '');
  const size = el.size;
  const maxWidth = Math.max(el.w, size * 0.6);
  const lines = [];
  raw.split('\n').forEach((paragraph) => {
    const words = paragraph.split(/(\s+)/).filter((w) => w.length);
    if (!words.length) { lines.push(''); return; }
    let line = '';
    words.forEach((word) => {
      const candidate = line + word;
      if (line && measure(el, candidate.trimEnd(), size) > maxWidth + 0.01) {
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

export function textHeight(el) {
  return wrapLines(el).length * el.size * el.lineHeight;
}
