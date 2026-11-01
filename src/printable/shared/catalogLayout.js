// src/printable/shared/catalogLayout.js
// Compositions for the business-card catalogue (cardCatalog.js). Produces the
// same printable node list as layout.js (rect, polygon, circle, path, line,
// text, image, qr) so preview, PNG and server exports share one source.
import { iconPaths } from '../../design/shared/iconPaths.js';

const rect = (id, x, y, w, h, fill, extra = {}) => ({ id, type: 'rect', x, y, w, h, fill, locked: true, ...extra });
const poly = (id, points, fill, extra = {}) => ({ id, type: 'polygon', points, fill, locked: true, ...extra });
const circle = (id, cx, cy, r, fill, extra = {}) => ({ id, type: 'circle', cx, cy, r, fill, locked: true, ...extra });
const path = (id, d, extra = {}) => ({ id, type: 'path', d, locked: true, width: 0, ...extra });
const line = (id, x1, y1, x2, y2, stroke, width = 0.35, extra = {}) => ({ id, type: 'line', x1, y1, x2, y2, stroke, width, locked: true, ...extra });
const grad = (from, to, angle = 135) => ({ type: 'linear', angle, stops: [[0, from], [1, to]] });
const f = (n) => Number(n).toFixed(2);

function mix(a, b, t) {
  const ok = (h) => /^#[0-9a-f]{6}$/i.test(h || '');
  if (!ok(a) || !ok(b)) return a;
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a); const B = p(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** Lucide icon scaled into a square box, as stroked path nodes (in mm). */
function emblemNodes(id, icon, x, y, size, color, strokeWidth = 1.6) {
  const k = size / 24;
  return iconPaths(icon).map((d, i) => path(`${id}-${i}`, scalePath(d, k, x, y), {
    fill: 'none', stroke: color, width: strokeWidth * k, linecap: 'round', linejoin: 'round'
  }));
}

// Scale/translate an SVG path (absolute and relative commands, arcs included).
function scalePath(d, k, ox, oy) {
  const tokens = String(d).match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  let out = '';
  let cmd = '';
  let idx = 0;
  const isAbs = (c) => c === c.toUpperCase();
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (/[a-zA-Z]/.test(t)) { cmd = t; idx = 0; out += t; continue; }
    const v = Number(t);
    const C = cmd.toUpperCase();
    // A leading relative moveto is absolute (SVG spec), as is its first pair.
    const firstPair = cmd === 'm' && i <= 2 && idx < 2;
    let r;
    if (C === 'A') {
      const pos = idx % 7;
      if (pos === 0 || pos === 1) r = v * k;
      else if (pos === 5) r = isAbs(cmd) ? v * k + ox : v * k;
      else if (pos === 6) r = isAbs(cmd) ? v * k + oy : v * k;
      else r = v;
    } else if (C === 'H') r = isAbs(cmd) ? v * k + ox : v * k;
    else if (C === 'V') r = isAbs(cmd) ? v * k + oy : v * k;
    else r = isAbs(cmd) || firstPair ? v * k + (idx % 2 === 0 ? ox : oy) : v * k;
    const isFlag = C === 'A' && (idx % 7 === 3 || idx % 7 === 4);
    out += `${idx ? ' ' : ''}${isFlag ? (v ? 1 : 0) : f(r)}`;
    idx += 1;
    if (i + 1 < tokens.length && !/[a-zA-Z]/.test(tokens[i + 1])) out += '';
    else out += ' ';
  }
  return out.trim();
}

