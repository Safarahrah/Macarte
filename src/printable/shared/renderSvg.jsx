// src/printable/shared/renderSvg.jsx
// Single source of truth for turning layout nodes into SVG primitives.
// Used by the print editor preview (PrintableCardCanvas) and by the
// read-only marketing previews (CardSvgPreview) so both stay identical.
import React from 'react';

export function isGradient(fill) {
  return fill && typeof fill === 'object' && Array.isArray(fill.stops);
}

export function gradientCoords(angle = 0) {
  const a = (angle * Math.PI) / 180;
  const ax = Math.cos(a) / 2;
  const ay = Math.sin(a) / 2;
  return { x1: 0.5 - ax, y1: 0.5 - ay, x2: 0.5 + ax, y2: 0.5 + ay };
}

/** Collect linear gradients used by the given nodes and assign them stable ids. */
export function collectGradients(nodes, uid) {
  const defs = [];
  const map = new Map();
  nodes.forEach((node, index) => {
    if (node && isGradient(node.fill)) {
      const id = `${uid}-grad-${index}`;
      map.set(index, id);
      defs.push({ id, fill: node.fill });
    }
  });
  return { defs, map };
}

export function GradientDefs({ defs = [] }) {
  return defs.map(({ id, fill }) => {
    const c = gradientCoords(fill.angle);
    return (
      <linearGradient key={id} id={id} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}>
        {(fill.stops || []).map(([offset, color], i) => (
          <stop key={i} offset={`${offset * 100}%`} stopColor={color} />
        ))}
      </linearGradient>
    );
  });
}

const PT_TO_MM = 0.352777;

function fillOf(node, index, map) {
  if (isGradient(node.fill)) return `url(#${map.get(index)})`;
  if (!node.fill || node.fill === 'none') return 'none';
  return node.fill;
}

/**
 * Render a single layout node to an SVG element.
 * `renderQr(node)` lets the caller decide how to draw QR codes
 * (real matrix in the editor, lightweight placeholder in marketing pages).
 */
export function renderNode(node, index, map, renderQr) {
  if (!node) return null;

  switch (node.type) {
    case 'rect':
      return (
        <rect
          key={node.id}
          x={node.x}
          y={node.y}
          width={node.w}
          height={node.h}
          fill={fillOf(node, index, map)}
          stroke={node.stroke || 'none'}
          strokeWidth={node.width || 0}
          opacity={node.opacity}
        />
      );
    case 'line':
      return (
        <line
          key={node.id}
          x1={node.x1}
          y1={node.y1}
          x2={node.x2}
          y2={node.y2}
          stroke={node.stroke}
          strokeWidth={node.width || 0.35}
          opacity={node.opacity}
        />
      );
    case 'polygon':
      return (
        <polygon
          key={node.id}
          points={(node.points || []).map((p) => p.join(',')).join(' ')}
          fill={fillOf(node, index, map)}
          stroke={node.stroke || 'none'}
          strokeWidth={node.width || 0}
          opacity={node.opacity}
        />
      );
    case 'circle':
      return (
        <circle
          key={node.id}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          fill={fillOf(node, index, map)}
          stroke={node.stroke || 'none'}
          strokeWidth={node.width || 0}
          opacity={node.opacity}
        />
      );
    case 'path':
      return (
        <path
          key={node.id}
          d={node.d}
          fill={fillOf(node, index, map)}
          stroke={node.stroke || 'none'}
          strokeWidth={node.width || 0}
          opacity={node.opacity}
        />
      );
    case 'image':
      return (
        <image
          key={node.id}
          href={node.src}
          x={node.x}
          y={node.y}
          width={node.w}
          height={node.h}
          preserveAspectRatio={node.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
        />
      );
    case 'qr':
      if (renderQr) return <React.Fragment key={node.id}>{renderQr(node)}</React.Fragment>;
      return null;
    case 'text': {
      const anchor = node.align === 'center' ? 'middle' : node.align === 'right' ? 'end' : 'start';
      const x = node.align === 'center' ? node.x + node.w / 2 : node.align === 'right' ? node.x + node.w : node.x;
      const fontSize = (node.size || 8) * PT_TO_MM;
      const lines = String(node.text || '').split('\n');
      return (
        <text
          key={node.id}
          x={x}
          y={node.y + fontSize}
          fontFamily={node.cssFont}
          fontSize={fontSize}
          fontWeight={node.bold ? 700 : 400}
          fontStyle={node.italic ? 'italic' : 'normal'}
          letterSpacing={node.spacing ? node.spacing * PT_TO_MM : undefined}
          fill={node.color}
          textAnchor={anchor}
        >
          {lines.map((line, i) => (
            <tspan key={i} x={x} dy={i === 0 ? 0 : fontSize * 1.25}>{line}</tspan>
          ))}
        </text>
      );
    }
    default:
      return null;
  }
}
