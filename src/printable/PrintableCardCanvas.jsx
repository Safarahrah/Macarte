import React, { useMemo, useRef, useState } from 'react';
import { buildLayout } from './shared/layout';
import QrMark from './QrMark';

function mm(value) {
  return Number(value) || 0;
}

export default function PrintableCardCanvas({
  config,
  publicUrl,
  side = 'front',
  showGuides = true,
  selectedId,
  onSelect,
  onMove,
  zoom = 1
}) {
  const layout = useMemo(() => buildLayout(config, publicUrl), [config, publicUrl]);
  const geo = layout.geometry;
  const nodes = layout.sides[side] || [];
  const wrapRef = useRef(null);
  const [drag, setDrag] = useState(null);

  const baseWidth = 420 * zoom;
  const scale = baseWidth / geo.document.widthMm;
  const height = geo.document.heightMm * scale;

  const toMm = (clientX, clientY) => {
    const svg = wrapRef.current;
    if (!svg) return { x: 0, y: 0 };
    const box = svg.getBoundingClientRect();
    return {
      x: (clientX - box.left) / scale,
      y: (clientY - box.top) / scale
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

  return (
    <svg
      ref={wrapRef}
      viewBox={`0 0 ${geo.document.widthMm} ${geo.document.heightMm}`}
      width={baseWidth}
      height={height}
      className="touch-none rounded-md shadow-lg bg-white max-w-full h-auto"
      role="img"
      aria-label={`${side === 'back' ? 'Back' : 'Front'} printable card preview`}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClick={() => onSelect?.(null)}
    >
      {nodes.map((node) => {
        if (node.type === 'rect') {
          return (
            <rect
              key={node.id}
              x={node.x}
              y={node.y}
              width={node.w}
              height={node.h}
              fill={node.fill && node.fill !== 'none' ? node.fill : 'transparent'}
              stroke={node.stroke || 'none'}
              strokeWidth={node.width || 0}
            />
          );
        }
        if (node.type === 'line') {
          return (
            <line
              key={node.id}
              x1={node.x1}
              y1={node.y1}
              x2={node.x2}
              y2={node.y2}
              stroke={node.stroke}
              strokeWidth={node.width || 0.35}
            />
          );
        }
        if (node.type === 'text') {
          const anchor = node.align === 'center' ? 'middle' : node.align === 'right' ? 'end' : 'start';
          const x = node.align === 'center' ? node.x + node.w / 2 : node.align === 'right' ? node.x + node.w : node.x;
          const fontSize = (node.size || 8) * 0.352777;
          const lines = String(node.text || '').split('\n');
          return (
            <g
              key={node.id}
              onPointerDown={(event) => handlePointerDown(event, node)}
              className={node.selectable ? 'cursor-move' : undefined}
            >
              {selectedId === node.id && (
                <rect x={node.x} y={node.y} width={node.w} height={node.h} fill="none" stroke="#2563eb" strokeDasharray="1 1" strokeWidth="0.25" />
              )}
              <text
                x={x}
                y={node.y + fontSize}
                fontFamily={node.cssFont}
                fontSize={fontSize}
                fontWeight={node.bold ? 700 : 400}
                fill={node.color}
                textAnchor={anchor}
              >
                {lines.map((line, index) => (
                  <tspan key={index} x={x} dy={index === 0 ? 0 : fontSize * 1.25}>{line}</tspan>
                ))}
              </text>
            </g>
          );
        }
        if (node.type === 'qr') {
          return (
            <g key={node.id} onPointerDown={(event) => handlePointerDown(event, node)} className="cursor-move">
              <QrMark url={publicUrl} x={node.x} y={node.y} size={node.w} />
              {selectedId === node.id && (
                <rect x={node.x} y={node.y} width={node.w} height={node.h} fill="none" stroke="#2563eb" strokeDasharray="1 1" strokeWidth="0.25" />
              )}
            </g>
          );
        }
        if (node.type === 'image') {
          return (
            <g key={node.id} onPointerDown={(event) => handlePointerDown(event, node)} className="cursor-move">
              <image href={node.src} x={node.x} y={node.y} width={node.w} height={node.h} preserveAspectRatio="xMidYMid meet" />
              {selectedId === node.id && (
                <rect x={node.x} y={node.y} width={node.w} height={node.h} fill="none" stroke="#2563eb" strokeDasharray="1 1" strokeWidth="0.25" />
              )}
            </g>
          );
        }
        return null;
      })}
      {showGuides && (
        <g pointerEvents="none">
          <rect x="0" y="0" width={geo.document.widthMm} height={geo.document.heightMm} fill="none" stroke="#f9a8d4" strokeWidth="0.2" />
          <rect x={geo.trim.x} y={geo.trim.y} width={geo.trim.widthMm} height={geo.trim.heightMm} fill="none" stroke="#ef4444" strokeDasharray="1.2 0.8" strokeWidth="0.25" />
          <rect x={geo.safety.x} y={geo.safety.y} width={geo.safety.widthMm} height={geo.safety.heightMm} fill="none" stroke="#3b82f6" strokeDasharray="0.8 0.8" strokeWidth="0.2" />
        </g>
      )}
    </svg>
  );
}
