// src/design/shared/iconPaths.js
// Converts lucide icons into plain SVG path data (24×24 viewBox) so they can be
// drawn by non-React renderers (printable layout engine, PDF/SVG exports).
import * as Icons from 'lucide-react';

const cache = new Map();

function flat(children) {
  if (Array.isArray(children)) return children.flatMap(flat);
  return children ? [children] : [];
}

const n = (v) => Number(v) || 0;

function nodeToPath(type, p) {
  switch (type) {
    case 'path':
      return p.d;
    case 'circle': {
      const cx = n(p.cx); const cy = n(p.cy); const r = n(p.r);
      return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
    }
    case 'ellipse': {
      const cx = n(p.cx); const cy = n(p.cy); const rx = n(p.rx); const ry = n(p.ry);
      return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
    }
    case 'line':
      return `M${n(p.x1)} ${n(p.y1)}L${n(p.x2)} ${n(p.y2)}`;
    case 'rect': {
      const x = n(p.x); const y = n(p.y); const w = n(p.width); const h = n(p.height);
      const r = Math.min(n(p.rx || p.ry), w / 2, h / 2);
      if (!r) return `M${x} ${y}h${w}v${h}h${-w}z`;
      return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;
    }
    case 'polyline':
    case 'polygon': {
      const pts = String(p.points || '').trim().split(/[\s,]+/).map(Number);
      let d = '';
      for (let i = 0; i + 1 < pts.length; i += 2) d += `${i ? 'L' : 'M'}${pts[i]} ${pts[i + 1]}`;
      return type === 'polygon' ? `${d}z` : d;
    }
    default:
      return '';
  }
}

/** Array of path `d` strings for a lucide icon name (stroke-based, 24×24). */
export function iconPaths(name) {
  if (cache.has(name)) return cache.get(name);
  const Icon = Icons[name];
  let out = [];
  try {
    const el = Icon && Icon.render ? Icon.render({}, null) : null;
    out = el ? flat(el.props.children).map((c) => nodeToPath(c.type, c.props || {})).filter(Boolean) : [];
  } catch (e) {
    out = [];
  }
  cache.set(name, out);
  return out;
}

/** Single combined path string. */
export function iconPathD(name) {
  return iconPaths(name).join(' ');
}
