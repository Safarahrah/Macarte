// src/printable/PrintTab.jsx
// Printable business-card designer: live preview, template gallery, personal
// designs, "Importer ma carte", editable overlays and QR code controls.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Check, Download, FileText, Image as ImageIcon,
  Italic, Layers, Loader2, Lock, Move, Palette, Plus, QrCode, Search, Settings2, Trash2, Type, Upload, X
} from 'lucide-react';
import PrintableCardCanvas from './PrintableCardCanvas';
import CardSvgPreview from '../marketing/CardSvgPreview';
import { defaultConfig, sanitizeConfig, applyTemplatePreset } from './shared/sanitize.js';
import { FORMATS, FONT_STACKS, getExportPixelSize, getGeometry } from './shared/spec.js';
import { PUBLIC_TEMPLATES, getCategories, getCategoryLabel } from './shared/templates.js';
import { useQrValidation } from './QrMark';

const API = '/api';
const ACCEPTED_IMAGE = 'image/png,image/jpeg,image/webp';

const FIELD_LABELS = {
  firstName: 'Prénom',
  lastName: 'Nom',
  title: 'Fonction',
  company: 'Entreprise',
  phone: 'Téléphone',
  email: 'Email',
  website: 'Site web',
  address: 'Adresse',
  slogan: 'Slogan (verso)'
};

const VISIBILITY_LABELS = {
  title: 'Fonction',
  company: 'Entreprise',
  phone: 'Téléphone',
  email: 'Email',
  website: 'Site web',
  address: 'Adresse',
  social: 'Réseaux sociaux',
  extra: 'Note libre',
  slogan: 'Slogan',
  logo: 'Logo',
  qr: 'QR code'
};

const QR_KINDS = [
  { id: 'card', label: 'Carte digitale (URL)' },
  { id: 'website', label: 'Site web' },
  { id: 'phone', label: 'Téléphone' },
  { id: 'email', label: 'Email' },
  { id: 'vcard', label: 'vCard (contact)' }
];

const FONT_OPTIONS = Object.values(FONT_STACKS);

const TABS = [
  { id: 'templates', label: 'Modèles', icon: Palette },
  { id: 'content', label: 'Contenu', icon: Type },
  { id: 'elements', label: 'Éléments', icon: Layers },
  { id: 'qr', label: 'QR code', icon: QrCode },
  { id: 'options', label: 'Options', icon: Settings2 }
];

const labelCls = 'ui-label';
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

