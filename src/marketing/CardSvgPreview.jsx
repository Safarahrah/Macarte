// src/marketing/CardSvgPreview.jsx
// Lightweight, read-only SVG preview of a printable card.
// Uses the same layout engine and the same node renderer as the editor,
// but draws the QR code as a cheap placeholder (no module matrix).
import React, { useId, useMemo } from 'react';
import { buildLayout } from '../printable/shared/layout';
import { defaultConfig } from '../printable/shared/sanitize';
import { getTemplate } from '../printable/shared/templates';
import { collectGradients, GradientDefs, renderNode } from '../printable/shared/renderSvg';

const DEMO = {
  firstName: 'Alex',
  lastName: 'Rivera',
  title: 'Product Designer',
  company: 'Northwind Studio',
  phone: '+1 (514) 555-0142',
  email: 'alex@northwind.co',
  website: 'northwind.co',
  address: 'Montréal, QC'
};

/** Build a realistic demo configuration for a given template. */
export function sampleConfig(templateId, overrides = {}) {
  const base = defaultConfig();
  const t = getTemplate(templateId);
  return {
    ...base,
    ...overrides,
    templateId: t.id,
    colors: { ...t.colors, ...(overrides.colors || {}) },
    fonts: { ...t.fonts, ...(overrides.fonts || {}) },
    typeScale: { ...t.typeScale },
    alignment: t.alignment,
    fields: { ...base.fields, ...DEMO, ...(overrides.fields || {}) },
    visibility: { ...base.visibility, ...(overrides.visibility || {}) },
    logo: { ...base.logo, ...(overrides.logo || {}) }
  };
}

function qrPlaceholder(node) {
  const s = node.w;
  const m = s / 7;
  const cells = [[0, 0], [4, 0], [0, 4]];
  return (
    <g key={node.id}>
      <rect x={node.x} y={node.y} width={node.w} height={node.h} fill="#ffffff" />
      {cells.map(([cx, cy], i) => (
        <g key={i}>
          <rect x={node.x + cx * m} y={node.y + cy * m} width={m * 3} height={m * 3} fill="#111111" />
          <rect x={node.x + cx * m + m * 0.7} y={node.y + cy * m + m * 0.7} width={m * 1.6} height={m * 1.6} fill="#ffffff" />
          <rect x={node.x + cx * m + m * 1.1} y={node.y + cy * m + m * 1.1} width={m * 0.8} height={m * 0.8} fill="#111111" />
        </g>
      ))}
      {Array.from({ length: 12 }).map((_, i) => {
        const col = (i * 5) % 7;
        const row = 4 + ((i * 3) % 3);
        return <rect key={`d${i}`} x={node.x + col * m} y={node.y + row * m} width={m} height={m} fill="#111111" />;
      })}
    </g>
  );
}

export default function CardSvgPreview({ config, publicUrl = '', side = 'front', className = '' }) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const layout = useMemo(() => {
    try {
      return buildLayout(config, publicUrl);
    } catch (e) {
      return null;
    }
  }, [config, publicUrl]);

  if (!layout) {
    return <div className={`bg-surface dark:bg-surface-dark ${className}`} />;
  }

  const geo = layout.geometry;
  const nodes = layout.sides[side] || [];
  const { defs, map } = collectGradients(nodes, uid);

  return (
    <svg
      viewBox={`0 0 ${geo.document.widthMm} ${geo.document.heightMm}`}
      className={`block w-full h-auto ${className}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Business card preview"
    >
      <defs>
        <clipPath id={`${uid}-clip`}>
          <rect x="0" y="0" width={geo.document.widthMm} height={geo.document.heightMm} />
        </clipPath>
        <GradientDefs defs={defs} />
      </defs>
      <g clipPath={`url(#${uid}-clip)`}>
        <rect x="0" y="0" width={geo.document.widthMm} height={geo.document.heightMm} fill="#ffffff" />
        {nodes.map((node, i) => renderNode(node, i, map, qrPlaceholder))}
      </g>
    </svg>
  );
}
