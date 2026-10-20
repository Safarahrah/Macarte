import React, { useMemo } from 'react';
import QRCode from 'qrcode';

const QUIET_ZONE = 4;

export function getQrMatrix(url) {
  if (!url) return null;
  try {
    const model = QRCode.create(url, { errorCorrectionLevel: 'M' });
    const size = model.modules.size;
    const cells = [];
    for (let y = 0; y < size; y += 1) {
      const row = [];
      for (let x = 0; x < size; x += 1) {
        row.push(Boolean(model.modules.get(x, y)));
      }
      cells.push(row);
    }
    return { size, cells, quietZone: QUIET_ZONE };
  } catch (err) {
    return null;
  }
}

export default function QrMark({ url, x, y, size }) {
  const matrix = useMemo(() => getQrMatrix(url), [url]);
  if (!matrix || !size) {
    return (
      <g>
        <rect x={x} y={y} width={size} height={size} fill="#ffffff" stroke="#111827" strokeWidth={0.4} />
      </g>
    );
  }
  const total = matrix.size + matrix.quietZone * 2;
  const module = size / total;
  const dots = [];
  for (let row = 0; row < matrix.size; row += 1) {
    for (let col = 0; col < matrix.size; col += 1) {
      if (!matrix.cells[row][col]) continue;
      dots.push(
        <rect
          key={`${row}-${col}`}
          x={x + (col + matrix.quietZone) * module}
          y={y + (row + matrix.quietZone) * module}
          width={module}
          height={module}
          fill="#000000"
        />
      );
    }
  }
  return (
    <g shapeRendering="crispEdges">
      <rect x={x} y={y} width={size} height={size} fill="#ffffff" />
      {dots}
    </g>
  );
}