/** Build the QR payload for the selected kind, falling back to the card URL. */
function buildQrValue(kind, data, slug, shortCode) {
  const p = (data && data.personal) || {};
  const c = (data && data.contact) || {};
  const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
  const site = String(c.website || '').trim();
  const absoluteSite = site ? (/^https?:\/\//i.test(site) ? site : `https://${site}`) : '';
  const cardUrl = absoluteSite
    || (shortCode ? `${window.location.origin}/${shortCode}` : '')
    || (slug ? `${window.location.origin}/${slug}` : '');

  switch (kind) {
    case 'website':
      return absoluteSite || cardUrl;
    case 'phone':
      return c.phone ? `tel:${String(c.phone).replace(/[^\d+]/g, '')}` : '';
    case 'email':
      return c.email ? `mailto:${c.email}` : '';
    case 'vcard': {
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
      if (fullName) {
        lines.push(`FN:${fullName}`);
        lines.push(`N:${p.lastName || ''};${p.firstName || ''};;;`);
      }
      if (p.company) lines.push(`ORG:${p.company}`);
      if (p.title) lines.push(`TITLE:${p.title}`);
      if (c.phone) lines.push(`TEL;TYPE=CELL:${c.phone}`);
      if (c.email) lines.push(`EMAIL;TYPE=WORK:${c.email}`);
      if (cardUrl) lines.push(`URL:${cardUrl}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }
    default:
      return cardUrl;
  }
}

// Convert the displayed SVG into a print-resolution PNG (guides stripped).
async function exportSvgToPng(svgEl, { formatId, includeBleed, dpi }) {
  const geo = getGeometry(formatId);
  const { widthPx, heightPx } = getExportPixelSize(formatId, { includeBleed, dpi });
  const clone = svgEl.cloneNode(true);

  clone.querySelectorAll('g[pointer-events="none"]').forEach((g) => g.remove());
  clone.querySelectorAll('rect[stroke="#2563eb"]').forEach((r) => r.remove());

  const viewBox = includeBleed
    ? `0 0 ${geo.document.widthMm} ${geo.document.heightMm}`
    : `${geo.trim.x} ${geo.trim.y} ${geo.trim.widthMm} ${geo.trim.heightMm}`;
  clone.setAttribute('viewBox', viewBox);
  clone.setAttribute('width', widthPx);
  clone.setAttribute('height', heightPx);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.removeAttribute('class');
  clone.removeAttribute('style');

  // An SVG rendered as an image cannot load external files: inline every image.
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

/** Small numeric field used across the element / QR panels. */
function NumField({ label, value, onChange, step = 0.5, min = -20, max = 200, suffix = 'mm' }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-text-muted dark:text-text-muted-dark">{label}</span>
      <span className="mt-1 flex items-center rounded-input border border-input-border dark:border-input-border-dark bg-input-bg dark:bg-input-bg-dark">
        <input
          type="number"
          value={Number.isFinite(Number(value)) ? value : ''}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent px-2.5 py-1.5 text-sm text-text-primary dark:text-text-primary-dark focus:outline-none"
        />
        <span className="pr-2.5 text-[11px] text-text-muted-subtle dark:text-text-muted-subtle-dark">{suffix}</span>
      </span>
    </label>
  );
}

export default function PrintTab({ data, slug, csrfToken }) {
  const [config, setConfig] = useState(null);
  const [side, setSide] = useState('front');
  const [showGuides, setShowGuides] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [tab, setTab] = useState('templates');
  const [templateQuery, setTemplateQuery] = useState('');
  const [templateCategory, setTemplateCategory] = useState('all');
  const [qrKind, setQrKind] = useState('card');
  const [designs, setDesigns] = useState([]);
  const [designsBusy, setDesignsBusy] = useState(false);
  const [activeDesignId, setActiveDesignId] = useState(null);
  const [designName, setDesignName] = useState('');
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [price, setPrice] = useState(null);
  const [printableCardId, setPrintableCardId] = useState(null);
  const canvasWrapRef = useRef(null);
  const importInputRef = useRef(null);
  const elementImageRef = useRef(null);
  const elementTargetRef = useRef(null);

  const isPaid = paymentStatus === 'paid';

  const website = String(data?.contact?.website || '').trim();
  const shortCode = (data && data._shortCode) || '';
  const publicUrl = website
    ? (/^https?:\/\//i.test(website) ? website : `https://${website}`)
    : `${window.location.origin}/${shortCode || slug || ''}`;

  const setTop = useCallback((patch) => setConfig((c) => ({ ...c, ...patch })), []);
  const setField = useCallback((key, value) => setConfig((c) => ({ ...c, fields: { ...c.fields, [key]: value } })), []);

  const ensureCsrf = useCallback(async () => {
    if (csrfToken) return csrfToken;
    const r = await fetch(`${API}/csrf-token`, { credentials: 'include' });
    const j = await r.json();
    return j.csrfToken;
  }, [csrfToken]);

  const uploadImage = useCallback(async (file) => {
    const token = await ensureCsrf();
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': token },
      body: fd
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Envoi de l’image impossible');
    }
    return (await res.json()).url;
  }, [ensureCsrf]);

  // ---- initial config (saved layout or derived from the digital card) ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/printable/${encodeURIComponent(slug || '')}`, { credentials: 'include' });
        if (cancelled) return;
        if (res.ok) {
          const row = await res.json();
          setConfig(sanitizeConfig(row.config));
          setPaymentStatus(row.payment_status || 'unpaid');
          setPrice(row.price);
          setPrintableCardId(row.id);
        } else {
          setConfig(initialConfig(data, slug));
        }
      } catch (e) {
        if (!cancelled) setConfig(initialConfig(data, slug));
      }
    })();
    return () => { cancelled = true; };
  }, [slug, data]);

  // ---- personal designs ("Mes designs") ----
  const refreshDesigns = useCallback(async () => {
    setDesignsBusy(true);
    try {
      const res = await fetch(`${API}/printable-cards`, { credentials: 'include' });
      if (res.ok) setDesigns(await res.json());
    } catch (e) {
      /* silent: the list is a convenience */
    } finally {
      setDesignsBusy(false);
    }
  }, []);

  useEffect(() => { refreshDesigns(); }, [refreshDesigns]);

  const activeSide = config ? (config.doubleSided ? side : 'front') : 'front';
  const hasOverrides = config ? Object.keys(config.elementOverrides || {}).length > 0 : false;
  const px = config ? getExportPixelSize(config.formatId, { includeBleed: config.includeBleed, dpi: config.dpi || 300 }) : null;

  const qrValue = useMemo(
    () => (config ? buildQrValue(qrKind, data, slug, shortCode) || publicUrl : publicUrl),
    [qrKind, data, slug, shortCode, publicUrl, config]
  );
  const qrValidation = useQrValidation(config ? qrValue : '');

  const categories = useMemo(() => getCategories(), []);
  const filteredTemplates = useMemo(() => {
    const q = templateQuery.trim().toLowerCase();
    return PUBLIC_TEMPLATES.filter((t) => {
      if (templateCategory !== 'all' && t.category !== templateCategory) return false;
      if (!q) return true;
      return [t.name, t.description, getCategoryLabel(t.category), ...(t.tags || [])].join(' ').toLowerCase().includes(q);
    });
  }, [templateQuery, templateCategory]);

  const previewConfigs = useMemo(() => {
    const map = new Map();
    if (!config || tab !== 'templates') return map;
    filteredTemplates.forEach((t) => map.set(t.id, applyTemplatePreset(config, t.id)));
    return map;
  }, [tab, filteredTemplates, config]);

  if (!config) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted dark:text-text-muted-dark py-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Chargement de l’éditeur…
      </div>
    );
  }

  // ---------------- actions ----------------

  const handleMove = (id, pos) =>
    setConfig((c) => ({
      ...c,
      elementOverrides: {
        ...c.elementOverrides,
        [id]: { ...(c.elementOverrides && c.elementOverrides[id]), x: round1(pos.x), y: round1(pos.y) }
      }
    }));

  const applyTemplate = (templateId) => {
    setConfig((c) => applyTemplatePreset(c, templateId));
    setSelectedId(null);
  };

  const saveLayout = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const token = await ensureCsrf();
      const name = `${config.fields.firstName || ''} ${config.fields.lastName || ''}`.trim();
      const payload = { ...config, digitalCard: { slug: slug || '', userId: '', shortCode, name } };
      const res = await fetch(`${API}/printable`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ cardSlug: slug, config: payload })
      });
      if (res.ok) {
        const row = await res.json();
        setPrintableCardId(row.id);
        setStatus({ ok: true, text: 'Mise en page enregistrée.' });
      }
      else if (res.status === 404) setStatus({ ok: false, text: 'Enregistrez d’abord la carte digitale.' });
      else if (res.status === 403) setStatus({ ok: false, text: 'Session expirée. Rechargez la page.' });
      else setStatus({ ok: false, text: 'Enregistrement impossible.' });
    } catch (e) {
      setStatus({ ok: false, text: 'Erreur réseau.' });
    } finally {
      setBusy(false);
    }
  };

  const saveDesign = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const token = await ensureCsrf();
      const name = designName.trim()
        || `${config.fields.firstName || ''} ${config.fields.lastName || ''}`.trim()
        || 'Mon design';
      const payload = { ...config, digitalCard: { slug: slug || '', userId: '', shortCode, name } };
      const url = activeDesignId ? `${API}/printable-cards/${activeDesignId}` : `${API}/printable-cards`;
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ name, config: payload })
      });
      if (res.ok) {
        const saved = await res.json();
        setActiveDesignId(saved.id);
        setDesignName(saved.name || name);
        setStatus({ ok: true, text: 'Design enregistré dans « Mes designs ».' });
        refreshDesigns();
      } else {
        setStatus({ ok: false, text: 'Enregistrement du design impossible.' });
      }
    } catch (e) {
      setStatus({ ok: false, text: 'Erreur réseau.' });
    } finally {
      setBusy(false);
    }
  };

  const loadDesign = async (id) => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/printable-cards/${id}`, { credentials: 'include' });
      if (res.ok) {
        const row = await res.json();
        setConfig(sanitizeConfig(row.config));
        setActiveDesignId(row.id);
        setDesignName(row.name || '');
        setSelectedId(null);
        setStatus({ ok: true, text: `« ${row.name} » chargé.` });
      } else {
        setStatus({ ok: false, text: 'Chargement impossible.' });
      }
    } catch (e) {
      setStatus({ ok: false, text: 'Erreur réseau.' });
    } finally {
      setBusy(false);
    }
  };

  const deleteDesign = async (id) => {
    try {
      const token = await ensureCsrf();
      const res = await fetch(`${API}/printable-cards/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRF-Token': token }
      });
      if (res.ok) {
        if (activeDesignId === id) setActiveDesignId(null);
        refreshDesigns();
      }
    } catch (e) { /* ignore */ }
  };

  const importCard = async (file) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE.split(',').includes(file.type)) {
      setImportError('Formats acceptés : PNG, JPG ou WebP.');
      return;
    }
    setImportError('');
    setImportBusy(true);
    try {
      const url = await uploadImage(file);
      setConfig((c) => applyTemplatePreset({ ...c, background: { url } }, 'custom'));
      setSelectedId(null);
      setStatus({ ok: true, text: 'Carte importée : votre visuel sert de fond.' });
    } catch (e) {
      setImportError(e.message || 'Import impossible.');
    } finally {
      setImportBusy(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const removeBackground = () => {
    setConfig((c) => ({ ...c, background: { url: '' } }));
  };

  const addElement = (type) => {
    const id = `el-${Date.now().toString(36)}`;
    const base = type === 'image'
      ? { id, type, src: '', x: 6, y: 6, w: 24, h: 24, fit: 'cover' }
      : {
        id, type, text: 'Votre texte', x: 8, y: 20, w: 45, h: 8,
        size: 7, color: '#111111', font: 'inter', align: 'left', bold: false, italic: false, spacing: 0
      };
    setConfig((c) => ({ ...c, customElements: [...(c.customElements || []), base] }));
    setSelectedId(id);
    setTab('elements');
  };

  const updateElement = (id, patch) =>
    setConfig((c) => ({
      ...c,
      customElements: (c.customElements || []).map((el) => (el.id === id ? { ...el, ...patch } : el))
    }));

  const deleteElement = (id) => {
    setConfig((c) => ({ ...c, customElements: (c.customElements || []).filter((el) => el.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  };

  const pickElementImage = (id) => {
    elementTargetRef.current = id;
    if (elementImageRef.current) elementImageRef.current.click();
  };

  const onElementImageChosen = async (file) => {
    const id = elementTargetRef.current;
    if (!file || !id) return;
    try {
      const url = await uploadImage(file);
      updateElement(id, { src: url });
    } catch (e) {
      setStatus({ ok: false, text: e.message || 'Import impossible.' });
    } finally {
      elementTargetRef.current = null;
      if (elementImageRef.current) elementImageRef.current.value = '';
    }
  };

  const downloadPng = async () => {
    if (!isPaid) {
      setStatus({ ok: false, text: 'Veuillez débloquer votre carte pour exporter en HD.' });
      return;
    }
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
      a.download = `${slug || 'carte'}-${activeSide}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setStatus({ ok: false, text: 'Export impossible.' });
    } finally {
      setBusy(false);
    }
  };

  const exportFile = async (format) => {
    if (!isPaid) {
      setStatus({ ok: false, text: 'Veuillez débloquer votre carte pour exporter en HD.' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const token = await ensureCsrf();
      const payload = { ...config, digitalCard: { slug: slug || '', userId: '', shortCode, name: '' } };
      const res = await fetch(`${API}/printable-cards/export`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({
          format,
          side: activeSide,
          includeBleed: config.includeBleed,
          dpi: config.dpi || 300,
          config: payload
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatus({ ok: false, text: err.error || 'Export impossible.' });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug || 'carte'}-${activeSide}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setStatus({ ok: false, text: 'Erreur réseau.' });
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async () => {
    if (!printableCardId) {
      await saveLayout();
    }
    setBusy(true);
    try {
      const token = await ensureCsrf();
      const res = await fetch(`${API}/printable-cards/${printableCardId}/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }
      });
      const session = await res.json();
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error(session.error || 'Erreur lors de la création de la session Stripe');
      }
    } catch (e) {
      setStatus({ ok: false, text: e.message });
      setBusy(false);
    }
  };

  const selectedElement = (config.customElements || []).find((el) => el.id === selectedId) || null;
  const qrSize = Number(config.qr?.size) || 14;
  const qrTooSmall = qrValidation.valid && qrSize < (qrValidation.recommendedMinSizeMm || 10);

  return (
    <div className="space-y-5">
      {/* ---------------- PREVIEW ---------------- */}
      <div className="space-y-3">
        <div ref={canvasWrapRef} className="overflow-x-auto rounded-card bg-surface dark:bg-surface-dark p-3 ring-1 ring-border-subtle dark:ring-border-dark relative group">
          <PrintableCardCanvas
            config={config}
            publicUrl={publicUrl}
            qrValue={qrValue}
            side={activeSide}
            showGuides={showGuides}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={handleMove}
            isPaid={isPaid}
          />
          {!isPaid && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 pointer-events-none">
              <div className="bg-white/90 dark:bg-black/80 px-4 py-2 rounded-full shadow-lg border border-border dark:border-border-dark flex items-center gap-2">
                <Lock className="w-4 h-4 text-action dark:text-action-dark" />
                <span className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">Aperçu protégé</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          {config.doubleSided ? (
            <div className="inline-flex rounded-button border border-border dark:border-border-dark overflow-hidden">
              {['front', 'back'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSide(s); setSelectedId(null); }}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${activeSide === s
                    ? 'bg-action dark:bg-action-dark text-white dark:text-[#04211d]'
                    : 'text-text-secondary dark:text-text-secondary-dark hover:bg-card dark:hover:bg-card-dark'}`}
                >
                  {s === 'front' ? 'Recto' : 'Verso'}
                </button>
              ))}
            </div>
          ) : <span />}

          <div className="flex items-center gap-4 text-sm text-text-muted dark:text-text-muted-dark">
            {hasOverrides && (
              <button type="button" className="underline hover:text-text-primary dark:hover:text-text-primary-dark" onClick={() => setTop({ elementOverrides: {} })}>
                Réinitialiser les positions
              </button>
            )}
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showGuides} onChange={(e) => setShowGuides(e.target.checked)} />
              Repères
            </label>
          </div>
        </div>

        <p className="flex items-start gap-1.5 text-xs text-text-muted dark:text-text-muted-dark">
          <Move className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Glissez le texte, le logo ou le QR code pour les déplacer. Ligne rouge pointillée = trait de coupe, bleue = zone de sécurité (les repères ne sont pas exportés).
        </p>
      </div>

      {/* ---------------- PANEL TABS ---------------- */}
      <div className="ui-card overflow-hidden">
        <div className="flex overflow-x-auto border-b border-border-subtle dark:border-border-dark">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id
                ? 'border-action dark:border-action-dark text-action dark:text-action-dark'
                : 'border-transparent text-text-muted dark:text-text-muted-dark hover:text-text-primary dark:hover:text-text-primary-dark'}`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          {/* ============ TEMPLATES ============ */}
          {tab === 'templates' && (
            <div className="space-y-6">
              {/* Mes designs */}
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-sm font-semibold text-text-primary dark:text-text-primary-dark">Mes designs</h3>
                  {designsBusy && <Loader2 className="w-3.5 h-3.5 animate-spin text-text-muted-subtle dark:text-text-muted-subtle-dark" />}
                </div>
                {designs.length === 0 ? (
                  <p className="mt-2 text-xs text-text-muted dark:text-text-muted-dark">
                    Aucun design enregistré. Utilisez « Enregistrer comme design » dans l’onglet Options.
                  </p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {designs.map((d) => (
                      <li key={d.id} className="inline-flex items-center rounded-button border border-border dark:border-border-dark overflow-hidden">
                        <button
                          type="button"
                          onClick={() => loadDesign(d.id)}
                          className={`px-3 py-1.5 text-xs font-medium ${activeDesignId === d.id
                            ? 'bg-action/10 text-action dark:text-action-dark'
                            : 'text-text-secondary dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-surface-dark'}`}
                        >
                          {d.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDesign(d.id)}
                          aria-label={`Supprimer ${d.name}`}
                          className="px-2 py-1.5 text-text-muted-subtle dark:text-text-muted-subtle-dark hover:text-error dark:hover:text-error-dark"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Importer ma carte */}
              <div className="rounded-container border border-dashed border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-action/10 text-action dark:text-action-dark">
                    <Upload className="w-5 h-5" />
                  </span>
                  <div className="min-w-[12rem] flex-1">
                    <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">Importer ma carte</h3>
                    <p className="text-xs text-text-muted dark:text-text-muted-dark">
                      PNG, JPG ou WebP. Votre visuel sert de fond : son texte n’est pas modifiable, ajoutez vos propres éléments par-dessus.
                    </p>
                  </div>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept={ACCEPTED_IMAGE}
                    className="hidden"
                    onChange={(e) => importCard(e.target.files && e.target.files[0])}
                  />
                  <button
                    type="button"
                    disabled={importBusy}
                    onClick={() => importInputRef.current && importInputRef.current.click()}
                    className="ui-btn ui-btn-primary"
                  >
                    {importBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {config.background.url ? 'Remplacer' : 'Importer ma carte'}
                  </button>
                  {config.background.url && (
                    <button type="button" onClick={removeBackground} className="ui-btn ui-btn-ghost">
                      <X className="w-4 h-4" /> Retirer
                    </button>
                  )}
                </div>
                {config.background.url && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={config.background.url} alt="Aperçu de la carte importée" className="h-14 w-auto rounded-input ring-1 ring-black/10" />
                    <div>
                      <p className="text-xs font-medium text-text-primary dark:text-text-primary-dark">Visuel utilisé comme fond</p>
                      <div className="mt-1">
                        <label className="text-[11px] text-text-muted dark:text-text-muted-dark mr-2">Format</label>
                        <select
                          className="ui-input !w-auto !py-1 !text-xs"
                          value={config.formatId}
                          onChange={(e) => setTop({ formatId: e.target.value })}
                        >
                          {Object.values(FORMATS).map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                {importError && <p className="mt-2 text-xs text-error-text dark:text-error-text-dark">{importError}</p>}
              </div>

              {/* Gallery */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative sm:max-w-xs w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-subtle dark:text-text-muted-subtle-dark" />
                    <input
                      type="search"
                      value={templateQuery}
                      onChange={(e) => setTemplateQuery(e.target.value)}
                      placeholder="Rechercher un modèle"
                      className="ui-input !pl-9"
                      aria-label="Rechercher un modèle"
                    />
                  </div>
                  <p className="text-xs text-text-muted dark:text-text-muted-dark">{filteredTemplates.length} modèles</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => setTemplateCategory('all')} className={`ui-btn !px-3 !py-1.5 !text-xs ${templateCategory === 'all' ? 'ui-btn-primary' : 'ui-btn-secondary'}`}>
                    Tous
                  </button>
                  {categories.map((id) => (
                    <button key={id} type="button" onClick={() => setTemplateCategory(id)} className={`ui-btn !px-3 !py-1.5 !text-xs ${templateCategory === id ? 'ui-btn-primary' : 'ui-btn-secondary'}`}>
                      {getCategoryLabel(id)}
                    </button>
                  ))}
                </div>

                {filteredTemplates.length === 0 ? (
                  <p className="mt-4 text-sm text-text-muted dark:text-text-muted-dark">Aucun modèle ne correspond à cette recherche.</p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t.id)}
                        className={`text-left rounded-input overflow-hidden border-2 transition-all bg-card dark:bg-card-dark ${config.templateId === t.id
                          ? 'border-action dark:border-action-dark shadow-lifted'
                          : 'border-border-subtle dark:border-border-dark hover:border-border dark:hover:border-border-dark'}`}
                      >
                        <span className="block aspect-[1.586/1] bg-white overflow-hidden">
                          <CardSvgPreview config={previewConfigs.get(t.id)} publicUrl={publicUrl} />
                        </span>
                        <span className="block px-2.5 py-2">
                          <span className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-text-primary dark:text-text-primary-dark truncate">{t.name}</span>
                            {config.templateId === t.id && <Check className="w-3.5 h-3.5 shrink-0 text-action dark:text-action-dark" />}
                          </span>
                          <span className="block text-[11px] text-text-muted dark:text-text-muted-dark capitalize">{t.category}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============ CONTENT ============ */}
          {tab === 'content' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.keys(FIELD_LABELS).map((key) => (
                  <div key={key}>
                    <label className={labelCls} htmlFor={`print-${key}`}>{FIELD_LABELS[key]}</label>
                    <input
                      id={`print-${key}`}
                      className="ui-input"
                      value={config.fields[key] || ''}
                      onChange={(e) => setField(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">Éléments visibles</h3>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.keys(VISIBILITY_LABELS).map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-secondary-dark">
                      <input
                        type="checkbox"
                        checked={!!config.visibility[key]}
                        onChange={(e) => setTop({ visibility: { ...config.visibility, [key]: e.target.checked } })}
                      />
                      {VISIBILITY_LABELS[key]}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Police des titres</label>
                  <select className="ui-input" value={config.fonts.heading} onChange={(e) => setTop({ fonts: { ...config.fonts, heading: e.target.value } })}>
                    {FONT_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Police du texte</label>
                  <select className="ui-input" value={config.fonts.body} onChange={(e) => setTop({ fonts: { ...config.fonts, body: e.target.value } })}>
                    {FONT_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ============ ELEMENTS ============ */}
          {tab === 'elements' && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => addElement('text')} className="ui-btn ui-btn-secondary">
                  <Type className="w-4 h-4" /> Ajouter un texte
                </button>
                <button type="button" onClick={() => addElement('image')} className="ui-btn ui-btn-secondary">
                  <ImageIcon className="w-4 h-4" /> Ajouter une image
                </button>
              </div>

              <input
                ref={elementImageRef}
                type="file"
                accept={ACCEPTED_IMAGE}
                className="hidden"
                onChange={(e) => onElementImageChosen(e.target.files && e.target.files[0])}
              />

              {(config.customElements || []).length === 0 ? (
                <p className="text-xs text-text-muted dark:text-text-muted-dark">
                  Ajoutez des textes ou images libres par-dessus votre carte. Ils sont déplaçables directement dans l’aperçu.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {(config.customElements || []).map((el) => (
                    <li key={el.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(el.id)}
                        className={`flex-1 flex items-center gap-2 rounded-input px-3 py-2 text-sm text-left border transition-colors ${selectedId === el.id
                          ? 'border-action dark:border-action-dark bg-action/5'
                          : 'border-border-subtle dark:border-border-dark hover:bg-surface dark:hover:bg-surface-dark'}`}
                      >
                        {el.type === 'text' ? <Type className="w-4 h-4 shrink-0" /> : <ImageIcon className="w-4 h-4 shrink-0" />}
                        <span className="truncate text-text-primary dark:text-text-primary-dark">
                          {el.type === 'text' ? (el.text || 'Texte') : (el.src ? 'Image' : 'Image (vide)')}
                        </span>
                      </button>
                      <button type="button" onClick={() => deleteElement(el.id)} aria-label="Supprimer l’élément" className="p-2 text-text-muted-subtle dark:text-text-muted-subtle-dark hover:text-error dark:hover:text-error-dark">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {selectedElement && (
                <div className="rounded-container border border-border-subtle dark:border-border-dark p-3 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted dark:text-text-muted-dark">
                    {selectedElement.type === 'text' ? 'Texte' : 'Image'} sélectionné
                  </h3>

                  {selectedElement.type === 'text' ? (
                    <>
                      <div>
                        <label className={labelCls}>Contenu</label>
                        <textarea
                          rows={2}
                          className="ui-input resize-y"
                          value={selectedElement.text || ''}
                          onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Police</label>
                          <select className="ui-input" value={selectedElement.font} onChange={(e) => updateElement(selectedElement.id, { font: e.target.value })}>
                            {FONT_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                          </select>
                        </div>
                        <NumField label="Taille" value={selectedElement.size} onChange={(v) => updateElement(selectedElement.id, { size: v })} min={4} max={30} suffix="pt" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => updateElement(selectedElement.id, { bold: !selectedElement.bold })} className={`ui-btn !px-2.5 ${selectedElement.bold ? 'ui-btn-primary' : 'ui-btn-secondary'}`} aria-label="Gras">
                          <Bold className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => updateElement(selectedElement.id, { italic: !selectedElement.italic })} className={`ui-btn !px-2.5 ${selectedElement.italic ? 'ui-btn-primary' : 'ui-btn-secondary'}`} aria-label="Italique">
                          <Italic className="w-4 h-4" />
                        </button>
                        <div className="inline-flex rounded-button border border-border dark:border-border-dark overflow-hidden">
                          {[['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]].map(([value, Icon]) => (
                            <button
                              key={value}
                              type="button"
                              aria-label={`Aligner ${value}`}
                              onClick={() => updateElement(selectedElement.id, { align: value })}
                              className={`px-2.5 py-2 ${selectedElement.align === value ? 'bg-action dark:bg-action-dark text-white dark:text-[#04211d]' : 'text-text-secondary dark:text-text-secondary-dark'}`}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs text-text-muted dark:text-text-muted-dark">
                          Couleur
                          <input
                            type="color"
                            value={selectedElement.color || '#111111'}
                            onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                            className="h-8 w-10 rounded border border-border dark:border-border-dark bg-transparent"
                          />
                        </label>
                        <NumField label="Espacement" value={selectedElement.spacing} onChange={(v) => updateElement(selectedElement.id, { spacing: v })} step={0.1} min={-2} max={4} suffix="pt" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <NumField label="X" value={selectedElement.x} onChange={(v) => updateElement(selectedElement.id, { x: v })} />
                        <NumField label="Y" value={selectedElement.y} onChange={(v) => updateElement(selectedElement.id, { y: v })} />
                        <NumField label="Largeur" value={selectedElement.w} onChange={(v) => updateElement(selectedElement.id, { w: v })} />
                      </div>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => pickElementImage(selectedElement.id)} className="ui-btn ui-btn-secondary">
                        <Upload className="w-4 h-4" /> {selectedElement.src ? 'Remplacer l’image' : 'Choisir une image'}
                      </button>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Ajustement</label>
                          <select className="ui-input" value={selectedElement.fit || 'cover'} onChange={(e) => updateElement(selectedElement.id, { fit: e.target.value })}>
                            <option value="cover">Remplir (recadrer)</option>
                            <option value="meet">Contenir (entier)</option>
                          </select>
                        </div>
                        <NumField label="Largeur" value={selectedElement.w} onChange={(v) => updateElement(selectedElement.id, { w: v })} />
                        <NumField label="Hauteur" value={selectedElement.h} onChange={(v) => updateElement(selectedElement.id, { h: v })} />
                        <NumField label="X" value={selectedElement.x} onChange={(v) => updateElement(selectedElement.id, { x: v })} />
                        <NumField label="Y" value={selectedElement.y} onChange={(v) => updateElement(selectedElement.id, { y: v })} />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="rounded-container border border-border-subtle dark:border-border-dark p-3">
                <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">Logo</h3>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {config.logo.url && <img src={config.logo.url} alt="Logo" className="h-10 w-auto rounded-input ring-1 ring-black/10 bg-white" />}
                  <label className="ui-btn ui-btn-secondary cursor-pointer">
                    <Upload className="w-4 h-4" /> {config.logo.url ? 'Remplacer le logo' : 'Ajouter un logo'}
                    <input
                      type="file"
                      accept={ACCEPTED_IMAGE}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        try {
                          const url = await uploadImage(file);
                          setTop({ logo: { ...config.logo, url } });
                        } catch (err) {
                          setStatus({ ok: false, text: err.message || 'Import impossible.' });
                        } finally {
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                  {config.logo.url && (
                    <button type="button" className="ui-btn ui-btn-ghost" onClick={() => setTop({ logo: { ...config.logo, url: '' } })}>
                      <X className="w-4 h-4" /> Retirer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============ QR CODE ============ */}
          {tab === 'qr' && (
            <div className="space-y-5">
              <label className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-secondary-dark">
                <input
                  type="checkbox"
                  checked={!!config.visibility.qr}
                  onChange={(e) => setTop({ visibility: { ...config.visibility, qr: e.target.checked } })}
                />
                Afficher le QR code
              </label>

              <div>
                <label className={labelCls}>Contenu encodé</label>
                <select className="ui-input" value={qrKind} onChange={(e) => setQrKind(e.target.value)}>
                  {QR_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                </select>
                <p className="mt-1 text-[11px] text-text-muted-subtle dark:text-text-muted-subtle-dark break-all">{qrValue || 'Aucun contenu'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumField label="Taille" value={qrSize} onChange={(v) => setTop({ qr: { ...config.qr, size: Math.min(36, Math.max(10, v)) } })} step={0.5} min={10} max={36} />
                <div className="flex items-end">
                  <button type="button" className="ui-btn ui-btn-secondary w-full" onClick={() => setTop({ elementOverrides: {}, qr: { ...config.qr, x: null, y: null } })}>
                    Recentrer
                  </button>
                </div>
                <NumField label="Position X" value={config.qr?.x ?? ''} onChange={(v) => setTop({ qr: { ...config.qr, x: v } })} suffix="mm" />
                <NumField label="Position Y" value={config.qr?.y ?? ''} onChange={(v) => setTop({ qr: { ...config.qr, y: v } })} suffix="mm" />
              </div>

              {!qrValidation.valid && qrValue && (
                <p className="text-xs text-error-text dark:text-error-text-dark">Contenu trop long pour un QR code fiable.</p>
              )}
              {qrTooSmall && (
                <p className="text-xs text-error-text dark:text-error-text-dark">
                  Taille minimum recommandée pour ce contenu : {qrValidation.recommendedMinSizeMm} mm.
                </p>
              )}
              {qrValidation.valid && !qrTooSmall && (
                <p className="text-xs text-success-text dark:text-success-text-dark">
                  QR scannable ({qrValidation.matrixSize} modules, {round1(qrSize)} mm).
                </p>
              )}
            </div>
          )}

          {/* ============ OPTIONS ============ */}
          {tab === 'options' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Format</label>
                  <select className="ui-input" value={config.formatId} onChange={(e) => setTop({ formatId: e.target.value })}>
                    {Object.values(FORMATS).map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Résolution d’export</label>
                  <select className="ui-input" value={config.dpi || 300} onChange={(e) => setTop({ dpi: Number(e.target.value) })}>
                    {[300, 400, 600].map((d) => <option key={d} value={d}>{d} ppp</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2 text-sm text-text-primary dark:text-text-primary-dark">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={config.doubleSided} onChange={(e) => setTop({ doubleSided: e.target.checked })} />
                  Recto-verso
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={config.includeBleed} onChange={(e) => setTop({ includeBleed: e.target.checked })} />
                  Fond perdu de 3 mm à l’export
                </label>
              </div>

              <div className="rounded-container border border-border-subtle dark:border-border-dark p-3">
                <label className={labelCls}>Enregistrer comme design</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    className="ui-input"
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    placeholder="Nom du design"
                  />
                  <button type="button" disabled={busy} onClick={saveDesign} className="ui-btn ui-btn-secondary shrink-0">
                    {activeDesignId ? 'Mettre à jour' : 'Enregistrer'}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-text-muted-subtle dark:text-text-muted-subtle-dark">
                  Retrouvez vos designs dans « Mes designs » (onglet Modèles).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- ACTIONS ---------------- */}
      <div className="flex flex-wrap items-center gap-3">
        {!isPaid && (
          <button type="button" disabled={busy} onClick={handleUnlock} className="ui-btn bg-action dark:bg-action-dark text-white dark:text-[#04211d] hover:bg-action-hover dark:hover:bg-action-hover-dark">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Débloquer ma carte — {price ? `${price}€` : 'Chargement...'}
          </button>
        )}
        <button type="button" disabled={busy} onClick={saveLayout} className="ui-btn ui-btn-primary">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Enregistrer la mise en page
        </button>
        <button type="button" disabled={busy || !isPaid} onClick={downloadPng} className={`ui-btn ui-btn-secondary ${!isPaid ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Download className="w-4 h-4" /> PNG {activeSide === 'back' ? 'verso' : 'recto'} ({px.widthPx} × {px.heightPx} px)
        </button>
        <button type="button" disabled={busy || !isPaid} onClick={() => exportFile('pdf')} className={`ui-btn ui-btn-secondary ${!isPaid ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <FileText className="w-4 h-4" /> PDF
        </button>
        <button type="button" disabled={busy || !isPaid} onClick={() => exportFile('jpg')} className={`ui-btn ui-btn-secondary ${!isPaid ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <FileText className="w-4 h-4" /> JPG
        </button>
        {status && (
          <span className={`text-sm ${status.ok ? 'text-success-text dark:text-success-text-dark' : 'text-error-text dark:text-error-text-dark'}`}>
            {status.text}
          </span>
        )}
      </div>
      {!isPaid && (
        <div className="rounded-container bg-action/5 border border-action/20 p-4">
          <h4 className="text-sm font-semibold text-action dark:text-action-dark flex items-center gap-2">
            <Lock className="w-4 h-4" /> Votre carte est prête 🎉
          </h4>
          <p className="mt-1 text-xs text-text-secondary dark:text-text-secondary-dark">
            Débloquez votre carte professionnelle pour retirer le filigrane, activer le QR Code et accéder aux exports Haute Résolution (PNG HD, PDF, Impression).
          </p>
        </div>
      )}
    </div>
  );
}
