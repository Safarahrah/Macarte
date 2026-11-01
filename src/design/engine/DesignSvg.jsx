// src/design/engine/DesignSvg.jsx
// Pure SVG rendering of one page. Used by the editor canvas, thumbnails,
// template previews and every export (via renderToStaticMarkup).
import React from 'react';
import * as Icons from 'lucide-react';
import { fontCss } from '../shared/fonts.js';
import { getQrMatrix } from '../../printable/QrMark';
import { starPoints, gradientVector } from './geometry';
import { wrapLines } from './text';

function qrPath(value) {
  const matrix = getQrMatrix(value || ' ', 'M');
  if (!matrix) return null;
  const parts = [];
  matrix.cells.forEach((row, y) => row.forEach((on, x) => { if (on) parts.push(`M${x} ${y}h1v1h-1z`); }));
  return { d: parts.join(''), size: matrix.size, quiet: matrix.quietZone };
}

function shade(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return '#000000';
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.round(v * 0.55).toString(16).padStart(2, '0');
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

export function ElementShape({ el, uid, resolveSrc }) {
  const common = { opacity: el.opacity };
  const stroke = el.stroke && el.stroke !== 'transparent' && el.strokeWidth > 0
    ? { stroke: el.stroke, strokeWidth: el.strokeWidth }
    : {};
  const gid = `gr-${uid}-${el.id}`;
  const gradDef = el.gradient ? (
    <defs>
      <linearGradient id={gid} {...gradientVector(el.gradient.angle)}>
        <stop offset="0" stopColor={el.gradient.from} />
        <stop offset="1" stopColor={el.gradient.to} />
      </linearGradient>
    </defs>
  ) : null;
  const fill = (c) => (el.gradient ? `url(#${gid})` : (c === 'transparent' ? 'none' : c));
  const withGrad = (node) => (gradDef ? <g>{gradDef}{node}</g> : node);
  switch (el.type) {
    case 'path': {
      const k = Math.max(el.w, el.h) ? 1 : 1;
      return withGrad(
        <g transform={`scale(${el.w / el.vb} ${el.h / el.vb})`}>
          <path d={el.d} fill={fill(el.fill)} stroke={el.stroke !== 'transparent' && el.strokeWidth > 0 ? el.stroke : 'none'}
            strokeWidth={el.strokeWidth * k} strokeLinecap="round" strokeLinejoin="round" opacity={el.opacity} vectorEffect={undefined} />
        </g>
      );
    }
    case 'rect':
      return withGrad(<rect width={el.w} height={el.h} rx={Math.min(el.radius, el.w / 2, el.h / 2)} fill={fill(el.fill)} {...stroke} {...common} />);
    case 'ellipse':
      return withGrad(<ellipse cx={el.w / 2} cy={el.h / 2} rx={el.w / 2} ry={el.h / 2} fill={fill(el.fill)} {...stroke} {...common} />);
    case 'triangle':
      return withGrad(<polygon points={`${el.w / 2},0 ${el.w},${el.h} 0,${el.h}`} fill={fill(el.fill)} strokeLinejoin="round" {...stroke} {...common} />);
    case 'star':
      return withGrad(<polygon points={starPoints(el.w, el.h, el.points, el.innerRatio)} fill={fill(el.fill)} strokeLinejoin="round" {...stroke} {...common} />);
    case 'line':
      return (
        <line
          x1={0} y1={el.h / 2} x2={el.w} y2={el.h / 2}
          stroke={el.stroke} strokeWidth={el.strokeWidth} strokeLinecap="round"
          strokeDasharray={el.dash ? `${el.strokeWidth * 3} ${el.strokeWidth * 2}` : undefined}
          {...common}
        />
      );
    case 'icon': {
      const Icon = Icons[el.icon] || Icons.Star;
      return (
        <g opacity={el.opacity}>
          <Icon x={0} y={0} width={el.w} height={el.h} color={el.color} strokeWidth={el.strokeWidth} fill={fill(el.fill)} className={undefined} />
        </g>
      );
    }
    case 'image': {
      const href = resolveSrc ? resolveSrc(el.src) : el.src;
      if (!href) {
        return (
          <g opacity={el.opacity}>
            <rect width={el.w} height={el.h} fill="#e5e7eb" stroke="#9ca3af" strokeDasharray="4 3" strokeWidth={Math.max(el.w, el.h) / 200} />
            <text x={el.w / 2} y={el.h / 2} fontSize={Math.min(el.w, el.h) / 7} textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontFamily="Helvetica, Arial, sans-serif">Image</text>
          </g>
        );
      }
      const clipId = `clip-${uid}-${el.id}`;
      return (
        <g opacity={el.opacity}>
          {el.radius > 0 && (
            <defs><clipPath id={clipId}><rect width={el.w} height={el.h} rx={Math.min(el.radius, el.w / 2, el.h / 2)} /></clipPath></defs>
          )}
          <image
            href={href}
            width={el.w}
            height={el.h}
            preserveAspectRatio={el.fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}
            clipPath={el.radius > 0 ? `url(#${clipId})` : undefined}
          />
        </g>
      );
    }
    case 'qr': {
      const qr = qrPath(el.value);
      if (!qr) return <rect width={el.w} height={el.h} fill="#fee2e2" />;
      const total = qr.size + qr.quiet * 2;
      return (
        <g opacity={el.opacity}>
          <rect width={el.w} height={el.h} fill={fill(el.background)} />
          <g transform={`scale(${el.w / total} ${el.h / total}) translate(${qr.quiet} ${qr.quiet})`}>
            <path d={qr.d} fill={el.color} shapeRendering="crispEdges" />
          </g>
        </g>
      );
    }
    case 'text': {
      const lines = wrapLines(el);
      const anchor = el.align === 'center' ? 'middle' : el.align === 'right' ? 'end' : 'start';
      const tx = el.align === 'center' ? el.w / 2 : el.align === 'right' ? el.w : 0;
      const lh = el.size * el.lineHeight;
      const textProps = {
        fontFamily: fontCss(el.font), fontSize: el.size, fontWeight: el.weight,
        fontStyle: el.italic ? 'italic' : 'normal',
        letterSpacing: el.letterSpacing ? el.letterSpacing * el.size : undefined
      };
      if (el.arc && Math.abs(el.arc) >= 5) {
        // Curved text on a circular arc whose chord is the element width.
        const sweep = (Math.abs(el.arc) * Math.PI) / 180;
        const r = el.w / 2 / Math.sin(Math.min(sweep, Math.PI * 1.98) / 2) || el.w;
        const up = el.arc > 0;
        const cy = up ? r + el.size : el.h - r - el.size * 0.2;
        const a0 = -Math.PI / 2 - sweep / 2;
        const a1 = -Math.PI / 2 + sweep / 2;
        const pid = `arc-${uid}-${el.id}`;
        const pt = (a) => [el.w / 2 + r * Math.cos(a), up ? cy + r * Math.sin(a) : cy - r * Math.sin(a)];
        const [x0, y0] = pt(up ? a0 : a0);
        const [x1, y1] = pt(up ? a1 : a1);
        const large = sweep > Math.PI ? 1 : 0;
        const d = up ? `M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}` : `M${x0} ${y0} A${r} ${r} 0 ${large} 0 ${x1} ${y1}`;
        return withGrad(
          <g opacity={el.opacity}>
            <defs><path id={pid} d={d} /></defs>
            <text {...textProps} fill={fill(el.color)} textAnchor="middle">
              <textPath href={`#${pid}`} startOffset="50%">{el.uppercase ? el.text.toUpperCase() : el.text}</textPath>
            </text>
          </g>
        );
      }
      const body = (color, dx = 0, dy = 0, key) => (
        <text key={key} {...textProps} transform={dx || dy ? `translate(${dx} ${dy})` : undefined}
          textDecoration={el.underline ? 'underline' : undefined} fill={color} textAnchor={anchor} style={{ whiteSpace: 'pre' }}>
          {lines.map((line, i) => (
            <tspan key={i} x={tx} y={lh * i + (lh - el.size) / 2 + el.size * 0.8}>{line || ' '}</tspan>
          ))}
        </text>
      );
      if (el.depth > 0) {
        const steps = Math.min(12, Math.ceil(el.depth));
        const unit = (el.size * el.depth) / 100 / steps;
        return withGrad(
          <g opacity={el.opacity}>
            {Array.from({ length: steps }, (_, i) => body(shade(el.gradient ? el.gradient.to : el.color), (steps - i) * unit, (steps - i) * unit, `d${i}`))}
            {body(fill(el.color), 0, 0, 'top')}
          </g>
        );
      }
      return withGrad(
        <text
          fontFamily={fontCss(el.font)}
          fontSize={el.size}
          fontWeight={el.weight}
          fontStyle={el.italic ? 'italic' : 'normal'}
          textDecoration={el.underline ? 'underline' : undefined}
          letterSpacing={el.letterSpacing ? el.letterSpacing * el.size : undefined}
          fill={fill(el.color)}
          textAnchor={anchor}
          opacity={el.opacity}
          style={{ whiteSpace: 'pre' }}
        >
          {lines.map((line, i) => (
            <tspan key={i} x={tx} y={lh * i + (lh - el.size) / 2 + el.size * 0.8}>{line || ' '}</tspan>
          ))}
        </text>
      );
    }
    default:
      return null;
  }
}

export function ElementView({ el, uid, resolveSrc, hit }) {
  if (el.hidden) return null;
  const transform = `translate(${el.x} ${el.y})${el.rotation ? ` rotate(${el.rotation} ${el.w / 2} ${el.h / 2})` : ''}`;
  return (
    <g transform={transform} data-el={el.id} style={hit ? { cursor: el.locked ? 'default' : 'move' } : undefined}>
      {hit && <rect width={el.w} height={el.h} fill="transparent" />}
      <ElementShape el={el} uid={uid} resolveSrc={resolveSrc} />
    </g>
  );
}

function Background({ page, doc, uid, x, y, w, h, checker, resolveSrc }) {
  const bg = page.background || {};
  const gid = `bg-${uid}`;
  const transparent = bg.color === 'transparent' && !bg.gradient;
  return (
    <>
      {bg.gradient && (
        <defs>
          <linearGradient id={gid} {...gradientVector(bg.gradient.angle)}>
            <stop offset="0" stopColor={bg.gradient.from} />
            <stop offset="1" stopColor={bg.gradient.to} />
          </linearGradient>
        </defs>
      )}
      {transparent && checker && (
        <>
          <defs>
            <pattern id={`chk-${uid}`} width={Math.max(doc.width, doc.height) / 20} height={Math.max(doc.width, doc.height) / 20} patternUnits="userSpaceOnUse">
              <rect width={Math.max(doc.width, doc.height) / 20} height={Math.max(doc.width, doc.height) / 20} fill="#ffffff" />
              <rect width={Math.max(doc.width, doc.height) / 40} height={Math.max(doc.width, doc.height) / 40} fill="#eef0f3" />
              <rect x={Math.max(doc.width, doc.height) / 40} y={Math.max(doc.width, doc.height) / 40} width={Math.max(doc.width, doc.height) / 40} height={Math.max(doc.width, doc.height) / 40} fill="#eef0f3" />
            </pattern>
          </defs>
          <rect x={x} y={y} width={w} height={h} fill={`url(#chk-${uid})`} />
        </>
      )}
      {!transparent && <rect x={x} y={y} width={w} height={h} fill={bg.gradient ? `url(#${gid})` : bg.color} />}
      {bg.image && (
        <image href={resolveSrc ? resolveSrc(bg.image) : bg.image} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
      )}
    </>
  );
}

/** Print guides: bleed zone, trim (cut) line, safety margin, folds / flap. */
export function Guides({ doc, page, pageIndex, scale = 1 }) {
  const b = doc.bleed || 0;
  const sw = Math.max(doc.width, doc.height) / 900 / scale;
  const items = [];
  if (b > 0) {
    items.push(
      <path
        key="bleed"
        d={`M${-b} ${-b}h${doc.width + 2 * b}v${doc.height + 2 * b}h${-(doc.width + 2 * b)}z M0 0v${doc.height}h${doc.width}v${-doc.height}z`}
        fill="rgba(239,68,68,0.12)" fillRule="evenodd"
      />,
      <rect key="trim" x={0} y={0} width={doc.width} height={doc.height} fill="none" stroke="#ef4444" strokeWidth={sw} />
    );
  }
  if (doc.safe > 0) {
    items.push(
      <rect key="safe" x={doc.safe} y={doc.safe} width={doc.width - 2 * doc.safe} height={doc.height - 2 * doc.safe}
        fill="none" stroke="#3b82f6" strokeWidth={sw} strokeDasharray={`${sw * 6} ${sw * 4}`} />
    );
  }
  if (doc.flap && page && /rabat|inside-right|intérieur droit/i.test(`${page.id} ${page.name}`)) {
    const y = doc.height - doc.flap;
    items.push(
      <g key="flap">
        <rect x={0} y={y} width={doc.width} height={doc.flap} fill="rgba(217,70,239,0.08)" />
        <line x1={-b} y1={y} x2={doc.width + b} y2={y} stroke="#d946ef" strokeWidth={sw * 1.5} strokeDasharray={`${sw * 8} ${sw * 4}`} />
        <text x={doc.width / 2} y={y + doc.flap / 2} fontSize={doc.width / 22} textAnchor="middle" fill="#a21caf" fontFamily="Helvetica, Arial, sans-serif" opacity="0.7">Rabat / poche (pliage)</text>
      </g>
    );
  }
  return <g pointerEvents="none" data-guides="1">{items}</g>;
}

/**
 * Render a page.
 * mode: 'edit' (bleed visible, checkerboard), 'export' (optionally bleed), 'thumb'.
 */
export default function DesignSvg({
  doc, pageIndex = 0, mode = 'thumb', includeBleed, showGuides = false, uid = 'p', resolveSrc,
  className, style, width, height, children, svgRef, onPointerDown
}) {
  const page = doc.pages[pageIndex] || doc.pages[0];
  const b = doc.bleed || 0;
  const withBleed = includeBleed !== undefined ? includeBleed : mode === 'edit';
  const vx = withBleed ? -b : 0;
  const vw = withBleed ? doc.width + 2 * b : doc.width;
  const vh = withBleed ? doc.height + 2 * b : doc.height;
  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={`${vx} ${vx} ${vw} ${vh}`}
      width={width}
      height={height}
      className={className}
      style={style}
      onPointerDown={onPointerDown}
    >
      <Background page={page} doc={doc} uid={uid} x={-b} y={-b} w={doc.width + 2 * b} h={doc.height + 2 * b} checker={mode !== 'export'} resolveSrc={resolveSrc} />
      {page.elements.map((el) => <ElementView key={el.id} el={el} uid={uid} resolveSrc={resolveSrc} hit={mode === 'edit'} />)}
      {showGuides && <Guides doc={doc} page={page} pageIndex={pageIndex} />}
      {children}
    </svg>
  );
}
