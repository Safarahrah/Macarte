// src/design/studio/DesignEditor.jsx
// Full editor built on the shared graphics engine. Module specifics (pages,
// folds, logo previews, format adaptation, video scenes) come from modules.js.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import DesignCanvas from '../engine/DesignCanvas';
import DesignSvg from '../engine/DesignSvg';
import useHistory from '../engine/useHistory';
import { adaptDocument, cloneElements, createElement, fitText } from '../engine/factory';
import { exportDocument, makeThumbnail, pagePreviewUrl, pixelSize } from '../engine/exporters';
import { unionBounds, round } from '../engine/geometry';
import { applyTemplate, getTemplates } from '../templates';
import { sanitizeDesignData, newId } from '../shared/sanitize';
import { DESIGN_FONTS } from '../shared/fonts';
import { ICON_GROUPS } from '../shared/icons';
import { allowsFreePages, getExports, getKind, getModule, SOCIAL_PLATFORMS } from '../shared/modules';
import { api, uploadImage, useSession } from './api';
import { Loading } from './StudioLayout';

const PT_MM = 0.352778;
const EXPORT_LABELS = {
  pdf: 'PDF (impression)', png: 'PNG', 'png-hd': 'PNG haute résolution', jpg: 'JPG', svg: 'SVG vectoriel', webm: 'Vidéo WebM'
};
const TEXT_PROPS = ['text', 'size', 'font', 'weight', 'italic', 'uppercase', 'lineHeight', 'letterSpacing', 'w'];

function isTyping(e) {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
}

// ---------- small form controls ----------
function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted dark:text-text-muted-dark">{label}</span>
      {children}
    </label>
  );
}
const inputCls = 'w-full rounded-md border border-border dark:border-border-dark bg-input-bg dark:bg-input-bg-dark px-2 py-1.5 text-sm text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-action/30';

function NumInput({ value, onChange, step = 1, min, max, suffix }) {
  const [draft, setDraft] = useState(null);
  const shown = draft !== null ? draft : (Number.isFinite(value) ? round(value, 2) : '');
  return (
    <span className="flex items-center rounded-md border border-border dark:border-border-dark bg-input-bg dark:bg-input-bg-dark">
      <input
        type="number" step={step} min={min} max={max} value={shown}
        onChange={(e) => { setDraft(e.target.value); const n = Number(e.target.value); if (e.target.value !== '' && Number.isFinite(n)) onChange(n); }}
        onBlur={() => setDraft(null)}
        className="w-full min-w-0 bg-transparent px-2 py-1.5 text-sm text-text-primary dark:text-text-primary-dark focus:outline-none"
      />
      {suffix && <span className="pr-2 text-[11px] text-text-muted">{suffix}</span>}
    </span>
  );
}

function ColorInput({ value, onChange, onCommit, allowTransparent }) {
  const transparent = value === 'transparent';
  return (
    <span className="flex items-center gap-1.5">
      <input
        type="color" value={transparent ? '#ffffff' : value}
        onChange={(e) => onChange(e.target.value)} onBlur={onCommit}
        className="h-8 w-10 cursor-pointer rounded border border-border dark:border-border-dark bg-transparent"
      />
      <input className={`${inputCls} font-mono text-xs`} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onCommit} />
      {allowTransparent && (
        <button type="button" title="Transparent" onClick={() => { onChange('transparent'); onCommit(); }}
          className={`h-8 w-8 shrink-0 rounded border ${transparent ? 'border-action ring-2 ring-action/30' : 'border-border dark:border-border-dark'}`}
          style={{ background: 'repeating-conic-gradient(#e5e7eb 0 25%, #fff 0 50%) 0 0/10px 10px' }} />
      )}
    </span>
  );
}

function IconBtn({ icon, title, onClick, active, disabled, testId }) {
  const C = Icons[icon];
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled} data-testid={testId}
      className={`rounded-md p-2 text-text-secondary dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-surface-dark disabled:opacity-40 ${active ? 'bg-action/10 text-action dark:text-action-dark' : ''}`}>
      <C className="h-4 w-4" />
    </button>
  );
}

