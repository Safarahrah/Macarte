// src/printable/QrMark.jsx
import React, { useMemo, useState } from 'react';
import QRCode from 'qrcode';

const QUIET_ZONE = 4; // Modules de marge obligatoire autour du QR
const MIN_QR_SIZE_MM = 10; // Taille minimale recommandée pour l'impression (en mm)

/**
 * Génère la matrice binaire du QR code avec gestion d'erreur robuste
 */
export function getQrMatrix(url, errorCorrectionLevel = 'M') {
  if (!url || typeof url !== 'string') return null;
  
  try {
    // Vérification basique de longueur (les QR codes ont une limite ~2953 octets en mode byte)
    if (url.length > 2000) {
      console.warn('[QrMark] URL too long for reliable QR generation');
      return null;
    }
    
    const model = QRCode.create(url, { 
      errorCorrectionLevel,
      version: undefined // Auto-détection de la version optimale
    });
    
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
    console.error('[QrMark] Failed to generate QR matrix:', err);
    return null;
  }
}

/**
 * Composant QR Code vectoriel optimisé pour l'impression professionnelle
 */
export default function QrMark({ 
  url, 
  x = 0, 
  y = 0, 
  size, 
  className = '',
  onTestClick = null 
}) {
  const [hasError, setHasError] = useState(false);
  
  const matrix = useMemo(() => {
    const result = getQrMatrix(url);
    if (!result && url) setHasError(true);
    else setHasError(false);
    return result;
  }, [url]);

  // Affichage d'état d'erreur élégant
  if (hasError || !matrix || !size) {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <rect width={size} height={size} fill="#f3f4f6" stroke="#d1d5db" strokeWidth={0.5} rx={1} />
        <text 
          x={size / 2} 
          y={size / 2} 
          textAnchor="middle" 
          dominantBaseline="central"
          fontSize={Math.max(2, size * 0.1)}
          fill="#6b7280"
          fontFamily="sans-serif"
        >
          Invalid QR
        </text>
        {onTestClick && (
          <title>Cliquez pour tester l'URL</title>
        )}
      </g>
    );
  }

  const totalModules = matrix.size + matrix.quietZone * 2;
  const moduleSize = size / totalModules;
  const dots = [];

  // Génération optimisée des rectangles (regroupement possible via path futur)
  for (let row = 0; row < matrix.size; row += 1) {
    for (let col = 0; col < matrix.size; col += 1) {
      if (!matrix.cells[row][col]) continue;
      
      dots.push(
        <rect
          key={`${row}-${col}`}
          x={(col + matrix.quietZone) * moduleSize}
          y={(row + matrix.quietZone) * moduleSize}
          width={moduleSize}
          height={moduleSize}
          fill="#000000"
          shapeRendering="crispEdges" // Évite le flou anti-aliasing à l'impression
        />
      );
    }
  }

  return (
    <g 
      transform={`translate(${x}, ${y})`} 
      className={className}
      onClick={onTestClick ? () => onTestClick(url) : undefined}
      style={{ cursor: onTestClick ? 'pointer' : 'default' }}
    >
      {/* Fond blanc garanti pour le contraste d'impression */}
      <rect width={size} height={size} fill="#ffffff" />
      
      {/* Modules du QR code */}
      {dots}
      
      {/* Zone de silence explicite (optionnelle mais recommandée pour PDF) */}
      <rect 
        width={size} 
        height={size} 
        fill="none" 
        stroke="transparent" 
        strokeWidth={matrix.quietZone * moduleSize * 2}
      />
      
      {onTestClick && (
        <title>Cliquez pour vérifier ce QR code</title>
      )}
    </g>
  );
}

/**
 * Hook utilitaire pour valider la scanabilité avant export
 */
export function useQrValidation(url, minSizeMm = MIN_QR_SIZE_MM) {
  return useMemo(() => {
    const matrix = getQrMatrix(url);
    if (!matrix) return { valid: false, reason: 'Invalid URL or content too long' };
    
    // Estimation de la densité : plus il y a de modules, plus il faut de taille physique
    const densityFactor = matrix.size / 21; // 21 est la taille d'un QR v1
    const recommendedMinSize = minSizeMm * densityFactor;
    
    return { 
      valid: true, 
      matrixSize: matrix.size,
      recommendedMinSizeMm: Math.round(recommendedMinSize * 10) / 10
    };
  }, [url, minSizeMm]);
}