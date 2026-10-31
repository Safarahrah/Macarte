// src/design/studio/DesignLibrary.jsx
// Project list for one module + creation flow (format → template / generator).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Pencil, Plus, Search, Trash2, Type, Wand2, X } from 'lucide-react';
import StudioLayout, { Icon, Loading } from './StudioLayout';
import { api, formatDate, useSession } from './api';
import DesignSvg from '../engine/DesignSvg';
import { createDocument } from '../engine/factory';
import { applyTemplate, generateLogoProposals, getTemplates, LOGO_SECTORS, LOGO_STYLES } from '../templates';
import { allowsFreePages, getKind } from '../shared/modules';

function formatLabel(mod, p) {
  const f = mod.formats.find((x) => x.id === p.format);
  const dims = p.dimensions ? `${Math.round(p.dimensions.width)} × ${Math.round(p.dimensions.height)} ${p.dimensions.unit}` : '';
  return f ? `${f.group ? `${f.group} · ` : ''}${f.label}` : dims;
}

export default function DesignLibrary({ mod }) {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    try { setItems(await api('GET', mod.api)); } catch (e) { setError(e.message); }
  }, [mod.api]);

  useEffect(() => { if (user) refresh(); }, [user, refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items || []).filter((p) => !q || p.title.toLowerCase().includes(q) || (p.subtype || '').includes(q));
  }, [items, query]);

  if (loading) return <Loading />;

  const rename = async (p) => {
    const title = window.prompt('Nouveau nom', p.title);
    if (!title || !title.trim()) return;
    try { await api('PUT', `${mod.api}/${p.id}`, { title: title.trim() }); refresh(); } catch (e) { setError(e.message); }
  };
  const duplicate = async (p) => {
    try { await api('POST', `${mod.api}/${p.id}/duplicate`, {}); refresh(); } catch (e) { setError(e.message); }
  };
  const remove = async (p) => {
    if (!window.confirm(`Supprimer définitivement « ${p.title} » ?`)) return;
    try { await api('DELETE', `${mod.api}/${p.id}`); refresh(); } catch (e) { setError(e.message); }
  };

  return (
    <StudioLayout
      title={mod.label}
      subtitle={mod.description}
      back="/dashboard"
      actions={<button type="button" className="ui-btn ui-btn-primary" onClick={() => setCreating(true)} data-testid="new-design"><Plus className="h-4 w-4" /> Nouveau projet</button>}
    >
      {error && <p className="mb-6 rounded-lg bg-error-bg dark:bg-error-bg-dark px-4 py-3 text-sm text-error-text dark:text-error-text-dark">{error}</p>}
      <div className="mb-6 flex max-w-sm items-center gap-2 rounded-input border border-border dark:border-border-dark bg-card dark:bg-card-dark px-3">
        <Search className="h-4 w-4 text-text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un projet" className="w-full bg-transparent py-2 text-sm text-text-primary dark:text-text-primary-dark focus:outline-none" />
      </div>
      {!items ? <Loading /> : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border dark:border-border-dark bg-card dark:bg-card-dark py-16 text-center">
          <Icon name={mod.icon} className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-text-muted dark:text-text-muted-dark">{items.length ? 'Aucun résultat.' : 'Aucun projet pour l’instant.'}</p>
          {!items.length && <button type="button" className="ui-btn ui-btn-primary mt-4" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Créer mon premier projet</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <div key={p.id} className="group flex flex-col overflow-hidden rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark shadow-card" data-testid="design-card">
              <button type="button" onClick={() => navigate(`/studio/${mod.slug}/${p.id}`)} className="flex aspect-[4/3] items-center justify-center bg-surface dark:bg-surface-dark p-3">
                {p.thumbnail ? <img src={p.thumbnail} alt="" className="max-h-full max-w-full object-contain shadow-sm" /> : <Icon name={mod.icon} className="h-10 w-10 text-text-muted-subtle" />}
              </button>
              <div className="flex flex-1 flex-col p-4">
                <p className="truncate font-medium text-text-primary dark:text-text-primary-dark">{p.title}</p>
                <p className="mt-0.5 truncate text-xs text-text-muted dark:text-text-muted-dark">
                  {p.subtype && getKind(p.subtype) ? `${getKind(p.subtype).label} · ` : ''}{formatLabel(mod, p)}
                </p>
                <p className="text-xs text-text-muted-subtle dark:text-text-muted-subtle-dark">Modifié le {formatDate(p.updatedAt)}</p>
                <div className="mt-3 flex gap-1.5">
                  <button type="button" className="ui-btn ui-btn-primary flex-1 text-sm" onClick={() => navigate(`/studio/${mod.slug}/${p.id}`)}><Pencil className="h-4 w-4" /> Ouvrir</button>
                  <button type="button" className="ui-btn ui-btn-secondary px-2.5" title="Renommer" onClick={() => rename(p)}><Type className="h-4 w-4" /></button>
                  <button type="button" className="ui-btn ui-btn-secondary px-2.5" title="Dupliquer" onClick={() => duplicate(p)}><Copy className="h-4 w-4" /></button>
                  <button type="button" className="ui-btn ui-btn-secondary px-2.5" title="Supprimer" onClick={() => remove(p)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {creating && <NewDesignDialog mod={mod} onClose={() => setCreating(false)} onCreated={(p) => navigate(`/studio/${mod.slug}/${p.id}`)} />}
    </StudioLayout>
  );
}

function TemplatePreview({ doc, label, onClick, active, testId }) {
  return (
    <button type="button" onClick={onClick} data-testid={testId}
      className={`flex flex-col overflow-hidden rounded-lg border text-left transition ${active ? 'border-action ring-2 ring-action/30' : 'border-border dark:border-border-dark hover:border-action'}`}>
      <div className="flex aspect-square items-center justify-center bg-surface dark:bg-surface-dark p-2">
        <DesignSvg doc={doc} uid={`tpl-${label}`.replace(/[^a-zA-Z0-9-]/g, '')} style={{ maxWidth: '100%', maxHeight: '100%', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }} width="100%" height="100%" />
      </div>
      <span className="truncate px-2 py-1.5 text-xs font-medium text-text-primary dark:text-text-primary-dark">{label}</span>
    </button>
  );
}

function NewDesignDialog({ mod, onClose, onCreated }) {
  const type = mod.type;
  const [kind, setKind] = useState(type === 'other' ? mod.kinds[0].id : null);
  const [platform, setPlatform] = useState(type === 'social_design' ? mod.platforms[0].id : null);
  const formats = type === 'other'
    ? getKind(kind).formats
    : type === 'social_design' ? mod.platforms.find((p) => p.id === platform).formats.map((f) => ({ ...f, platform })) : mod.formats;
  const [formatId, setFormatId] = useState(formats[0].id);
  const [custom, setCustom] = useState({ width: formats[0].width, height: formats[0].height, unit: formats[0].unit });
  const [templateId, setTemplateId] = useState('blank');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [brand, setBrand] = useState({ name: 'Mon Entreprise', slogan: 'Votre slogan', sector: 'tech', style: 'modern', color: '' });

  useEffect(() => { setFormatId(formats[0].id); setTemplateId('blank'); }, [kind, platform]);

  const format = formatId === 'custom'
    ? { id: 'custom', label: 'Personnalisé', width: Number(custom.width) || 100, height: Number(custom.height) || 100, unit: custom.unit, platform }
    : formats.find((f) => f.id === formatId) || formats[0];
  const baseDoc = useMemo(() => createDocument({ type, subtype: kind, format, platform }), [type, kind, format.id, format.width, format.height, format.unit, platform]);

  const templates = useMemo(() => {
    if (type === 'logo') return generateLogoProposals(brand);
    return getTemplates(type, kind);
  }, [type, kind, brand]);

  const ctx = { type, subtype: kind, allowExtraPages: allowsFreePages(type, kind) };
  const previews = useMemo(
    () => templates.map((t) => ({ t, doc: applyTemplate(baseDoc, t, ctx) })),
    [templates, baseDoc]
  );

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const chosen = previews.find((p) => p.t.id === templateId);
      const data = chosen ? chosen.doc : baseDoc;
      if (type === 'logo') data.meta = { ...data.meta, sector: brand.sector, style: brand.style };
      const defaultTitle = type === 'logo' ? brand.name : `${type === 'other' ? getKind(kind).label : mod.singular[0].toUpperCase() + mod.singular.slice(1)} – ${format.label}`;
      const project = await api('POST', mod.api, { title: (title || defaultTitle).slice(0, 120), subtype: kind, format: format.id, data });
      onCreated(project);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const chip = (active) => `rounded-full border px-3 py-1.5 text-sm whitespace-nowrap ${active ? 'border-action bg-action text-white' : 'border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark hover:border-action'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-card dark:bg-card-dark shadow-xl">
        <div className="flex items-center justify-between border-b border-border dark:border-border-dark px-5 py-4">
          <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">Nouveau projet · {mod.label}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-surface dark:hover:bg-surface-dark" aria-label="Fermer"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {type === 'other' && (
            <section>
              <h3 className="ui-label mb-2">Type de création</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {mod.kinds.map((k) => (
                  <button key={k.id} type="button" onClick={() => setKind(k.id)} data-testid={`kind-${k.id}`}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${kind === k.id ? 'border-action bg-action/10 text-action dark:text-action-dark' : 'border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark hover:border-action'}`}>
                    <Icon name={k.icon} className="h-4 w-4 shrink-0" /> <span className="truncate">{k.label}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {type === 'social_design' && (
            <section>
              <h3 className="ui-label mb-2">Plateforme</h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {mod.platforms.map((p) => <button key={p.id} type="button" className={chip(platform === p.id)} onClick={() => setPlatform(p.id)}>{p.label}</button>)}
              </div>
            </section>
          )}
          <section>
            <h3 className="ui-label mb-2">Format</h3>
            <div className="flex flex-wrap gap-2">
              {formats.map((f) => (
                <button key={f.id} type="button" className={chip(formatId === f.id)} onClick={() => setFormatId(f.id)}>
                  {f.label}{f.unit === 'px' && !/\d+ × \d+/.test(f.label) ? ` · ${f.width} × ${f.height}` : ''}
                </button>
              ))}
              {mod.customFormat && <button type="button" className={chip(formatId === 'custom')} onClick={() => setFormatId('custom')}>Personnalisé</button>}
            </div>
            {formatId === 'custom' && (
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label className="text-sm"><span className="ui-label">Largeur</span><input type="number" min="10" className="ui-input w-28" value={custom.width} onChange={(e) => setCustom({ ...custom, width: e.target.value })} /></label>
                <label className="text-sm"><span className="ui-label">Hauteur</span><input type="number" min="10" className="ui-input w-28" value={custom.height} onChange={(e) => setCustom({ ...custom, height: e.target.value })} /></label>
                <label className="text-sm"><span className="ui-label">Unité</span>
                  <select className="ui-input w-28" value={custom.unit} onChange={(e) => setCustom({ ...custom, unit: e.target.value })}>
                    <option value="mm">mm (impression)</option><option value="px">px (écran)</option>
                  </select>
                </label>
              </div>
            )}
          </section>
          {type === 'logo' && (
            <section className="rounded-xl border border-border dark:border-border-dark bg-surface/50 dark:bg-surface-dark/40 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-text-primary dark:text-text-primary-dark"><Wand2 className="h-4 w-4" /> Générateur de logo</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <label><span className="ui-label">Nom de la marque</span><input className="ui-input" value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} data-testid="logo-name" /></label>
                <label><span className="ui-label">Slogan</span><input className="ui-input" value={brand.slogan} onChange={(e) => setBrand({ ...brand, slogan: e.target.value })} /></label>
                <label><span className="ui-label">Secteur d’activité</span>
                  <select className="ui-input" value={brand.sector} onChange={(e) => setBrand({ ...brand, sector: e.target.value })}>{LOGO_SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
                </label>
                <label><span className="ui-label">Style</span>
                  <select className="ui-input" value={brand.style} onChange={(e) => setBrand({ ...brand, style: e.target.value })}>{LOGO_STYLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
                </label>
                <label><span className="ui-label">Couleur principale</span>
                  <input type="color" className="h-10 w-full cursor-pointer rounded-input border border-border dark:border-border-dark" value={brand.color || LOGO_SECTORS.find((s) => s.id === brand.sector).colors[0]} onChange={(e) => setBrand({ ...brand, color: e.target.value })} />
                </label>
              </div>
            </section>
          )}
          <section>
            <h3 className="ui-label mb-2">{type === 'logo' ? 'Propositions' : 'Modèle'}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <TemplatePreview doc={baseDoc} label="Page blanche" active={templateId === 'blank'} onClick={() => setTemplateId('blank')} testId="template-blank" />
              {previews.map(({ t, doc }) => (
                <TemplatePreview key={t.id} doc={doc} label={t.name} active={templateId === t.id} onClick={() => setTemplateId(t.id)} testId={`template-${t.id}`} />
              ))}
            </div>
          </section>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-border dark:border-border-dark px-5 py-4">
          <input className="ui-input max-w-xs" placeholder="Nom du projet (optionnel)" value={title} onChange={(e) => setTitle(e.target.value)} />
          {error && <span className="text-sm text-error-text">{error}</span>}
          <div className="ml-auto flex gap-2">
            <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="button" className="ui-btn ui-btn-primary" onClick={create} disabled={busy} data-testid="create-design">{busy ? 'Création…' : 'Créer et ouvrir'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