// Decoration per composition. Returns { nodes, text: 'left'|'right'|'center', ink, emblemInk, panel }.
function decor(comp, W, H, c, back) {
  const n = [];
  const out = { text: 'left', ink: c.text, sub: c.secondary, emblemInk: c.primary, emblemBg: null };
  switch (comp) {
    case 'diagonal':
      n.push(poly('d-panel', [[W * 0.58, 0], [W, 0], [W, H], [W * 0.36, H]], c.primary));
      n.push(poly('d-stripe', [[W * 0.5, 0], [W * 0.555, 0], [W * 0.335, H], [W * 0.28, H]], c.accent));
      out.emblemInk = c.background; out.emblemSide = 'right';
      break;
    case 'split':
      n.push(rect('s-panel', W * 0.56, 0, W * 0.44, H, c.primary));
      n.push(rect('s-rule', W * 0.56, 0, 1, H, c.accent));
      out.emblemInk = c.background; out.emblemSide = 'right';
      break;
    case 'wave':
      n.push(path('w-shape', `M${f(W * 0.6)} 0 C${f(W * 0.46)} ${f(H * 0.35)} ${f(W * 0.48)} ${f(H * 0.75)} ${f(W * 0.62)} ${f(H)} L${W} ${H} L${W} 0 Z`, { fill: c.primary }));
      n.push(path('w-ring', `M${f(W * 0.66)} 0 C${f(W * 0.53)} ${f(H * 0.35)} ${f(W * 0.55)} ${f(H * 0.75)} ${f(W * 0.68)} ${f(H)}`, { fill: 'none', stroke: c.accent, width: 1.2 }));
      out.emblemInk = c.background; out.emblemSide = 'right';
      break;
    case 'bottomwave':
      n.push(path('bw-a', `M0 ${f(H * 0.86)} C${f(W * 0.3)} ${f(H * 0.74)} ${f(W * 0.6)} ${f(H * 0.98)} ${W} ${f(H * 0.8)} L${W} ${H} L0 ${H} Z`, { fill: c.primary }));
      n.push(path('bw-b', `M${f(W * 0.45)} ${H} C${f(W * 0.65)} ${f(H * 0.88)} ${f(W * 0.85)} ${f(H * 0.9)} ${W} ${f(H * 0.86)} L${W} ${H} Z`, { fill: c.accent, opacity: 0.85 }));
      n.push(rect('bw-bar', 4.5, 9, 1, 15, c.primary));
      out.emblemSide = 'right';
      break;
    case 'triangles': {
      const s = 5.2;
      for (let row = 0; row < 5; row += 1) {
        for (let col = 0; col <= row; col += 1) {
          const x = W - 4 - col * s * 1.25 - s;
          const y = H - 4 - (4 - row) * s * 1.15 - s * 0.8;
          n.push(poly(`t-${row}-${col}`, [[x, y + s * 0.8], [x + s / 2, y], [x + s, y + s * 0.8]], c.accent, { opacity: 0.9 }));
        }
      }
      out.emblemSide = 'left'; out.text = 'right';
      break;
    }
    case 'dots': {
      for (let i = 0; i < 7; i += 1) for (let j = 0; j < 5; j += 1) n.push(circle(`dot-${i}-${j}`, W - 30 + i * 4.4, 4 + j * 4.4, 0.75, c.accent, { opacity: 0.55 }));
      n.push(circle('dot-big', 6, H - 4, 13, c.primary, { opacity: 0.18 }));
      n.push(circle('dot-mid', W - 8, H - 6, 6, c.secondary, { opacity: 0.35 }));
      out.emblemSide = 'right';
      break;
    }
    case 'blob':
      n.push(path('b-a', `M${W} 0 L${f(W * 0.55)} 0 C${f(W * 0.6)} ${f(H * 0.3)} ${f(W * 0.75)} ${f(H * 0.42)} ${f(W * 0.68)} ${f(H * 0.7)} C${f(W * 0.62)} ${f(H * 0.9)} ${f(W * 0.8)} ${H} ${W} ${H} Z`, { fill: grad(c.primary, c.accent, 120), opacity: 0.95 }));
      n.push(circle('b-b', 4, 4, 9, c.secondary, { opacity: 0.35 }));
      out.emblemInk = c.background; out.emblemSide = 'right';
      break;
    case 'corner':
      n.push(poly('c-a', [[0, 0], [W * 0.26, 0], [0, H * 0.42]], c.primary));
      n.push(poly('c-b', [[W, H], [W * 0.7, H], [W, H * 0.5]], c.accent));
      n.push(circle('c-dot', W * 0.3, H * 0.12, 1.4, c.accent));
      out.emblemSide = 'right'; out.textX = 12; out.textY = 17;
      break;
    case 'sidebar':
      n.push(rect('sb-band', 0, 0, 9, H, c.primary));
      ['Phone', 'Mail', 'MapPin'].forEach((ic, i) => n.push(...emblemNodes(`sb-ic-${ic}`, ic, 2.5, H * 0.52 + i * 6.2, 4, c.background, 2)));
      out.emblemSide = 'right'; out.textX = 14;
      break;
    case 'topband':
      n.push(rect('tb-band', 0, 0, W, 8, c.primary));
      n.push(rect('tb-line', 0, 8, W, 0.8, c.accent));
      n.push(rect('tb-foot', 0, H - 2.5, W, 2.5, c.primary));
      out.emblemSide = 'right'; out.textY = 14;
      break;
    case 'arrowtab':
      n.push(poly('at-tab', [[W * 0.62, H * 0.75], [W * 0.66, H * 0.64], [W, H * 0.64], [W, H * 0.86], [W * 0.66, H * 0.86]], c.primary));
      n.push(rect('at-edge', W - 3, 0, 3, H, c.primary));
      out.emblemSide = 'right'; out.emblemTop = true;
      break;
    case 'circuit': {
      const ink = c.primary;
      [[3, 0, 3, 14, 9, 14], [0, H - 16, 8, H - 16, 8, H - 6], [12, 0, 12, 7, 18, 7], [3, H, 3, H - 9]].forEach((pts, i) => {
        let d = `M${pts[0]} ${pts[1]}`;
        for (let k = 2; k < pts.length; k += 2) d += ` L${pts[k]} ${pts[k + 1]}`;
        n.push(path(`ci-${i}`, d, { fill: 'none', stroke: ink, width: 0.6 }));
        n.push(circle(`ci-n-${i}`, pts[pts.length - 2], pts[pts.length - 1], 0.9, ink));
      });
      out.emblemSide = 'right'; out.textX = 16;
      break;
    }
    case 'stripes': {
      const b = 3.2;
      n.push(rect('st-frame', 0, 0, W, H, 'none', { stroke: c.primary, width: b * 2 }));
      for (let x = -H; x < W + H; x += 4.5) {
        n.push(poly(`st-${x}`, [[x, 0], [x + 2.2, 0], [x + 2.2 - b, b], [x - b, b]], c.background));
        n.push(poly(`st-b-${x}`, [[x, H - b], [x + 2.2, H - b], [x + 2.2 - b, H], [x - b, H]], c.background));
      }
      n.push(rect('st-inner', b, b, W - 2 * b, H - 2 * b, c.background));
      out.emblemSide = 'right';
      break;
    }
    case 'circles':
      n.push(circle('cc-big', W + 2, -4, 22, c.primary));
      n.push(circle('cc-ring', 2, H + 3, 13, 'none', { stroke: c.primary, width: 1.6 }));
      n.push(circle('cc-small', 4, H - 4, 3, c.accent));
      out.emblemSide = 'left'; out.text = 'right';
      break;
    case 'frame':
      n.push(rect('fr-a', 3, 3, W - 6, H - 6, 'none', { stroke: c.primary, width: 0.35 }));
      n.push(rect('fr-b', 4.4, 4.4, W - 8.8, H - 8.8, 'none', { stroke: mix(c.primary, c.background, 0.5), width: 0.2 }));
      out.emblemSide = 'left'; out.text = 'right';
      break;
    case 'glow':
      n.push(circle('g-a', W * 0.78, H * 0.45, 20, c.secondary, { opacity: 0.22 }));
      n.push(circle('g-b', W * 0.78, H * 0.45, 13, c.primary, { opacity: 0.25 }));
      n.push(circle('g-c', 4, H - 2, 14, c.accent, { opacity: 0.12 }));
      out.emblemSide = 'right'; out.emblemBg = grad(c.primary, c.secondary, 135);
      break;
    case 'minimal':
    default:
      n.push(line('m-rule', 8, H * 0.5, 30, H * 0.5, c.primary, 0.4));
      out.emblemSide = 'right';
      break;
  }
  out.nodes = n;
  if (back) out.text = 'center';
  return out;
}

