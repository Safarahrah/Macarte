// src/design/engine/DesignCanvas.jsx
// Interactive editing surface: selection (click, shift-click, marquee),
// drag, resize (8 handles, rotation-aware), rotation, snapping to page guides.
import React, { useCallback, useRef, useState } from 'react';
import DesignSvg from './DesignSvg';
import { bounds, center, intersects, rotatePoint, unionBounds, round } from './geometry';
import { fitText } from './factory';

const HANDLES = [
  ['nw', -1, -1], ['n', 0, -1], ['ne', 1, -1], ['e', 1, 0],
  ['se', 1, 1], ['s', 0, 1], ['sw', -1, 1], ['w', -1, 0]
];
const CURSORS = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize' };

export default function DesignCanvas({
  doc, pageIndex, selectedIds, onSelect, onElementsChange, onCommit, scale, showGuides, onEditText
}) {
  const svgRef = useRef(null);
  const gesture = useRef(null);
  const [marquee, setMarquee] = useState(null);
  const [snapLines, setSnapLines] = useState([]);
  const page = doc.pages[pageIndex];
  const selected = page.elements.filter((el) => selectedIds.includes(el.id));
  const px = 1 / scale; // one screen pixel in document units

  const toDoc = useCallback((e) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  }, []);

  const updateElements = (map, transient = true) => {
    onElementsChange((els) => els.map((el) => (map[el.id] ? map[el.id] : el)), transient);
  };

  const snap = (box) => {
    const threshold = 6 * px;
    const targets = { x: [0, doc.width / 2, doc.width], y: [0, doc.height / 2, doc.height] };
    let dx = 0;
    let dy = 0;
    const lines = [];
    const xs = [box.x, box.x + box.w / 2, box.x + box.w];
    const ys = [box.y, box.y + box.h / 2, box.y + box.h];
    let best = threshold;
    targets.x.forEach((t) => xs.forEach((v) => { if (Math.abs(t - v) < best) { best = Math.abs(t - v); dx = t - v; lines[0] = { x: t }; } }));
    best = threshold;
    targets.y.forEach((t) => ys.forEach((v) => { if (Math.abs(t - v) < best) { best = Math.abs(t - v); dy = t - v; lines[1] = { y: t }; } }));
    return { dx, dy, lines: lines.filter(Boolean) };
  };

  const onPointerMove = (e) => {
    const g = gesture.current;
    if (!g) return;
    const p = toDoc(e);
    const dx = p.x - g.start.x;
    const dy = p.y - g.start.y;
    if (g.kind === 'marquee') {
      setMarquee({ x: Math.min(g.start.x, p.x), y: Math.min(g.start.y, p.y), w: Math.abs(dx), h: Math.abs(dy) });
      return;
    }
    if (!g.moved && Math.hypot(dx, dy) < 2 * px) return;
    g.moved = true;
    if (g.kind === 'move') {
      const box = unionBounds(g.origin);
      const s = e.altKey ? { dx: 0, dy: 0, lines: [] } : snap({ ...box, x: box.x + dx, y: box.y + dy });
      setSnapLines(s.lines);
      const map = {};
      g.origin.forEach((el) => { map[el.id] = { ...el, x: round(el.x + dx + s.dx, 3), y: round(el.y + dy + s.dy, 3) }; });
      updateElements(map);
    } else if (g.kind === 'resize') {
      const el = g.origin[0];
      const [, sx, sy] = g.handle;
      const local = rotatePoint(dx, dy, -el.rotation);
      let w = sx ? Math.max(px * 4, el.w + sx * local.x) : el.w;
      let h = sy ? Math.max(px * 4, el.h + sy * local.y) : el.h;
      const keepRatio = (sx && sy) && (e.shiftKey || el.type === 'text' || el.type === 'icon' || el.type === 'qr');
      if (keepRatio) {
        const ratio = Math.max(w / el.w, h / el.h);
        w = el.w * ratio;
        h = el.h * ratio;
      }
      const shift = { x: (sx * (w - el.w)) / 2, y: (sy * (h - el.h)) / 2 };
      const off = rotatePoint(shift.x, shift.y, el.rotation);
      const c = center(el);
      let next = { ...el, w, h, x: c.x + off.x - w / 2, y: c.y + off.y - h / 2 };
      if (el.type === 'text') {
        if (sx && sy) next.size = el.size * (w / el.w);
        next = fitText(next);
        if (sy && !sx) next = { ...next, y: el.y };
      }
      updateElements({ [el.id]: next });
    } else if (g.kind === 'rotate') {
      const el = g.origin[0];
      const c = center(el);
      let angle = (Math.atan2(p.y - c.y, p.x - c.x) * 180) / Math.PI + 90;
      const snapped = Math.round(angle / 15) * 15;
      if (e.shiftKey || Math.abs(snapped - angle) < 2) angle = snapped;
      if (angle > 180) angle -= 360;
      updateElements({ [el.id]: { ...el, rotation: round(angle, 1) } });
    }
  };

  const endGesture = () => {
    const g = gesture.current;
    gesture.current = null;
    setSnapLines([]);
    if (!g) return;
    if (g.kind === 'marquee') {
      const box = marquee;
      setMarquee(null);
      if (box && box.w > 0 && box.h > 0) {
        onSelect(page.elements.filter((el) => !el.locked && !el.hidden && intersects(bounds(el), box)).map((el) => el.id));
      }
      return;
    }
    if (g.moved) onCommit();
  };

  const startGesture = (e, kind, extra = {}) => {
    e.stopPropagation();
    e.preventDefault();
    svgRef.current.setPointerCapture(e.pointerId);
    gesture.current = { kind, start: toDoc(e), moved: false, ...extra };
  };

  const onElementDown = (e, el) => {
    if (e.button !== 0) return;
    let ids = selectedIds;
    if (e.shiftKey) {
      ids = selectedIds.includes(el.id) ? selectedIds.filter((id) => id !== el.id) : [...selectedIds, el.id];
      onSelect(ids);
      return;
    }
    if (!selectedIds.includes(el.id)) {
      ids = [el.id];
      onSelect(ids);
    }
    if (el.locked) return;
    const origin = page.elements.filter((x) => ids.includes(x.id) && !x.locked);
    startGesture(e, 'move', { origin });
  };

  const onBackgroundDown = (e) => {
    if (e.button !== 0) return;
    const target = e.target.closest('[data-el]');
    if (target) {
      const el = page.elements.find((x) => x.id === target.getAttribute('data-el'));
      if (el) { onElementDown(e, el); return; }
    }
    if (!e.shiftKey) onSelect([]);
    startGesture(e, 'marquee');
  };

  const onDoubleClick = (e) => {
    const target = e.target.closest('[data-el]');
    if (!target) return;
    const el = page.elements.find((x) => x.id === target.getAttribute('data-el'));
    if (el && el.type === 'text' && onEditText) onEditText(el.id);
  };

  const single = selected.length === 1 ? selected[0] : null;
  const hs = 9 * px;
  const stroke = 1.5 * px;
  const b = doc.bleed || 0;
  const vw = doc.width + 2 * b;
  const vh = doc.height + 2 * b;

  return (
    <DesignSvg
      svgRef={svgRef}
      doc={doc}
      pageIndex={pageIndex}
      mode="edit"
      showGuides={showGuides}
      uid={`edit${pageIndex}`}
      width={vw * scale}
      height={vh * scale}
      style={{ display: 'block', touchAction: 'none', userSelect: 'none', boxShadow: '0 10px 30px rgba(15,23,42,0.18)', background: '#fff' }}
      onPointerDown={onBackgroundDown}
    >
      <SelectionLayer
        selected={selected}
        single={single}
        hs={hs}
        stroke={stroke}
        px={px}
        onHandleDown={(e, handle) => startGesture(e, 'resize', { handle, origin: [single] })}
        onRotateDown={(e) => startGesture(e, 'rotate', { origin: [single] })}
      />
      {snapLines.map((l, i) => (l.x !== undefined
        ? <line key={i} x1={l.x} y1={-b} x2={l.x} y2={doc.height + b} stroke="#ec4899" strokeWidth={px} pointerEvents="none" />
        : <line key={i} x1={-b} y1={l.y} x2={doc.width + b} y2={l.y} stroke="#ec4899" strokeWidth={px} pointerEvents="none" />))}
      {marquee && <rect x={marquee.x} y={marquee.y} width={marquee.w} height={marquee.h} fill="rgba(79,70,229,0.08)" stroke="#4f46e5" strokeWidth={px} pointerEvents="none" />}
      <PointerCatcher svgRef={svgRef} onMove={onPointerMove} onUp={endGesture} onDoubleClick={onDoubleClick} />
    </DesignSvg>
  );
}

