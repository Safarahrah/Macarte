// src/printable/PrintTab.jsx
import React, { useEffect, useRef, useState } from 'react';
import PrintableCardCanvas from './PrintableCardCanvas';
import { defaultConfig, sanitizeConfig } from './shared/sanitize.js';
import { FORMATS, getExportPixelSize, getGeometry } from './shared/spec.js';
import { TEMPLATES, getTemplate } from './shared/templates.js';

const API = '/api';

const FIELD_LABELS = {
  firstName: 'First name',
  lastName: 'Last name',
  title: 'Job title',
  company: 'Company',
  phone: 'Phone',
  email: 'Email',
  website: 'Website',
  address: 'Address',
  slogan: 'Slogan (back side)'
};

const inputCls = 'w-full px-3 py-2 text-sm rounded-input bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark border border-gray-300 dark:border-gray-600';
const labelCls = 'block text-sm font-medium text-text-primary dark:text-text-secondary-dark mb-1';
const btnCls = 'px-4 py-2 text-sm font-medium rounded-button transition-all disabled:opacity-50';
const round1 = (n) => Math.round(Number(n) * 10) / 10;

function initialConfig(data, slug) {
  const base = defaultConfig();
  const p = (data && data.personal) || {};
  const c = (data && data.contact) || {};
  return {
    ...base,
    fields: {
      ...base.fields,
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      title: p.title || '',
      company: p.company || '',
      phone: c.phone || '',
      email: c.email || '',
      website: c.website || '',
      address: p.location || ''
    },
    digitalCard: { slug: slug || '', userId: '', shortCode: (data && data._shortCode) || '', name: '' }
  };
}

function applyTemplate(cfg, templateId) {
  const t = getTemplate(templateId);
  return {
    ...cfg,
    templateId: t.id,
    colors: { ...t.colors },
    fonts: { ...t.fonts },
    typeScale: { ...t.typeScale },
    alignment: t.alignment,
    qr: { ...cfg.qr, x: null, y: null },
    logo: { ...cfg.logo, x: null, y: null },
    elementOverrides: {}
  };
}

