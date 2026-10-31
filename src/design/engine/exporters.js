// src/design/engine/exporters.js
// Client-side exports built on the shared SVG renderer and libraries already
// installed (jspdf). SVG keeps vector data; PNG/JPG/PDF are rasterised at
// print resolution (300 dpi, capped for very large posters).
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { jsPDF } from 'jspdf';
import DesignSvg from './DesignSvg';

const MAX_EDGE_PX = 9000;
const MM_PER_INCH = 25.4;

function slug(text) {
  return String(text || 'macarte').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'macarte';
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function toDataUrl(href) {
  const res = await fetch(href, { credentials: 'include' });
  if (!res.ok) throw new Error('image');
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Collect uploaded images used by a document and inline them as data URLs. */
async function buildResolver(doc) {
  const srcs = new Set();
  doc.pages.forEach((p) => {
    if (p.background && p.background.image) srcs.add(p.background.image);
    p.elements.forEach((el) => { if (el.type === 'image' && el.src) srcs.add(el.src); });
  });
  const map = {};
  await Promise.all([...srcs].map(async (src) => {
    try { map[src] = await toDataUrl(src); } catch (e) { map[src] = ''; }
  }));
  return (src) => map[src] || '';
}

/** Standalone SVG markup for a page (no guides). */
export async function pageSvgString(doc, pageIndex, { includeBleed = false, resolver } = {}) {
  const resolveSrc = resolver || await buildResolver(doc);
  const b = includeBleed ? doc.bleed : 0;
  const w = doc.width + 2 * b;
  const h = doc.height + 2 * b;
  const unit = doc.unit === 'mm' ? 'mm' : '';
  const markup = renderToStaticMarkup(
    <DesignSvg doc={doc} pageIndex={pageIndex} mode="export" includeBleed={includeBleed} uid={`x${pageIndex}`} resolveSrc={resolveSrc}
      width={`${w}${unit}`} height={`${h}${unit}`} />
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n${markup}`;
}

export function pixelSize(doc, { includeBleed = false, dpi = 300, scale = 1 } = {}) {
  const b = includeBleed ? doc.bleed : 0;
  const w = doc.width + 2 * b;
  const h = doc.height + 2 * b;
  let factor = doc.unit === 'mm' ? dpi / MM_PER_INCH : scale;
  if (Math.max(w, h) * factor > MAX_EDGE_PX) factor = MAX_EDGE_PX / Math.max(w, h);
  return {
    width: Math.round(w * factor),
    height: Math.round(h * factor),
    effectiveDpi: doc.unit === 'mm' ? Math.round(factor * MM_PER_INCH) : null
  };
}

async function svgToCanvas(svg, width, height, background) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Rendu SVG impossible'));
    i.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

export async function renderPageCanvas(doc, pageIndex, { includeBleed = false, dpi = 300, scale = 1, transparent = false, resolver } = {}) {
  const svg = await pageSvgString(doc, pageIndex, { includeBleed, resolver });
  const size = pixelSize(doc, { includeBleed, dpi, scale });
  const canvas = await svgToCanvas(svg, size.width, size.height, transparent ? null : '#ffffff');
  return { canvas, ...size };
}

const canvasBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/** Small PNG data URL used as project thumbnail. */
export async function makeThumbnail(doc) {
  const longest = Math.max(doc.width, doc.height);
  const scale = 480 / longest;
  const resolver = await buildResolver(doc);
  const svg = await pageSvgString(doc, 0, { resolver });
  const width = Math.max(1, Math.round(doc.width * scale));
  const height = Math.max(1, Math.round(doc.height * scale));
  const canvas = await svgToCanvas(svg, width, height, doc.transparent ? null : '#ffffff');
  return canvas.toDataURL('image/png');
}

function cropMarks(pdf, x, y, w, h, len, offset) {
  pdf.setLineWidth(0.25);
  pdf.setDrawColor(0, 0, 0);
  [[x, y, -1, -1], [x + w, y, 1, -1], [x, y + h, -1, 1], [x + w, y + h, 1, 1]].forEach(([cx, cy, dx, dy]) => {
    pdf.line(cx + dx * offset, cy, cx + dx * (offset + len), cy);
    pdf.line(cx, cy + dy * offset, cx, cy + dy * (offset + len));
  });
}

/**
 * Export a document.
 * format: 'svg' | 'png' | 'png-hd' | 'jpg' | 'pdf' | 'webm'
 * options: { pages: 'all'|number, includeBleed, cropMarks, spreads, dpi, title }
 */
export async function exportDocument(doc, format, options = {}) {
  const title = slug(options.title);
  const indices = options.pages === 'all' || options.pages === undefined
    ? doc.pages.map((_, i) => i)
    : [Number(options.pages)];
  const resolver = await buildResolver(doc);
  const includeBleed = doc.unit === 'mm' && doc.bleed > 0 && Boolean(options.includeBleed);
  const multi = indices.length > 1;
  const suffix = (i) => (multi ? `-${slug(doc.pages[i].name) || i + 1}` : '');

  if (format === 'svg') {
    for (const i of indices) {
      const svg = await pageSvgString(doc, i, { includeBleed, resolver });
      triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), `${title}${suffix(i)}.svg`);
    }
    return;
  }

  if (format === 'png' || format === 'png-hd' || format === 'jpg') {
    const isJpg = format === 'jpg';
    const scale = format === 'png-hd' ? 4 : 1;
    for (const i of indices) {
      const { canvas } = await renderPageCanvas(doc, i, {
        includeBleed, dpi: options.dpi || 300, scale, transparent: !isJpg && doc.transparent, resolver
      });
      const blob = await canvasBlob(canvas, isJpg ? 'image/jpeg' : 'image/png', 0.92);
      triggerDownload(blob, `${title}${suffix(i)}${format === 'png-hd' ? '-hd' : ''}.${isJpg ? 'jpg' : 'png'}`);
    }
    return;
  }

  if (format === 'pdf') {
    const isMm = doc.unit === 'mm';
    const toUnit = (v) => (isMm ? v : v * 0.75);
    const marks = isMm && options.cropMarks;
    const margin = marks ? 10 : 0;
    const b = includeBleed ? doc.bleed : 0;
    let pdf = null;
    const addPage = (w, h) => {
      const orientation = w > h ? 'landscape' : 'portrait';
      if (!pdf) pdf = new jsPDF({ unit: isMm ? 'mm' : 'pt', format: [w, h], orientation, compress: true });
      else pdf.addPage([w, h], orientation);
    };
    const imageType = doc.transparent ? 'PNG' : 'JPEG';
    const mime = doc.transparent ? 'image/png' : 'image/jpeg';

    const groups = options.spreads && isMm
      ? options.spreads.map((ids) => ids.map((id) => doc.pages.findIndex((p) => p.id === id)).filter((i) => i >= 0))
      : indices.map((i) => [i]);

    for (const group of groups) {
      const rendered = [];
      for (const i of group) {
        rendered.push(await renderPageCanvas(doc, i, { includeBleed, dpi: options.dpi || 300, transparent: doc.transparent, resolver }));
      }
      const pageW = toUnit(doc.width) * group.length + 2 * toUnit(b);
      const pageH = toUnit(doc.height) + 2 * toUnit(b);
      addPage(pageW + 2 * margin, pageH + 2 * margin);
      if (group.length === 1) {
        pdf.addImage(rendered[0].canvas.toDataURL(mime, 0.95), imageType, margin, margin, pageW, pageH, undefined, 'FAST');
      } else {
        // Flat spread: keep only the outer bleed of each panel, then a fold line.
        const ppm = rendered[0].width / (doc.width + 2 * b);
        const spread = document.createElement('canvas');
        spread.width = Math.round(ppm * pageW);
        spread.height = rendered[0].height;
        const ctx = spread.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, spread.width, spread.height);
        rendered.forEach((r, k) => {
          const first = k === 0;
          const last = k === rendered.length - 1;
          const sx = first ? 0 : b * ppm;
          const sw = (doc.width + (first ? b : 0) + (last ? b : 0)) * ppm;
          const dx = first ? 0 : (b + doc.width * k) * ppm;
          ctx.drawImage(r.canvas, sx, 0, sw, r.height, dx, 0, sw, r.height);
        });
        pdf.addImage(spread.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, pageW, pageH, undefined, 'FAST');
        if (options.cropMarks) {
          pdf.setLineDashPattern([2, 1.5], 0);
          pdf.setDrawColor(217, 70, 239);
          pdf.setLineWidth(0.2);
          for (let k = 1; k < group.length; k += 1) {
            const fx = margin + b + doc.width * k;
            pdf.line(fx, 0, fx, margin * 0.8);
            pdf.line(fx, margin + pageH + margin * 0.2, fx, pageH + 2 * margin);
          }
          pdf.setLineDashPattern([], 0);
        }
      }
      if (marks) cropMarks(pdf, margin + b, margin + b, pageW - 2 * b, pageH - 2 * b, 5, Math.max(2, b + 1));
    }
    pdf.setProperties({ title: options.title || 'Macarte', creator: 'Macarte' });
    triggerDownload(pdf.output('blob'), `${title}.pdf`);
    return;
  }

  if (format === 'webm') {
    await exportWebm(doc, { resolver, title, sceneDuration: doc.meta.sceneDuration || 3, onProgress: options.onProgress });
    return;
  }
  throw new Error(`Format non pris en charge : ${format}`);
}

/** Slideshow video (each page is a scene, cross-fade transitions). */
async function exportWebm(doc, { resolver, title, sceneDuration, onProgress }) {
  if (typeof MediaRecorder === 'undefined') throw new Error('L’export vidéo n’est pas pris en charge par ce navigateur.');
  const frames = [];
  for (let i = 0; i < doc.pages.length; i += 1) {
    frames.push((await renderPageCanvas(doc, i, { scale: 1, resolver })).canvas);
  }
  const canvas = document.createElement('canvas');
  canvas.width = frames[0].width;
  canvas.height = frames[0].height;
  const ctx = canvas.getContext('2d');
  const stream = canvas.captureStream(30);
  const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 6_000_000 } : undefined);
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise((resolve) => { recorder.onstop = resolve; });
  recorder.start(250);
  const fade = 0.6;
  const total = sceneDuration * frames.length;
  const start = performance.now();
  await new Promise((resolve) => {
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      if (t >= total) { resolve(); return; }
      const idx = Math.min(frames.length - 1, Math.floor(t / sceneDuration));
      const local = t - idx * sceneDuration;
      ctx.globalAlpha = 1;
      ctx.drawImage(frames[idx], 0, 0);
      if (idx < frames.length - 1 && local > sceneDuration - fade) {
        ctx.globalAlpha = (local - (sceneDuration - fade)) / fade;
        ctx.drawImage(frames[idx + 1], 0, 0);
      }
      if (onProgress) onProgress(t / total);
      requestAnimationFrame(tick);
    };
    tick();
  });
  recorder.stop();
  await done;
  triggerDownload(new Blob(chunks, { type: 'video/webm' }), `${title}.webm`);
}

/** Page preview as an SVG data URL (used by fold preview / template cards). */
export function pagePreviewUrl(doc, pageIndex) {
  const markup = renderToStaticMarkup(<DesignSvg doc={doc} pageIndex={pageIndex} mode="export" uid={`pv${pageIndex}`} />);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}