// ---------- main editor ----------
export default function DesignEditor({ mod, id }) {
  const { user } = useSession();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const history = useHistory(null);
  const { doc, set, commit, undo, redo, reset } = history;
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(1);
  const [showGuides, setShowGuides] = useState(true);
  const [tab, setTab] = useState('elements');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [savedDoc, setSavedDoc] = useState(null);
  const [savedTitle, setSavedTitle] = useState('');
  const [modal, setModal] = useState(null);
  const [leftOpen, setLeftOpen] = useState(false);
  const stageRef = useRef(null);
  const textRef = useRef(null);
  const clipboard = useRef([]);
  const fileRef = useRef(null);
  const fileTarget = useRef(null);

  const type = mod.type;
  const subtype = project ? project.subtype : null;
  const dirty = Boolean(doc && savedDoc && (doc !== savedDoc || title !== savedTitle));

  // Load project
  useEffect(() => {
    if (!user) return;
    api('GET', `${mod.api}/${id}`)
      .then((p) => {
        const d = sanitizeDesignData(p.data, { type: p.type, subtype: p.subtype });
        setProject(p);
        setTitle(p.title);
        setSavedTitle(p.title);
        reset(d);
        setSavedDoc(d);
      })
      .catch((e) => setError(e.status === 404 ? 'Projet introuvable.' : e.status === 403 ? 'Vous n’avez pas accès à ce projet.' : e.message));
  }, [user, id, mod.api, reset]);

  useEffect(() => { if (title) document.title = `${title} · ${mod.label} · Macarte`; }, [title, mod.label]);

  // Fit to stage
  const docW = doc ? doc.width + 2 * (doc.bleed || 0) : 1;
  const docH = doc ? doc.height + 2 * (doc.bleed || 0) : 1;
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const compute = () => setFit(Math.max(0.01, Math.min((el.clientWidth - 64) / docW, (el.clientHeight - 64) / docH)));
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [docW, docH, project]);
  const scale = fit * zoom;

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const page = doc ? doc.pages[Math.min(pageIndex, doc.pages.length - 1)] : null;
  const selected = page ? page.elements.filter((e) => selectedIds.includes(e.id)) : [];
  const single = selected.length === 1 ? selected[0] : null;

  // ---------- document mutations ----------
  const setPage = useCallback((fn, transient = false) => {
    set((d) => ({ ...d, pages: d.pages.map((p, i) => (i === pageIndex ? fn(p) : p)) }), { transient });
  }, [set, pageIndex]);

  const setElements = useCallback((fn, transient = false) => setPage((p) => ({ ...p, elements: fn(p.elements) }), transient), [setPage]);

  const updateEl = useCallback((elId, patch, transient = false) => {
    setElements((els) => els.map((el) => {
      if (el.id !== elId) return el;
      const next = { ...el, ...patch };
      return next.type === 'text' && Object.keys(patch).some((k) => TEXT_PROPS.includes(k)) ? fitText(next) : next;
    }), transient);
  }, [setElements]);

  const updateSelected = (patch, transient = false) => {
    setElements((els) => els.map((el) => (selectedIds.includes(el.id) ? (el.type === 'text' ? fitText({ ...el, ...patch }) : { ...el, ...patch }) : el)), transient);
  };

  const addElement = (kind, extra) => {
    const el = createElement(kind, doc, extra);
    setElements((els) => [...els, el]);
    setSelectedIds([el.id]);
    return el;
  };

  const deleteSelected = useCallback(() => {
    if (!selectedIds.length) return;
    setElements((els) => els.filter((el) => !selectedIds.includes(el.id) || el.locked));
    setSelectedIds([]);
  }, [selectedIds, setElements]);

  const duplicateSelected = useCallback(() => {
    if (!selected.length || !doc) return;
    const copies = cloneElements(selected, Math.min(doc.width, doc.height) * 0.03);
    setElements((els) => [...els, ...copies]);
    setSelectedIds(copies.map((c) => c.id));
  }, [selected, doc, setElements]);

  const reorder = (dir) => {
    setElements((els) => {
      const list = [...els];
      if (dir === 'front' || dir === 'back') {
        const moving = list.filter((e) => selectedIds.includes(e.id));
        const rest = list.filter((e) => !selectedIds.includes(e.id));
        return dir === 'front' ? [...rest, ...moving] : [...moving, ...rest];
      }
      const idxs = list.map((e, i) => (selectedIds.includes(e.id) ? i : -1)).filter((i) => i >= 0);
      const ordered = dir === 'up' ? idxs.reverse() : idxs;
      ordered.forEach((i) => {
        const j = dir === 'up' ? i + 1 : i - 1;
        if (j < 0 || j >= list.length || selectedIds.includes(list[j].id)) return;
        [list[i], list[j]] = [list[j], list[i]];
      });
      return list;
    });
  };

  const align = (mode) => {
    if (!selected.length) return;
    const box = selected.length > 1 ? unionBounds(selected) : { x: 0, y: 0, w: doc.width, h: doc.height };
    setElements((els) => els.map((el) => {
      if (!selectedIds.includes(el.id) || el.locked) return el;
      const b = unionBounds([el]);
      const dx = { left: box.x - b.x, center: box.x + box.w / 2 - (b.x + b.w / 2), right: box.x + box.w - (b.x + b.w) }[mode];
      const dy = { top: box.y - b.y, middle: box.y + box.h / 2 - (b.y + b.h / 2), bottom: box.y + box.h - (b.y + b.h) }[mode];
      return { ...el, x: el.x + (dx || 0), y: el.y + (dy || 0) };
    }));
  };

  const distribute = (axis) => {
    if (selected.length < 3) return;
    const sorted = [...selected].sort((a, b) => (axis === 'h' ? a.x - b.x : a.y - b.y));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const span = axis === 'h' ? (last.x - first.x) : (last.y - first.y);
    const step = span / (sorted.length - 1);
    const pos = {};
    sorted.forEach((el, i) => { pos[el.id] = (axis === 'h' ? first.x : first.y) + step * i; });
    setElements((els) => els.map((el) => (pos[el.id] === undefined ? el : axis === 'h' ? { ...el, x: pos[el.id] } : { ...el, y: pos[el.id] })));
  };

  // ---------- pages ----------
  const freePages = allowsFreePages(type, subtype);
  const addPage = (name) => {
    set((d) => ({ ...d, pages: [...d.pages, { id: newId('pg'), name: name || `Page ${d.pages.length + 1}`, background: { ...d.pages[d.pages.length - 1].background }, elements: [] }] }));
    setPageIndex(doc.pages.length);
    setSelectedIds([]);
  };
  const duplicatePage = () => {
    set((d) => {
      const copy = { ...page, id: newId('pg'), name: `${page.name} (copie)`, elements: cloneElements(page.elements, 0) };
      const pages = [...d.pages];
      pages.splice(pageIndex + 1, 0, copy);
      return { ...d, pages };
    });
    setPageIndex(pageIndex + 1);
  };
  const removePage = () => {
    if (doc.pages.length < 2) return;
    set((d) => ({ ...d, pages: d.pages.filter((_, i) => i !== pageIndex) }));
    setPageIndex(Math.max(0, pageIndex - 1));
    setSelectedIds([]);
  };
  const movePage = (dir) => {
    const j = pageIndex + dir;
    if (j < 0 || j >= doc.pages.length) return;
    set((d) => { const pages = [...d.pages]; [pages[pageIndex], pages[j]] = [pages[j], pages[pageIndex]]; return { ...d, pages }; });
    setPageIndex(j);
  };

  // ---------- save ----------
  const save = useCallback(async () => {
    if (!doc || saving) return;
    setSaving(true);
    setStatus(null);
    try {
      let thumbnail;
      try { thumbnail = await makeThumbnail(doc); } catch (e) { thumbnail = undefined; }
      const saved = await api('PUT', `${mod.api}/${id}`, { title: title.trim() || project.title, data: doc, thumbnail });
      setProject(saved);
      setSavedDoc(doc);
      setSavedTitle(title);
      setStatus({ ok: true, text: 'Enregistré' });
    } catch (e) {
      setStatus({ ok: false, text: e.message });
    } finally {
      setSaving(false);
    }
  }, [doc, saving, mod.api, id, title, project]);

  // ---------- keyboard ----------
  useEffect(() => {
    const onKey = (e) => {
      const mod1 = e.ctrlKey || e.metaKey;
      if (mod1 && e.key.toLowerCase() === 's') { e.preventDefault(); save(); return; }
      if (isTyping(e)) return;
      if (mod1 && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod1 && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      if (!page) return;
      if (mod1 && e.key.toLowerCase() === 'a') { e.preventDefault(); setSelectedIds(page.elements.filter((x) => !x.locked && !x.hidden).map((x) => x.id)); return; }
      if (mod1 && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected(); return; }
      if (mod1 && e.key.toLowerCase() === 'c') { clipboard.current = selected; return; }
      if (mod1 && e.key.toLowerCase() === 'v' && clipboard.current.length) {
        const copies = cloneElements(clipboard.current, Math.min(doc.width, doc.height) * 0.03);
        setElements((els) => [...els, ...copies]);
        setSelectedIds(copies.map((c) => c.id));
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); return; }
      if (e.key === 'Escape') { setSelectedIds([]); return; }
      const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (arrows[e.key] && selectedIds.length) {
        e.preventDefault();
        const stepBase = doc.unit === 'mm' ? 0.5 : 1;
        const step = e.shiftKey ? stepBase * 10 : stepBase;
        const [dx, dy] = arrows[e.key];
        setElements((els) => els.map((el) => (selectedIds.includes(el.id) && !el.locked ? { ...el, x: el.x + dx * step, y: el.y + dy * step } : el)));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, undo, redo, page, selected, selectedIds, doc, deleteSelected, duplicateSelected, setElements]);

  // ctrl + wheel zoom
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => Math.min(8, Math.max(0.1, z * (e.deltaY < 0 ? 1.1 : 1 / 1.1))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [project]);

  // ---------- images ----------
  const pickImage = (target) => { fileTarget.current = target; fileRef.current.click(); };
  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setStatus({ ok: false, text: 'Image trop lourde (5 Mo max).' }); return; }
    setStatus({ ok: true, text: 'Envoi de l’image…' });
    try {
      const res = await uploadImage(file);
      const target = fileTarget.current;
      if (target === 'background') {
        setPage((p) => ({ ...p, background: { ...p.background, image: res.url } }));
      } else if (target && target !== 'new') {
        updateEl(target, { src: res.url });
      } else {
        const ratio = res.width && res.height ? res.height / res.width : 1;
        const w = Math.min(doc.width, doc.height) * 0.5;
        addElement('image', { src: res.url, w, h: w * ratio, x: (doc.width - w) / 2, y: (doc.height - w * ratio) / 2 });
      }
      setStatus({ ok: true, text: 'Image ajoutée' });
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-main dark:bg-main-dark text-text-primary dark:text-text-primary-dark">
        <p>{error}</p>
        <button type="button" className="ui-btn ui-btn-primary" onClick={() => navigate(`/studio/${mod.slug}`)}>Retour à la bibliothèque</button>
      </div>
    );
  }
  if (!doc || !project) return <Loading label="Ouverture du projet…" />;

  const unitLabel = doc.unit;
  const sizeLabel = doc.unit === 'mm' ? 'pt' : 'px';
  const toSizeUi = (v) => (doc.unit === 'mm' ? v / PT_MM : v);
  const fromSizeUi = (v) => (doc.unit === 'mm' ? v * PT_MM : v);
  const exports = getExports(type, subtype);
  const kind = getKind(subtype);

  const leftTabs = [
    { id: 'templates', label: 'Modèles', icon: 'LayoutTemplate' },
    { id: 'elements', label: 'Éléments', icon: 'Shapes' },
    { id: 'icons', label: 'Symboles', icon: 'Star' },
    { id: 'images', label: 'Images', icon: 'Image' },
    { id: 'layers', label: 'Calques', icon: 'Layers' },
    { id: 'document', label: 'Document', icon: 'Settings2' }
  ];

  return (
    <div className="flex h-screen flex-col bg-main dark:bg-main-dark text-text-primary dark:text-text-primary-dark">
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onFile} />
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-1 border-b border-border dark:border-border-dark bg-card dark:bg-card-dark px-2 py-1.5">
        <IconBtn icon="ArrowLeft" title="Retour à la bibliothèque" onClick={() => { if (!dirty || window.confirm('Quitter sans enregistrer les modifications ?')) navigate(`/studio/${mod.slug}`); }} />
        <IconBtn icon="PanelLeft" title="Outils" onClick={() => setLeftOpen((v) => !v)} active={leftOpen} />
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="min-w-[8rem] max-w-[14rem] flex-1 rounded-md bg-transparent px-2 py-1 text-sm font-semibold hover:bg-surface focus:bg-surface dark:hover:bg-surface-dark focus:outline-none" aria-label="Nom du projet" data-testid="design-title" />
        <span className="hidden text-xs text-text-muted md:inline">{mod.label}{kind ? ` · ${kind.label}` : ''} · {round(doc.width, 1)} × {round(doc.height, 1)} {unitLabel}</span>
        <div className="mx-auto" />
        <IconBtn icon="Undo2" title="Annuler (Ctrl+Z)" onClick={undo} disabled={!history.canUndo} testId="undo" />
        <IconBtn icon="Redo2" title="Rétablir (Ctrl+Y)" onClick={redo} disabled={!history.canRedo} testId="redo" />
        <span className="mx-1 h-5 w-px bg-border dark:bg-border-dark" />
        <IconBtn icon="ZoomOut" title="Zoom arrière" onClick={() => setZoom((z) => Math.max(0.1, z / 1.25))} />
        <button type="button" className="w-14 rounded-md py-1 text-xs hover:bg-surface dark:hover:bg-surface-dark" onClick={() => setZoom(1)} title="Ajuster à l’écran">{Math.round(zoom * 100)}%</button>
        <IconBtn icon="ZoomIn" title="Zoom avant" onClick={() => setZoom((z) => Math.min(8, z * 1.25))} />
        <IconBtn icon="Ruler" title="Repères (fond perdu, marges, plis)" onClick={() => setShowGuides((v) => !v)} active={showGuides} />
        {type === 'pocket' && <IconBtn icon="BookOpen" title="Aperçu du pliage" onClick={() => setModal('fold')} />}
        {type === 'logo' && <IconBtn icon="Eye" title="Aperçu sur différents fonds" onClick={() => setModal('logo')} />}
        <span className="mx-1 h-5 w-px bg-border dark:bg-border-dark" />
        {status && <span className={`hidden text-xs sm:inline ${status.ok ? 'text-success-text dark:text-success-text-dark' : 'text-error-text'}`}>{status.text}</span>}
        {dirty && !status && <span className="hidden text-xs text-text-muted sm:inline">Modifications non enregistrées</span>}
        <button type="button" className="ui-btn ui-btn-secondary text-sm" onClick={() => setModal('export')} data-testid="open-export"><Icons.Download className="h-4 w-4" /><span className="hidden sm:inline">Exporter</span></button>
        <button type="button" className="ui-btn ui-btn-primary text-sm" onClick={save} disabled={saving} data-testid="save-design">
          {saving ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : <Icons.Save className="h-4 w-4" />}<span className="hidden sm:inline">Enregistrer</span>
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Left panel */}
        <aside className={`${leftOpen ? 'flex' : 'hidden'} lg:flex absolute inset-y-0 left-0 z-20 w-[19rem] flex-col border-r border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-xl lg:static lg:shadow-none`}>
          <div className="grid grid-cols-6 border-b border-border dark:border-border-dark">
            {leftTabs.map((t) => {
              const C = Icons[t.icon];
              return (
                <button key={t.id} type="button" onClick={() => setTab(t.id)} title={t.label} data-testid={`tab-${t.id}`}
                  className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${tab === t.id ? 'text-action dark:text-action-dark border-b-2 border-action' : 'text-text-muted dark:text-text-muted-dark'}`}>
                  <C className="h-4 w-4" />{t.label}
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {tab === 'templates' && <TemplatesPanel doc={doc} type={type} subtype={subtype} onApply={(t) => {
              if (page.elements.length && !window.confirm('Remplacer le contenu actuel par ce modèle ?')) return;
              set((d) => applyTemplate(d, t, { type, subtype, allowExtraPages: freePages }));
              setSelectedIds([]);
            }} />}
            {tab === 'elements' && (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold text-text-muted">Texte</p>
                  <div className="space-y-1.5">
                    <button type="button" className="w-full rounded-md border border-border dark:border-border-dark px-3 py-2 text-left text-lg font-bold hover:border-action" onClick={() => addElement('text:heading')} data-testid="add-heading">Ajouter un titre</button>
                    <button type="button" className="w-full rounded-md border border-border dark:border-border-dark px-3 py-2 text-left font-semibold hover:border-action" onClick={() => addElement('text:subheading')}>Ajouter un sous-titre</button>
                    <button type="button" className="w-full rounded-md border border-border dark:border-border-dark px-3 py-2 text-left text-sm hover:border-action" onClick={() => addElement('text:body')}>Ajouter un paragraphe</button>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-text-muted">Formes</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[['rect', 'Square', 'Rectangle'], ['ellipse', 'Circle', 'Cercle'], ['triangle', 'Triangle', 'Triangle'], ['star', 'Star', 'Étoile'], ['line', 'Minus', 'Ligne'], ['qr', 'QrCode', 'QR code']].map(([k, ic, label]) => {
                      const C = Icons[ic];
                      return (
                        <button key={k} type="button" title={label} onClick={() => addElement(k)} data-testid={`add-${k}`}
                          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-border dark:border-border-dark text-[10px] hover:border-action">
                          <C className="h-5 w-5" />{label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {tab === 'icons' && <IconsPanel onPick={(name) => addElement('icon', { icon: name, color: doc.meta.brandColor || '#111111' })} />}
            {tab === 'images' && (
              <div className="space-y-3">
                <button type="button" className="ui-btn ui-btn-primary w-full" onClick={() => pickImage('new')} data-testid="upload-image"><Icons.Upload className="h-4 w-4" /> Importer une image / un logo</button>
                <p className="text-xs text-text-muted">PNG, JPG, WebP ou GIF · 5 Mo maximum. Les images sont vérifiées côté serveur.</p>
                <button type="button" className="ui-btn ui-btn-secondary w-full" onClick={() => addElement('image')}><Icons.ImagePlus className="h-4 w-4" /> Emplacement d’image</button>
                <UsedImages doc={doc} onPick={(src) => addElement('image', { src })} />
              </div>
            )}
            {tab === 'layers' && (
              <LayersPanel
                page={page} selectedIds={selectedIds}
                onSelect={(elId, add) => setSelectedIds(add ? (selectedIds.includes(elId) ? selectedIds.filter((x) => x !== elId) : [...selectedIds, elId]) : [elId])}
                onToggle={(elId, key) => { const el = page.elements.find((x) => x.id === elId); updateEl(elId, { [key]: !el[key] }); }}
                onMove={(elId, dir) => { setSelectedIds([elId]); setElements((els) => { const i = els.findIndex((x) => x.id === elId); const j = i + dir; if (j < 0 || j >= els.length) return els; const l = [...els]; [l[i], l[j]] = [l[j], l[i]]; return l; }); }}
              />
            )}
            {tab === 'document' && (
              <DocumentPanel
                doc={doc} mod={mod} type={type} subtype={subtype} page={page} pageIndex={pageIndex}
                setDoc={(fn) => set(fn)} setPage={setPage} commit={commit}
                onBackgroundImage={() => pickImage('background')}
                onAdaptCopy={async (format) => {
                  try {
                    const adapted = adaptDocument(doc, format);
                    const created = await api('POST', mod.api, { title: `${title} – ${format.label}`.slice(0, 120), subtype, format: format.id, data: adapted });
                    navigate(`/studio/${mod.slug}/${created.id}`);
                  } catch (e) { setStatus({ ok: false, text: e.message }); }
                }}
                onResize={(format) => { set((d) => adaptDocument(d, format)); setSelectedIds([]); }}
              />
            )}
          </div>
        </aside>

        {/* Stage */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div ref={stageRef} className="relative flex-1 overflow-auto bg-surface dark:bg-surface-dark" onPointerDown={(e) => { if (e.target === e.currentTarget) setSelectedIds([]); }}>
            <div className="flex min-h-full min-w-full items-center justify-center p-8" style={{ width: docW * scale + 64, height: docH * scale + 64 }} onPointerDown={(e) => { if (e.target === e.currentTarget) setSelectedIds([]); }}>
              <DesignCanvas
                doc={doc}
                pageIndex={Math.min(pageIndex, doc.pages.length - 1)}
                selectedIds={selectedIds}
                onSelect={setSelectedIds}
                onElementsChange={(fn, transient) => setElements(fn, transient)}
                onCommit={commit}
                scale={scale}
                showGuides={showGuides}
                onEditText={() => setTimeout(() => textRef.current && textRef.current.focus(), 0)}
              />
            </div>
          </div>
          {/* Pages bar */}
          <div className="flex items-center gap-1 overflow-x-auto border-t border-border dark:border-border-dark bg-card dark:bg-card-dark px-2 py-1.5">
            {doc.pages.map((p, i) => (
              <button key={p.id} type="button" onClick={() => { setPageIndex(i); setSelectedIds([]); }} data-testid={`page-${i}`}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${i === pageIndex ? 'bg-action text-white' : 'text-text-secondary dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-surface-dark'}`}>
                {p.name}
              </button>
            ))}
            {freePages && (
              <>
                <IconBtn icon="Plus" title="Ajouter une page" onClick={() => addPage()} testId="add-page" />
                <IconBtn icon="Copy" title="Dupliquer la page" onClick={duplicatePage} />
                <IconBtn icon="ChevronLeft" title="Déplacer à gauche" onClick={() => movePage(-1)} disabled={pageIndex === 0} />
                <IconBtn icon="ChevronRight" title="Déplacer à droite" onClick={() => movePage(1)} disabled={pageIndex === doc.pages.length - 1} />
                <IconBtn icon="Trash2" title="Supprimer la page" onClick={removePage} disabled={doc.pages.length < 2} />
              </>
            )}
            {!freePages && mod.optionalBack && (
              doc.pages.length === 1
                ? <button type="button" className="ml-2 text-xs text-action" onClick={() => addPage('Verso')} data-testid="add-back">+ Ajouter un verso</button>
                : <button type="button" className="ml-2 text-xs text-error-text" onClick={() => { setPageIndex(0); set((d) => ({ ...d, pages: d.pages.slice(0, 1) })); }}>Supprimer le verso</button>
            )}
          </div>
        </div>

        {/* Right panel */}
        {selected.length > 0 && (
          <aside className="absolute inset-y-0 right-0 z-20 w-[17rem] overflow-y-auto border-l border-border dark:border-border-dark bg-card dark:bg-card-dark p-3 shadow-xl xl:static xl:shadow-none" data-testid="properties">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">{single ? ELEMENT_LABELS[single.type] : `${selected.length} éléments`}</p>
              <IconBtn icon="X" title="Désélectionner" onClick={() => setSelectedIds([])} />
            </div>
            <div className="mb-3 flex flex-wrap gap-0.5 rounded-md bg-surface dark:bg-surface-dark p-1">
              <IconBtn icon="Copy" title="Dupliquer (Ctrl+D)" onClick={duplicateSelected} testId="duplicate-element" />
              <IconBtn icon="Trash2" title="Supprimer (Suppr)" onClick={deleteSelected} testId="delete-element" />
              <IconBtn icon="BringToFront" title="Premier plan" onClick={() => reorder('front')} />
              <IconBtn icon="ArrowUp" title="Avancer" onClick={() => reorder('up')} />
              <IconBtn icon="ArrowDown" title="Reculer" onClick={() => reorder('down')} />
              <IconBtn icon="SendToBack" title="Arrière-plan" onClick={() => reorder('back')} />
              {single && <IconBtn icon={single.locked ? 'Lock' : 'Unlock'} title={single.locked ? 'Déverrouiller' : 'Verrouiller'} onClick={() => updateEl(single.id, { locked: !single.locked })} active={single.locked} />}
            </div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">{selected.length > 1 ? 'Aligner la sélection' : 'Aligner sur la page'}</p>
            <div className="mb-3 flex flex-wrap gap-0.5">
              <IconBtn icon="AlignStartVertical" title="Gauche" onClick={() => align('left')} />
              <IconBtn icon="AlignCenterVertical" title="Centre horizontal" onClick={() => align('center')} testId="align-center" />
              <IconBtn icon="AlignEndVertical" title="Droite" onClick={() => align('right')} />
              <IconBtn icon="AlignStartHorizontal" title="Haut" onClick={() => align('top')} />
              <IconBtn icon="AlignCenterHorizontal" title="Milieu vertical" onClick={() => align('middle')} />
              <IconBtn icon="AlignEndHorizontal" title="Bas" onClick={() => align('bottom')} />
              {selected.length > 2 && <IconBtn icon="AlignHorizontalSpaceAround" title="Répartir horizontalement" onClick={() => distribute('h')} />}
              {selected.length > 2 && <IconBtn icon="AlignVerticalSpaceAround" title="Répartir verticalement" onClick={() => distribute('v')} />}
            </div>
            {single && (
              <ElementProperties
                el={single} unit={unitLabel} sizeLabel={sizeLabel} toSizeUi={toSizeUi} fromSizeUi={fromSizeUi}
                update={(patch, transient) => updateEl(single.id, patch, transient)} commit={commit} textRef={textRef}
                onReplaceImage={() => pickImage(single.id)}
              />
            )}
            {!single && (
              <div className="space-y-3">
                <Field label="Opacité"><input type="range" min="0" max="1" step="0.05" value={selected[0].opacity} onChange={(e) => updateSelected({ opacity: Number(e.target.value) }, true)} onPointerUp={commit} className="w-full" /></Field>
              </div>
            )}
          </aside>
        )}
      </div>

      {modal === 'export' && <ExportDialog doc={doc} type={type} exports={exports} title={title} pageIndex={pageIndex} mod={mod} onClose={() => setModal(null)} />}
      {modal === 'fold' && <FoldPreview doc={doc} onClose={() => setModal(null)} />}
      {modal === 'logo' && (
        <LogoPreview
          doc={doc}
          onClose={() => setModal(null)}
          onVariant={async (variant) => {
            try {
              const data = makeLogoVariant(doc, variant);
              const created = await api('POST', mod.api, { title: `${title} – ${variant === 'mono-dark' ? 'monochrome' : 'négatif'}`.slice(0, 120), data, format: doc.formatId });
              setModal(null);
              navigate(`/studio/${mod.slug}/${created.id}`);
            } catch (e) { setStatus({ ok: false, text: e.message }); }
          }}
        />
      )}
    </div>
  );
}

