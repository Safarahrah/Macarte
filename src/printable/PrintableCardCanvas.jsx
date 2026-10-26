import React, { useId, useMemo, useRef, useState } from 'react';
import { buildLayout } from './shared/layout';
import { collectGradients, GradientDefs, renderNode } from './shared/renderSvg';
import QrMark from './QrMark';

function mm(value) {
  return Number(value) || 0;
}

export default function PrintableCardCanvas({
  config,
  publicUrl,
  qrValue,
  side = 'front',
  showGuides = true,
  selectedId,
  onSelect,
  onMove,
  zoom = 1,
  isPaid = true
}) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const layout = useMemo(() => buildLayout(config, publicUrl), [config, publicUrl]);
  const geo = layout.geometry;
  const nodes = layout.sides[side] || [];
  const { defs, map } = collectGradients(nodes, uid);
  const wrapRef = useRef(null);
  const [drag, setDrag] = useState(null);

  const baseWidth = 420 * zoom;
  const scale = baseWidth / geo.document.widthMm;
  const height = geo.document.heightMm * scale;

  const toMm = (clientX, clientY) => {
    const svg = wrapRef.current;
    if (!svg) return { x: 0, y: 0 };
    const box = svg.getBoundingClientRect();
    // Use the rendered width so dragging stays accurate when the SVG is
    // scaled down (e.g. `max-w-full` on mobile) instead of the base width.
    const mmPerPx = box.width > 0 ? geo.document.widthMm / box.width : 1 / scale;
    return {
      x: (clientX - box.left) * mmPerPx,
      y: (clientY - box.top) * mmPerPx
    };
  };

  const handlePointerDown = (event, node) => {
    if (!node.selectable || !onMove) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect?.(node.id);
    const point = toMm(event.clientX, event.clientY);
    setDrag({
      id: node.id,
      dx: point.x - mm(node.x),
      dy: point.y - mm(node.y)
    });
  };

  const handlePointerMove = (event) => {
    if (!drag) return;
    const point = toMm(event.clientX, event.clientY);
    onMove(drag.id, {
      x: point.x - drag.dx,
      y: point.y - drag.dy
    });
  };

  const endDrag = () => setDrag(null);

  const qrUrl = qrValue || publicUrl;
  const renderQr = (node) => <QrMark url={qrUrl} x={node.x} y={node.y} size={node.w} isPaid={isPaid} />;

  return (
    <svg
      ref={wrapRef}
      viewBox={`0 0 ${geo.document.widthMm} ${geo.document.heightMm}`}
      width={baseWidth}
      height={height}
      className="touch-none rounded-md shadow-lg bg-white max-w-full h-auto select-none"
      role="img"
      aria-label={`${side === 'back' ? 'Back' : 'Front'} printable card preview`}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClick={() => onSelect?.(null)}
    >
      <defs>
        <GradientDefs defs={defs} />
      </defs>
      {nodes.map((node, index) => {
        const content = renderNode(node, index, map, renderQr);
        if (!content) return null;
        if (!node.selectable || !onMove) return content;
        return (
          <g key={node.id} onPointerDown={(event) => handlePointerDown(event, node)} className="cursor-move">
            {content}
            {selectedId === node.id && (
              <rect
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                fill="none"
                stroke="#2563eb"
                strokeDasharray="1 1"
                strokeWidth="0.25"
              />
            )}
          </g>
        );
      })}
      {showGuides && (
        <g pointerEvents="none">
          <rect x="0" y="0" width={geo.document.widthMm} height={geo.document.heightMm} fill="none" stroke="#f9a8d4" strokeWidth="0.2" />
          <rect x={geo.trim.x} y={geo.trim.y} width={geo.trim.widthMm} height={geo.trim.heightMm} fill="none" stroke="#ef4444" strokeDasharray="1.2 0.8" strokeWidth="0.25" />
          <rect x={geo.safety.x} y={geo.safety.y} width={geo.safety.widthMm} height={geo.safety.heightMm} fill="none" stroke="#3b82f6" strokeDasharray="0.8 0.8" strokeWidth="0.2" />
        </g>
      )}
      {!isPaid && (
        <g pointerEvents="none">
          <text
            x={geo.document.widthMm / 2}
            y={geo.document.heightMm / 2}
            fill="rgba(0,0,0,0.1)"
            fontSize="10"
            fontFamily="sans-serif"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(-45, ${geo.document.widthMm / 2}, ${geo.document.heightMm / 2})`}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            MACARTE.COM PREVIEW
          </text>
        </g>
      )}
    </svg>
  );
}
