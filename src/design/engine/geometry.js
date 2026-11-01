// src/design/engine/geometry.js
export const DEG = Math.PI / 180;

export function rotatePoint(x, y, angleDeg) {
  const a = angleDeg * DEG;
  return { x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) };
}

export function center(el) {
  return { x: el.x + el.w / 2, y: el.y + el.h / 2 };
}

/** Axis-aligned bounding box of a (possibly rotated) element. */
export function bounds(el) {
  if (!el.rotation) return { x: el.x, y: el.y, w: el.w, h: el.h };
  const c = center(el);
  const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
    const p = rotatePoint((sx * el.w) / 2, (sy * el.h) / 2, el.rotation);
    return { x: c.x + p.x, y: c.y + p.y };
  });
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

export function unionBounds(list) {
  if (!list.length) return null;
  const b = list.map(bounds);
  const x = Math.min(...b.map((r) => r.x));
  const y = Math.min(...b.map((r) => r.y));
  return { x, y, w: Math.max(...b.map((r) => r.x + r.w)) - x, h: Math.max(...b.map((r) => r.y + r.h)) - y };
}

export function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function starPoints(w, h, points, innerRatio) {
  const out = [];
  const n = points * 2;
  for (let i = 0; i < n; i += 1) {
    const r = i % 2 === 0 ? 1 : innerRatio;
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    out.push(`${(w / 2 + Math.cos(a) * r * (w / 2)).toFixed(3)},${(h / 2 + Math.sin(a) * r * (h / 2)).toFixed(3)}`);
  }
  return out.join(' ');
}

export function gradientVector(angle) {
  const a = (angle - 90) * DEG;
  const x = Math.cos(a) / 2;
  const y = Math.sin(a) / 2;
  return { x1: 0.5 - x, y1: 0.5 - y, x2: 0.5 + x, y2: 0.5 + y };
}

export const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