const ELEMENT_LABELS = { text: 'Texte', rect: 'Rectangle', ellipse: 'Cercle / ellipse', triangle: 'Triangle', star: 'Étoile', line: 'Ligne', icon: 'Symbole', image: 'Image', qr: 'QR code' };

function ElementProperties({ el, unit, sizeLabel, toSizeUi, fromSizeUi, update, commit, textRef, onReplaceImage }) {
  return (
    <div className="space-y-3">
      {el.type === 'text' && (
        <>
          <Field label="Texte">
            <textarea ref={textRef} rows={4} className={inputCls} value={el.text} onChange={(e) => update({ text: e.target.value })} data-testid="text-input" />
          </Field>
          <Field label="Police">
            <select className={inputCls} value={el.font} onChange={(e) => update({ font: e.target.value })}>
              {Object.values(DESIGN_FONTS).map((f) => <option key={f.id} value={f.id} style={{ fontFamily: f.css }}>{f.label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={`Taille (${sizeLabel})`}><NumInput value={toSizeUi(el.size)} step={1} min={1} onChange={(v) => update({ size: fromSizeUi(Math.max(1, v)) })} /></Field>
            <Field label="Graisse">
              <select className={inputCls} value={el.weight} onChange={(e) => update({ weight: Number(e.target.value) })}>
                {[300, 400, 500, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-0.5">
            <IconBtn icon="Bold" title="Gras" active={el.weight >= 700} onClick={() => update({ weight: el.weight >= 700 ? 400 : 700 })} />
            <IconBtn icon="Italic" title="Italique" active={el.italic} onClick={() => update({ italic: !el.italic })} />
            <IconBtn icon="Underline" title="Souligné" active={el.underline} onClick={() => update({ underline: !el.underline })} />
            <IconBtn icon="CaseUpper" title="Majuscules" active={el.uppercase} onClick={() => update({ uppercase: !el.uppercase })} />
            <IconBtn icon="AlignLeft" title="Aligner à gauche" active={el.align === 'left'} onClick={() => update({ align: 'left' })} />
            <IconBtn icon="AlignCenter" title="Centrer" active={el.align === 'center'} onClick={() => update({ align: 'center' })} />
            <IconBtn icon="AlignRight" title="Aligner à droite" active={el.align === 'right'} onClick={() => update({ align: 'right' })} />
          </div>
          <Field label="Couleur"><ColorInput value={el.color} onChange={(v) => update({ color: v }, true)} onCommit={commit} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Interligne"><NumInput value={el.lineHeight} step={0.1} min={0.5} max={4} onChange={(v) => update({ lineHeight: v })} /></Field>
            <Field label="Espacement"><NumInput value={el.letterSpacing} step={0.01} min={-0.5} max={2} onChange={(v) => update({ letterSpacing: v })} suffix="em" /></Field>
          </div>
        </>
      )}
      {['rect', 'ellipse', 'triangle', 'star'].includes(el.type) && (
        <>
          <Field label="Remplissage"><ColorInput value={el.fill} onChange={(v) => update({ fill: v }, true)} onCommit={commit} allowTransparent /></Field>
          <Field label="Contour"><ColorInput value={el.stroke} onChange={(v) => update({ stroke: v, strokeWidth: el.strokeWidth || Math.min(el.w, el.h) * 0.02 }, true)} onCommit={commit} allowTransparent /></Field>
          <Field label={`Épaisseur du contour (${unit})`}><NumInput value={el.strokeWidth} step={0.1} min={0} onChange={(v) => update({ strokeWidth: Math.max(0, v) })} /></Field>
          {el.type === 'rect' && <Field label={`Arrondi (${unit})`}><NumInput value={el.radius} step={0.5} min={0} onChange={(v) => update({ radius: Math.max(0, v) })} /></Field>}
          {el.type === 'star' && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Branches"><NumInput value={el.points} step={1} min={3} max={16} onChange={(v) => update({ points: Math.round(v) })} /></Field>
              <Field label="Creux"><NumInput value={el.innerRatio} step={0.05} min={0.1} max={0.95} onChange={(v) => update({ innerRatio: v })} /></Field>
            </div>
          )}
        </>
      )}
      {el.type === 'line' && (
        <>
          <Field label="Couleur"><ColorInput value={el.stroke} onChange={(v) => update({ stroke: v }, true)} onCommit={commit} /></Field>
          <Field label={`Épaisseur (${unit})`}><NumInput value={el.strokeWidth} step={0.1} min={0.05} onChange={(v) => update({ strokeWidth: Math.max(0.05, v), h: Math.max(el.h, v * 3) })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={el.dash} onChange={(e) => update({ dash: e.target.checked })} /> Pointillés</label>
        </>
      )}
      {el.type === 'icon' && (
        <>
          <Field label="Symbole">
            <select className={inputCls} value={el.icon} onChange={(e) => update({ icon: e.target.value })}>
              {ICON_GROUPS.map((g) => <optgroup key={g.id} label={g.label}>{g.icons.map((n) => <option key={n} value={n}>{n}</option>)}</optgroup>)}
            </select>
          </Field>
          <Field label="Couleur du trait"><ColorInput value={el.color} onChange={(v) => update({ color: v }, true)} onCommit={commit} /></Field>
          <Field label="Remplissage"><ColorInput value={el.fill} onChange={(v) => update({ fill: v }, true)} onCommit={commit} allowTransparent /></Field>
          <Field label="Épaisseur du trait"><input type="range" min="0.25" max="4" step="0.25" value={el.strokeWidth} onChange={(e) => update({ strokeWidth: Number(e.target.value) }, true)} onPointerUp={commit} className="w-full" /></Field>
        </>
      )}
      {el.type === 'image' && (
        <>
          <button type="button" className="ui-btn ui-btn-secondary w-full text-sm" onClick={onReplaceImage}><Icons.Upload className="h-4 w-4" /> {el.src ? 'Remplacer l’image' : 'Choisir une image'}</button>
          <Field label="Ajustement">
            <select className={inputCls} value={el.fit} onChange={(e) => update({ fit: e.target.value })}>
              <option value="cover">Remplir (recadrer)</option><option value="contain">Contenir (entière)</option>
            </select>
          </Field>
          <Field label={`Arrondi (${unit})`}><NumInput value={el.radius} step={0.5} min={0} onChange={(v) => update({ radius: Math.max(0, v) })} /></Field>
        </>
      )}
      {el.type === 'qr' && (
        <>
          <Field label="Contenu (URL, texte…)"><textarea rows={3} className={inputCls} value={el.value} onChange={(e) => update({ value: e.target.value.slice(0, 1000) })} data-testid="qr-input" /></Field>
          <Field label="Couleur"><ColorInput value={el.color} onChange={(v) => update({ color: v }, true)} onCommit={commit} /></Field>
          <Field label="Fond"><ColorInput value={el.background} onChange={(v) => update({ background: v }, true)} onCommit={commit} allowTransparent /></Field>
        </>
      )}
      <div className="border-t border-border dark:border-border-dark pt-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label={`X (${unit})`}><NumInput value={el.x} step={unit === 'mm' ? 0.5 : 1} onChange={(v) => update({ x: v })} /></Field>
          <Field label={`Y (${unit})`}><NumInput value={el.y} step={unit === 'mm' ? 0.5 : 1} onChange={(v) => update({ y: v })} /></Field>
          <Field label={`Largeur (${unit})`}><NumInput value={el.w} step={unit === 'mm' ? 0.5 : 1} min={0.1} onChange={(v) => update({ w: Math.max(0.1, v) })} /></Field>
          <Field label={`Hauteur (${unit})`}><NumInput value={el.h} step={unit === 'mm' ? 0.5 : 1} min={0.1} onChange={(v) => update({ h: Math.max(0.1, v) })} /></Field>
          <Field label="Rotation (°)"><NumInput value={el.rotation} step={1} min={-360} max={360} onChange={(v) => update({ rotation: v })} /></Field>
          <Field label="Opacité (%)"><NumInput value={Math.round(el.opacity * 100)} step={5} min={0} max={100} onChange={(v) => update({ opacity: Math.min(1, Math.max(0, v / 100)) })} /></Field>
        </div>
      </div>
    </div>
  );
}

function TemplatesPanel({ doc, type, subtype, onApply }) {
  const templates = useMemo(() => getTemplates(type, subtype), [type, subtype]);
  const [q, setQ] = useState('');
  const previews = useMemo(() => templates
    .filter((t) => !q || [t.name, ...(t.tags || [])].join(' ').toLowerCase().includes(q.toLowerCase()))
    .map((t) => ({ t, doc: applyTemplate({ ...doc, pages: [doc.pages[0]] }, t, { type, subtype }) })), [templates, doc.width, doc.height, q]);
  return (
    <div className="space-y-3">
      <input className={inputCls} placeholder={type === 'logo' ? 'Rechercher (secteur, style…)' : 'Rechercher un modèle'} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        {previews.map(({ t, doc: d }) => (
          <button key={t.id} type="button" onClick={() => onApply(t)} className="overflow-hidden rounded-md border border-border dark:border-border-dark text-left hover:border-action" data-testid={`apply-${t.id}`}>
            <div className="flex aspect-square items-center justify-center bg-surface dark:bg-surface-dark p-1.5">
              <DesignSvg doc={d} uid={`tp${t.id}`.replace(/[^a-zA-Z0-9]/g, '')} width="100%" height="100%" style={{ maxWidth: '100%', maxHeight: '100%' }} />
            </div>
            <p className="truncate px-1.5 py-1 text-[11px]">{t.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function IconsPanel({ onPick }) {
  const [q, setQ] = useState('');
  return (
    <div className="space-y-3">
      <input className={inputCls} placeholder="Rechercher un symbole (ex. Coffee)" value={q} onChange={(e) => setQ(e.target.value)} />
      {ICON_GROUPS.map((g) => {
        const list = g.icons.filter((n) => !q || n.toLowerCase().includes(q.toLowerCase()) || g.label.toLowerCase().includes(q.toLowerCase()));
        if (!list.length) return null;
        return (
          <div key={g.id}>
            <p className="mb-1.5 text-xs font-semibold text-text-muted">{g.label}</p>
            <div className="grid grid-cols-6 gap-1">
              {list.map((n) => {
                const C = Icons[n];
                return <button key={n} type="button" title={n} onClick={() => onPick(n)} className="flex aspect-square items-center justify-center rounded-md hover:bg-surface dark:hover:bg-surface-dark" data-testid={`icon-${n}`}><C className="h-5 w-5" /></button>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UsedImages({ doc, onPick }) {
  const srcs = [...new Set(doc.pages.flatMap((p) => p.elements.filter((e) => e.type === 'image' && e.src).map((e) => e.src)))];
  if (!srcs.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-text-muted">Images du projet</p>
      <div className="grid grid-cols-3 gap-1.5">
        {srcs.map((s) => <button key={s} type="button" onClick={() => onPick(s)} className="aspect-square overflow-hidden rounded-md border border-border dark:border-border-dark"><img src={s} alt="" className="h-full w-full object-cover" /></button>)}
      </div>
    </div>
  );
}

function LayersPanel({ page, selectedIds, onSelect, onToggle, onMove }) {
  const list = [...page.elements].reverse();
  if (!list.length) return <p className="text-sm text-text-muted">Aucun calque sur cette page.</p>;
  return (
    <ul className="space-y-1" data-testid="layers">
      {list.map((el) => {
        const label = el.name || (el.type === 'text' ? el.text.slice(0, 24) : el.type === 'icon' ? el.icon : ELEMENT_LABELS[el.type]);
        return (
          <li key={el.id} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${selectedIds.includes(el.id) ? 'bg-action/10 text-action dark:text-action-dark' : 'hover:bg-surface dark:hover:bg-surface-dark'}`}>
            <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={(e) => onSelect(el.id, e.shiftKey)}>{label || ELEMENT_LABELS[el.type]}</button>
            <button type="button" title="Monter" onClick={() => onMove(el.id, 1)}><Icons.ChevronUp className="h-3.5 w-3.5" /></button>
            <button type="button" title="Descendre" onClick={() => onMove(el.id, -1)}><Icons.ChevronDown className="h-3.5 w-3.5" /></button>
            <button type="button" title={el.hidden ? 'Afficher' : 'Masquer'} onClick={() => onToggle(el.id, 'hidden')}>{el.hidden ? <Icons.EyeOff className="h-3.5 w-3.5" /> : <Icons.Eye className="h-3.5 w-3.5" />}</button>
            <button type="button" title={el.locked ? 'Déverrouiller' : 'Verrouiller'} onClick={() => onToggle(el.id, 'locked')}>{el.locked ? <Icons.Lock className="h-3.5 w-3.5" /> : <Icons.Unlock className="h-3.5 w-3.5 opacity-40" />}</button>
          </li>
        );
      })}
    </ul>
  );
}

function DocumentPanel({ doc, mod, type, subtype, page, setDoc, setPage, commit, onBackgroundImage, onAdaptCopy, onResize }) {
  const bgc = page.background || { color: '#ffffff' };
  const [custom, setCustom] = useState({ width: round(doc.width, 1), height: round(doc.height, 1) });
  const formats = type === 'other' && getKind(subtype) ? getKind(subtype).formats : mod.formats;
  const sameUnit = formats.filter((f) => f.unit === doc.unit);
  return (
    <div className="space-y-5 text-sm">
      <section className="space-y-2">
        <p className="text-xs font-semibold text-text-muted">Arrière-plan de « {page.name} »</p>
        <ColorInput value={bgc.color} allowTransparent onChange={(v) => setPage((p) => ({ ...p, background: { ...p.background, color: v, gradient: undefined } }), true)} onCommit={commit} />
        <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(bgc.gradient)} onChange={(e) => setPage((p) => ({ ...p, background: { ...p.background, color: p.background.color === 'transparent' ? '#ffffff' : p.background.color, gradient: e.target.checked ? { from: p.background.color === 'transparent' ? '#ffffff' : p.background.color, to: '#4f46e5', angle: 135 } : undefined } }))} /> Dégradé</label>
        {bgc.gradient && (
          <div className="space-y-2 pl-1">
            <ColorInput value={bgc.gradient.from} onChange={(v) => setPage((p) => ({ ...p, background: { ...p.background, gradient: { ...p.background.gradient, from: v } } }), true)} onCommit={commit} />
            <ColorInput value={bgc.gradient.to} onChange={(v) => setPage((p) => ({ ...p, background: { ...p.background, gradient: { ...p.background.gradient, to: v } } }), true)} onCommit={commit} />
            <input type="range" min="0" max="360" value={bgc.gradient.angle} className="w-full" onChange={(e) => setPage((p) => ({ ...p, background: { ...p.background, gradient: { ...p.background.gradient, angle: Number(e.target.value) } } }), true)} onPointerUp={commit} />
          </div>
        )}
        <div className="flex gap-2">
          <button type="button" className="ui-btn ui-btn-secondary flex-1 text-xs" onClick={onBackgroundImage}><Icons.Image className="h-3.5 w-3.5" /> Image de fond</button>
          {bgc.image && <button type="button" className="ui-btn ui-btn-secondary text-xs" onClick={() => setPage((p) => ({ ...p, background: { ...p.background, image: undefined } }))}>Retirer</button>}
        </div>
      </section>
      <section className="space-y-2">
        <p className="text-xs font-semibold text-text-muted">Dimensions</p>
        <p className="text-xs text-text-muted">{round(doc.width, 1)} × {round(doc.height, 1)} {doc.unit}{doc.unit === 'mm' ? ` · fond perdu ${doc.bleed} mm · marge de sécurité ${doc.safe} mm` : ''}</p>
        <select className={inputCls} value="" onChange={(e) => { const f = sameUnit.find((x) => x.id === e.target.value); if (f) onResize(f); }}>
          <option value="">Changer de format…</option>
          {sameUnit.map((f) => <option key={f.id} value={f.id}>{f.group ? `${f.group} · ` : ''}{f.label}</option>)}
        </select>
        <div className="flex items-end gap-2">
          <Field label={`L (${doc.unit})`}><NumInput value={custom.width} onChange={(v) => setCustom({ ...custom, width: v })} /></Field>
          <Field label={`H (${doc.unit})`}><NumInput value={custom.height} onChange={(v) => setCustom({ ...custom, height: v })} /></Field>
          <button type="button" className="ui-btn ui-btn-secondary text-xs" onClick={() => onResize({ id: 'custom', label: 'Personnalisé', width: Math.max(10, custom.width), height: Math.max(10, custom.height) })}>OK</button>
        </div>
        {doc.unit === 'mm' && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Fond perdu (mm)"><NumInput value={doc.bleed} step={0.5} min={0} max={20} onChange={(v) => setDoc((d) => ({ ...d, bleed: Math.min(20, Math.max(0, v)) }))} /></Field>
            <Field label="Sécurité (mm)"><NumInput value={doc.safe} step={0.5} min={0} max={50} onChange={(v) => setDoc((d) => ({ ...d, safe: Math.min(50, Math.max(0, v)) }))} /></Field>
          </div>
        )}
        {type === 'pocket' && (
          <Field label="Hauteur du rabat / poche (mm)"><NumInput value={doc.flap} step={1} min={0} onChange={(v) => setDoc((d) => ({ ...d, flap: Math.min(d.height * 0.6, Math.max(0, v)) }))} /></Field>
        )}
        {subtype === 'video' && (
          <Field label="Durée par scène (s)"><NumInput value={doc.meta.sceneDuration} step={0.5} min={1} max={20} onChange={(v) => setDoc((d) => ({ ...d, meta: { ...d.meta, sceneDuration: Math.min(20, Math.max(1, v)) } }))} /></Field>
        )}
      </section>
      {type === 'social_design' && (
        <section className="space-y-2">
          <p className="text-xs font-semibold text-text-muted">Décliner vers un autre format</p>
          <p className="text-xs text-text-muted">Crée une copie adaptée (positions et tailles recalculées) sans modifier ce design.</p>
          <select className={inputCls} value="" onChange={(e) => {
            const [pid, fid] = e.target.value.split('|');
            const p = SOCIAL_PLATFORMS.find((x) => x.id === pid);
            const f = p && p.formats.find((x) => x.id === fid);
            if (f) onAdaptCopy({ ...f, platform: pid, label: `${p.label} ${f.label}` });
          }} data-testid="adapt-format">
            <option value="">Choisir un format…</option>
            {SOCIAL_PLATFORMS.map((p) => <optgroup key={p.id} label={p.label}>{p.formats.map((f) => <option key={f.id} value={`${p.id}|${f.id}`}>{f.label} ({f.width} × {f.height})</option>)}</optgroup>)}
          </select>
          <p className="text-xs text-text-muted">La publication directe sur les réseaux n’est pas intégrée : exportez en PNG/JPG puis publiez depuis la plateforme.</p>
        </section>
      )}
    </div>
  );
}

function ExportDialog({ doc, type, exports, title, pageIndex, mod, onClose }) {
  const [format, setFormat] = useState(exports[0]);
  const [pages, setPages] = useState('all');
  const [includeBleed, setIncludeBleed] = useState(doc.unit === 'mm' && doc.bleed > 0);
  const [cropMarks, setCropMarks] = useState(false);
  const [spreads, setSpreads] = useState(false);
  const [dpi, setDpi] = useState(300);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const isPrint = doc.unit === 'mm';
  const size = pixelSize(doc, { includeBleed: includeBleed && isPrint, dpi, scale: format === 'png-hd' ? 4 : 1 });
  const run = async () => {
    setBusy(true);
    setError('');
    try {
      await exportDocument(doc, format, {
        pages: pages === 'current' ? pageIndex : 'all', includeBleed, cropMarks, dpi, title,
        spreads: spreads && mod.spreads ? mod.spreads : null, onProgress: setProgress
      });
      onClose();
    } catch (e) {
      setError(e.message || 'Export impossible');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-card dark:bg-card-dark p-5 shadow-xl text-text-primary dark:text-text-primary-dark" data-testid="export-dialog">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Exporter</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-surface dark:hover:bg-surface-dark"><Icons.X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            {exports.map((f) => (
              <button key={f} type="button" onClick={() => setFormat(f)} data-testid={`export-${f}`}
                className={`rounded-lg border px-3 py-2 text-left ${format === f ? 'border-action bg-action/10 text-action dark:text-action-dark' : 'border-border dark:border-border-dark'}`}>
                {EXPORT_LABELS[f]}
              </button>
            ))}
          </div>
          {doc.pages.length > 1 && format !== 'webm' && !spreads && (
            <Field label="Pages">
              <select className={inputCls} value={pages} onChange={(e) => setPages(e.target.value)}>
                <option value="all">Toutes les pages ({doc.pages.length})</option>
                <option value="current">Page actuelle ({doc.pages[pageIndex].name})</option>
              </select>
            </Field>
          )}
          {isPrint && doc.bleed > 0 && format !== 'webm' && (
            <label className="flex items-center gap-2"><input type="checkbox" checked={includeBleed} onChange={(e) => setIncludeBleed(e.target.checked)} /> Inclure le fond perdu ({doc.bleed} mm)</label>
          )}
          {isPrint && format === 'pdf' && (
            <label className="flex items-center gap-2"><input type="checkbox" checked={cropMarks} onChange={(e) => setCropMarks(e.target.checked)} /> Traits de coupe{mod.spreads ? ' et repères de pliage' : ''}</label>
          )}
          {format === 'pdf' && type === 'pocket' && (
            <label className="flex items-center gap-2"><input type="checkbox" checked={spreads} onChange={(e) => setSpreads(e.target.checked)} /> Planches à plat (extérieur + intérieur)</label>
          )}
          {isPrint && ['pdf', 'png', 'jpg'].includes(format) && (
            <Field label="Résolution">
              <select className={inputCls} value={dpi} onChange={(e) => setDpi(Number(e.target.value))}>
                <option value={150}>150 dpi (brouillon)</option><option value={300}>300 dpi (impression)</option>
              </select>
            </Field>
          )}
          {format !== 'svg' && format !== 'webm' && (
            <p className="text-xs text-text-muted">
              {size.width} × {size.height} px{size.effectiveDpi ? ` · ${size.effectiveDpi} dpi effectifs` : ''}
              {size.effectiveDpi && size.effectiveDpi < dpi ? ' (limité pour ce très grand format)' : ''}
              {doc.transparent && format !== 'jpg' ? ' · fond transparent' : ''}
            </p>
          )}
          {format === 'svg' && <p className="text-xs text-text-muted">Vectoriel : textes, formes et symboles restent éditables ; les photos sont intégrées.</p>}
          {format === 'webm' && <p className="text-xs text-text-muted">Diaporama animé : chaque page est une scène de {doc.meta.sceneDuration} s avec fondu enchaîné. L’enregistrement se fait en temps réel ({Math.round(doc.meta.sceneDuration * doc.pages.length)} s).</p>}
          {isPrint && <p className="text-xs text-text-muted">Exports en RVB, prêts pour la taille et le fond perdu (pas de conversion CMJN).</p>}
          {error && <p className="text-error-text">{error}</p>}
          <button type="button" className="ui-btn ui-btn-primary w-full" onClick={run} disabled={busy} data-testid="run-export">
            {busy ? <><Icons.Loader2 className="h-4 w-4 animate-spin" /> {format === 'webm' ? `Enregistrement ${Math.round(progress * 100)}%` : 'Export en cours…'}</> : <><Icons.Download className="h-4 w-4" /> Télécharger</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function FoldPreview({ doc, onClose }) {
  const [angle, setAngle] = useState(-150);
  const idx = (id) => Math.max(0, doc.pages.findIndex((p) => p.id === id));
  const urls = useMemo(() => ({
    front: pagePreviewUrl(doc, idx('front')),
    back: pagePreviewUrl(doc, idx('back')),
    left: pagePreviewUrl(doc, idx('inside-left')),
    right: pagePreviewUrl(doc, idx('inside-right'))
  }), [doc]);
  const w = 220;
  const h = (w * doc.height) / doc.width;
  const flap = doc.flap ? (doc.flap / doc.height) * h : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl rounded-2xl bg-card dark:bg-card-dark p-5 text-text-primary dark:text-text-primary-dark shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Aperçu du pliage</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-surface dark:hover:bg-surface-dark"><Icons.X className="h-5 w-5" /></button>
        </div>
        <div className="flex justify-center overflow-hidden rounded-xl bg-surface dark:bg-surface-dark py-10" style={{ perspective: 1400 }}>
          <div className="relative" style={{ width: w * 2, height: h, transformStyle: 'preserve-3d', transform: 'rotateX(12deg)' }}>
            {/* inside right (static) with pocket flap */}
            <div className="absolute" style={{ left: w, top: 0, width: w, height: h, boxShadow: '0 8px 24px rgba(0,0,0,.25)' }}>
              <img src={urls.right} alt="" style={{ width: w, height: h }} />
              {flap > 0 && <div className="absolute inset-x-0 bottom-0 border-t-2 border-dashed border-fuchsia-500 bg-white/30" style={{ height: flap }} />}
            </div>
            {/* cover leaf: front outside / inside-left inside */}
            <div className="absolute" style={{ left: w, top: 0, width: w, height: h, transformOrigin: 'left center', transformStyle: 'preserve-3d', transform: `rotateY(${angle}deg)`, transition: 'transform .15s' }}>
              <img src={urls.front} alt="" style={{ position: 'absolute', width: w, height: h, backfaceVisibility: 'hidden' }} />
              <img src={urls.left} alt="" style={{ position: 'absolute', width: w, height: h, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} />
            </div>
          </div>
        </div>
        <label className="mt-4 block text-sm">
          <span className="ui-label">Ouverture</span>
          <input type="range" min="-180" max="0" value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full" data-testid="fold-slider" />
        </label>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px] text-text-muted">
          {[['back', 'Verso'], ['front', 'Recto'], ['left', 'Intérieur gauche'], ['right', 'Intérieur droit']].map(([k, l]) => (
            <div key={k}><img src={urls[k]} alt="" className="mx-auto mb-1 max-h-24 border border-border" />{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function recolor(doc, fn) {
  return {
    ...doc,
    pages: doc.pages.map((p) => ({
      ...p,
      elements: p.elements.map((el) => {
        const out = { ...el };
        ['color', 'fill', 'stroke'].forEach((k) => { if (out[k] && out[k] !== 'transparent') out[k] = fn(out[k], k, el); });
        if (out.type === 'qr') out.background = 'transparent';
        return out;
      })
    }))
  };
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Monochrome (dark on light) or negative (light on dark) logo variants. */
export function makeLogoVariant(doc, variant) {
  const light = (c) => luminance(c) > 0.75;
  if (variant === 'mono-dark') return recolor(doc, (c) => (light(c) ? '#ffffff' : '#111111'));
  return recolor(doc, (c) => (light(c) ? '#111111' : '#ffffff'));
}

function LogoPreview({ doc, onClose, onVariant }) {
  const backgrounds = [
    { label: 'Fond blanc', bg: '#ffffff', d: doc },
    { label: 'Fond noir', bg: '#0f172a', d: doc },
    { label: 'Couleur de marque', bg: doc.meta.brandColor || '#4f46e5', d: makeLogoVariant(doc, 'mono-light') },
    { label: 'Photo / dégradé', bg: 'linear-gradient(135deg,#f97316,#db2777,#4f46e5)', d: makeLogoVariant(doc, 'mono-light') },
    { label: 'Monochrome', bg: '#f1f5f9', d: makeLogoVariant(doc, 'mono-dark') },
    { label: 'Négatif', bg: '#111827', d: makeLogoVariant(doc, 'mono-light') }
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-card dark:bg-card-dark p-5 text-text-primary dark:text-text-primary-dark shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Aperçus et variantes du logo</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-surface dark:hover:bg-surface-dark"><Icons.X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {backgrounds.map((b, i) => (
            <div key={b.label} className="overflow-hidden rounded-xl border border-border dark:border-border-dark">
              <div className="flex aspect-[4/3] items-center justify-center p-4" style={{ background: b.bg }}>
                <DesignSvg doc={{ ...b.d, pages: [{ ...b.d.pages[0], background: { color: 'transparent' } }] }} mode="export" uid={`lp${i}`} width="100%" height="100%" style={{ maxWidth: '100%', maxHeight: '100%' }} />
              </div>
              <p className="px-3 py-2 text-xs font-medium">{b.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="ui-btn ui-btn-secondary text-sm" onClick={() => onVariant('mono-dark')} data-testid="variant-mono"><Icons.Copy className="h-4 w-4" /> Créer la variante monochrome</button>
          <button type="button" className="ui-btn ui-btn-secondary text-sm" onClick={() => onVariant('mono-light')}><Icons.Copy className="h-4 w-4" /> Créer la variante négative</button>
        </div>
      </div>
    </div>
  );
}