/** Attaches move/up/dblclick listeners on the <svg> root (pointer capture target). */
function PointerCatcher({ svgRef, onMove, onUp, onDoubleClick }) {
  const handlers = useRef({});
  handlers.current = { onMove, onUp, onDoubleClick };
  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const move = (e) => handlers.current.onMove(e);
    const up = (e) => handlers.current.onUp(e);
    const dbl = (e) => handlers.current.onDoubleClick(e);
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    svg.addEventListener('dblclick', dbl);
    return () => {
      svg.removeEventListener('pointermove', move);
      svg.removeEventListener('pointerup', up);
      svg.removeEventListener('pointercancel', up);
      svg.removeEventListener('dblclick', dbl);
    };
  }, [svgRef]);
  return null;
}

function SelectionLayer({ selected, single, hs, stroke, px, onHandleDown, onRotateDown }) {
  if (!selected.length) return null;
  if (!single) {
    const box = unionBounds(selected);
    return (
      <g pointerEvents="none">
        {selected.map((el) => {
          const bb = bounds(el);
          return <rect key={el.id} x={bb.x} y={bb.y} width={bb.w} height={bb.h} fill="none" stroke="#818cf8" strokeWidth={stroke} />;
        })}
        <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="none" stroke="#4f46e5" strokeWidth={stroke} strokeDasharray={`${4 * px} ${3 * px}`} />
      </g>
    );
  }
  const el = single;
  const transform = `translate(${el.x} ${el.y}) rotate(${el.rotation} ${el.w / 2} ${el.h / 2})`;
  return (
    <g transform={transform}>
      <rect width={el.w} height={el.h} fill="none" stroke={el.locked ? '#f59e0b' : '#4f46e5'} strokeWidth={stroke} pointerEvents="none" />
      {!el.locked && (
        <>
          <line x1={el.w / 2} y1={0} x2={el.w / 2} y2={-24 * px} stroke="#4f46e5" strokeWidth={stroke} pointerEvents="none" />
          <circle
            cx={el.w / 2} cy={-24 * px} r={hs * 0.6} fill="#ffffff" stroke="#4f46e5" strokeWidth={stroke}
            style={{ cursor: 'grab' }} onPointerDown={onRotateDown} data-handle="rotate"
          />
          {HANDLES.map((h) => {
            const [id, sx, sy] = h;
            const x = ((sx + 1) / 2) * el.w;
            const y = ((sy + 1) / 2) * el.h;
            return (
              <rect
                key={id} x={x - hs / 2} y={y - hs / 2} width={hs} height={hs} rx={hs / 4}
                fill="#ffffff" stroke="#4f46e5" strokeWidth={stroke}
                style={{ cursor: CURSORS[id] }} onPointerDown={(e) => onHandleDown(e, h)} data-handle={id}
              />
            );
          })}
        </>
      )}
    </g>
  );
}