export function catalogLayout(ctx, template, helpers) {
  const { W, H, config, colors: c, heading, body, name, title, company, lines, slogan } = ctx;
  const back = ctx.side === 'back';
  const bg = template.composition === 'glow' ? grad(mix(c.background, '#ffffff', 0.08), c.background, 140) : c.background;
  const nodes = [rect('bg', 0, 0, W, H, bg)];
  const backgroundUrl = config.background && config.background.url;
  if (backgroundUrl) nodes.push({ id: 'bg-image', type: 'image', src: backgroundUrl, x: 0, y: 0, w: W, h: H, fit: 'cover', locked: true });
  const d = decor(template.composition, W, H, c, back);
  nodes.push(...d.nodes);
  const up = (t) => (template.upper ? String(t).toUpperCase() : t);
  const brand = company || 'VOTRE MARQUE';

  // Brand block: uploaded logo, otherwise the industry/style emblem.
  const emblemBlock = (cx, top, size, ink) => {
    const logo = helpers.buildLogoNode(config, cx - size / 2, top, back ? 'back' : 'front');
    if (logo) { nodes.push(logo); return; }
    if (d.emblemBg) nodes.push(circle('em-bg', cx, top + size / 2, size * 0.62, d.emblemBg));
    nodes.push(...emblemNodes('emblem', template.emblem, cx - size / 2, top, size, d.emblemBg ? '#ffffff' : ink));
    nodes.push(helpers.textNode('brand', {
      x: cx - 18, y: top + size + 1.8, w: 36, h: 5, text: String(brand).toUpperCase(),
      font: heading.pdfBold || heading.pdf, cssFont: heading.css, size: 6.4, color: ink, align: 'center', bold: true, spacing: 0.25
    }));
    if (slogan) nodes.push(helpers.textNode('brand-slogan', {
      x: cx - 18, y: top + size + 6.2, w: 36, h: 4, text: String(slogan).toUpperCase(),
      font: body.pdf, cssFont: body.css, size: 4.2, color: ink, align: 'center', spacing: 0.3
    }));
  };

  if (back) {
    emblemBlock(W / 2, H * 0.2, 14, d.emblemSide === 'right' && ['diagonal', 'split', 'wave', 'blob'].includes(template.composition) ? c.primary : c.primary);
    const qr = helpers.buildQrNode(config, W / 2 - 7, H - 19, 13, 'back');
    if (qr) nodes.push({ ...qr, keepPosition: true });
    return nodes;
  }

  const right = d.emblemSide === 'right';
  const emblemCx = right ? W * 0.8 : W * 0.22;
  emblemBlock(emblemCx, d.emblemTop ? 8 : H * 0.2, 13, d.emblemInk);

  const tx = d.text === 'right' ? W * 0.44 : (d.textX || 8);
  const tw = d.text === 'right' ? W * 0.5 : (right ? W * 0.5 - (tx - 8) : W * 0.55);
  const ty = d.textY || (template.composition === 'stripes' ? 10 : 9);
  nodes.push(helpers.textNode('name', {
    x: tx, y: ty, w: tw, h: 10, text: up(name || 'Votre nom'), font: heading.pdfBold || heading.pdf,
    cssFont: heading.css, size: config.typeScale.name, color: d.ink, align: 'left', bold: true, spacing: template.upper ? 0.15 : 0
  }));
  if (title) nodes.push(helpers.textNode('title', {
    x: tx, y: ty + 7.5, w: tw, h: 6, text: title, font: body.pdf, cssFont: body.css,
    size: config.typeScale.title, color: d.sub, align: 'left'
  }));
  nodes.push(rect('accent-rule', tx, ty + 15, 14, 0.8, c.accent));
  nodes.push(helpers.textNode('details', {
    x: tx, y: ty + 19, w: tw, h: H - ty - 22, text: lines.join('\n'), font: body.pdf, cssFont: body.css,
    size: config.typeScale.body, color: d.ink, align: 'left', lines: true
  }));
  const qrSize = 12;
  const qr = helpers.buildQrNode(config, right ? W - qrSize - 5 : W * 0.22 - qrSize / 2, H - qrSize - 4.5, qrSize, 'front');
  if (qr && template.composition !== 'arrowtab') nodes.push({ ...qr, keepPosition: true });
  return nodes;
}