function toDataUrl(href) {
  return fetch(href, { credentials: 'include' })
    .then((res) => res.blob())
    .then((blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}

// Convertit le SVG affiché en PNG à la résolution d'impression (sans les repères)
async function exportSvgToPng(svgEl, { formatId, includeBleed, dpi }) {
  const geo = getGeometry(formatId);
  const { widthPx, heightPx } = getExportPixelSize(formatId, { includeBleed, dpi });
  const clone = svgEl.cloneNode(true);

  clone.querySelectorAll('g[pointer-events="none"]').forEach((g) => g.remove()); // repères
  clone.querySelectorAll('rect[stroke="#2563eb"]').forEach((r) => r.remove());   // sélection

  const viewBox = includeBleed
    ? `0 0 ${geo.document.widthMm} ${geo.document.heightMm}`
    : `${geo.trim.x} ${geo.trim.y} ${geo.trim.widthMm} ${geo.trim.heightMm}`;
  clone.setAttribute('viewBox', viewBox);
  clone.setAttribute('width', widthPx);
  clone.setAttribute('height', heightPx);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.removeAttribute('class');
  clone.removeAttribute('style');

  // Un SVG utilisé comme image ne peut pas charger de fichiers externes : on intègre le logo
  await Promise.all(
    Array.from(clone.querySelectorAll('image')).map(async (el) => {
      const href = el.getAttribute('href') || el.getAttribute('xlink:href');
      if (!href || href.startsWith('data:')) return;
      try {
        el.setAttribute('href', await toDataUrl(href));
      } catch (e) {
        el.remove();
      }
    })
  );

  const xml = new XMLSerializer().serializeToString(clone);
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  });

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, widthPx, heightPx);
  ctx.drawImage(img, 0, 0, widthPx, heightPx);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export default function PrintTab({ data, slug, csrfToken }) {
  const [config, setConfig] = useState(null);
  const [side, setSide] = useState('front');
  const [showGuides, setShowGuides] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const canvasWrapRef = useRef(null);

  const publicUrl = `${window.location.origin}/${(data && data._shortCode) || slug || ''}`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${API}/printable/${encodeURIComponent(slug || '')}`,
          { credentials: 'include' }
        );

        if (cancelled) return;

        if (res.ok) {
          const row = await res.json();
          setConfig(sanitizeConfig(row.config));
        } else {
          setConfig(initialConfig(data, slug));
        }
      } catch (e) {
        if (!cancelled) {
          setConfig(initialConfig(data, slug));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, data]);

  if (!config) {
    return <p className="text-sm text-text-muted dark:text-text-muted-dark">Loading print layout…</p>;
  }

  const activeSide = config.doubleSided ? side : 'front';
  const setTop = (patch) => setConfig((c) => ({ ...c, ...patch }));
  const setField = (key, value) => setConfig((c) => ({ ...c, fields: { ...c.fields, [key]: value } }));
  const toggleQr = () => setConfig((c) => ({ ...c, visibility: { ...c.visibility, qr: !c.visibility.qr } }));
  const hasOverrides = Object.keys(config.elementOverrides || {}).length > 0;
  const px = getExportPixelSize(config.formatId, { includeBleed: config.includeBleed, dpi: config.dpi || 300 });

  const handleMove = (id, pos) =>
    setConfig((c) => ({
      ...c,
      elementOverrides: {
        ...c.elementOverrides,
        [id]: { ...(c.elementOverrides && c.elementOverrides[id]), x: round1(pos.x), y: round1(pos.y) }
      }
    }));

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      let token = csrfToken;
      if (!token) {
        const r = await fetch(`${API}/csrf-token`, { credentials: 'include' });
        token = (await r.json()).csrfToken;
      }
      const name = `${(data && data.personal && data.personal.firstName) || ''} ${(data && data.personal && data.personal.lastName) || ''}`.trim();
      const payload = { ...config, digitalCard: { slug: slug || '', userId: '', shortCode: (data && data._shortCode) || '', name } };
      const res = await fetch(`${API}/printable`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ cardSlug: slug, config: payload })
      });
      if (res.ok) setStatus({ ok: true, text: 'Print layout saved.' });
      else if (res.status === 404) setStatus({ ok: false, text: 'Save the digital card first, then save the print layout.' });
      else if (res.status === 403) setStatus({ ok: false, text: 'Session expired. Reload the page and try again.' });
      else setStatus({ ok: false, text: 'Save failed.' });
    } catch (e) {
      setStatus({ ok: false, text: 'Network error.' });
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    const svgEl = canvasWrapRef.current && canvasWrapRef.current.querySelector('svg');
    if (!svgEl) return;
    setBusy(true);
    setStatus(null);
    try {
      const blob = await exportSvgToPng(svgEl, {
        formatId: config.formatId,
        includeBleed: config.includeBleed,
        dpi: config.dpi || 300
      });
      if (!blob) throw new Error('export failed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug || 'card'}-${activeSide}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setStatus({ ok: false, text: 'Export failed.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div ref={canvasWrapRef} className="overflow-x-auto">
          <PrintableCardCanvas
            config={config}
            publicUrl={publicUrl}
            side={activeSide}
            showGuides={showGuides}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={handleMove}
          />
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {config.doubleSided ? (
            <div className="flex gap-1">
              {['front', 'back'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSide(s); setSelectedId(null); }}
                  className={`${btnCls} capitalize ${activeSide === s ? 'bg-indigo-600 text-white' : 'bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : <span />}
          <div className="flex items-center gap-4 text-sm text-text-muted dark:text-text-muted-dark">
            {hasOverrides && (
              <button type="button" className="underline" onClick={() => setTop({ elementOverrides: {} })}>
                Reset positions
              </button>
            )}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showGuides} onChange={(e) => setShowGuides(e.target.checked)} />
              Show guides
            </label>
          </div>
        </div>
        <p className="text-xs text-text-muted dark:text-text-muted-dark">
          Drag text, logo or QR code to move them. Red dashed line = cut line. Blue dashed line = safe area: keep
          important content inside it. Guides are not exported.
        </p>
      </div>

      <div>
        <label className={labelCls}>Template</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setConfig((c) => applyTemplate(c, t.id)); setSelectedId(null); }}
              className={`p-2 rounded-input text-left border-2 transition-all ${config.templateId === t.id ? 'border-indigo-500' : 'border-transparent'}`}
              style={{ background: t.colors.background, color: t.colors.text }}
            >
              <span className="block text-xs font-semibold">{t.name}</span>
              <span className="block h-1 mt-1 rounded" style={{ background: t.colors.primary }} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Format</label>
          <select className={inputCls} value={config.formatId} onChange={(e) => setTop({ formatId: e.target.value })}>
            {Object.values(FORMATS).map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </div>
        <div className="space-y-2 text-sm text-text-primary dark:text-text-primary-dark">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={config.doubleSided} onChange={(e) => setTop({ doubleSided: e.target.checked })} />
            Double-sided (front + back)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={config.includeBleed} onChange={(e) => setTop({ includeBleed: e.target.checked })} />
            Include 3 mm bleed in export
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!config.visibility.qr} onChange={toggleQr} />
            Show QR code
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(FIELD_LABELS).map((key) => (
          <div key={key}>
            <label className={labelCls}>{FIELD_LABELS[key]}</label>
            <input className={inputCls} value={config.fields[key] || ''} onChange={(e) => setField(key, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" disabled={busy} onClick={save} className={`${btnCls} bg-indigo-600 text-white hover:bg-indigo-700`}>
          Save print layout
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={download}
          className={`${btnCls} bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark`}
        >
          Download PNG, {activeSide} ({px.widthPx} × {px.heightPx} px)
        </button>
        {status && (
          <span className={`text-sm ${status.ok ? 'text-emerald-500' : 'text-rose-500'}`}>{status.text}</span>
        )}
      </div>
    </div>
  );
}