// src/pages/PublicCatalog.jsx
import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getModuleBySlug, MODULE_LIST } from '../design/shared/modules';
import { getTemplates, getTemplateFilters } from '../design/templates';
import TemplateGallery from '../design/studio/TemplateGallery';
import { createDocument } from '../design/engine/factory';
import { applyTemplate } from '../design/templates';
import DesignSvg from '../design/engine/DesignSvg';

export default function PublicCatalog() {
  const { module: slug } = useParams();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const homePath = isEn ? '/en' : '/';

  const mod = getModuleBySlug(slug);
  if (!mod) {
    return (
      <div className="min-h-screen bg-main dark:bg-main-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Catégorie introuvable</h1>
          <Link to={homePath} className="ui-btn ui-btn-primary">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  // Default brand kit for public catalog (no user context)
  const defaultBrand = {
    brand: '#4f46e5',
    accent: '#f59e0b',
    ink: '#111827'
  };

  // Kit helpers for template building
  const c = {
    w: 210,
    h: 297,
    u: 210,
    ...defaultBrand
  };

  // Helper functions from templates.js (simplified for public use)
  const newId = () => Math.random().toString(36).substr(2, 9);
  const base = () => ({ id: newId(), rotation: 0, opacity: 1, locked: false, hidden: false, name: '' });
  const T = (x, y, w, s, text, o = {}) => ({
    ...base(), type: 'text', text, font: o.font || 'sans', size: s * c.u, weight: o.weight || 400,
    italic: Boolean(o.italic), underline: false, uppercase: Boolean(o.upper), align: o.align || 'left',
    color: o.color || c.ink, lineHeight: o.lh || 1.2, letterSpacing: o.ls || 0,
    x: x * c.w, y: y * c.h, w: w * c.w, h: s * c.u, opacity: o.opacity ?? 1, rotation: o.rot || 0
  });
  const R = (x, y, w, h, fill, o = {}) => ({
    ...base(), type: o.shape || 'rect', fill, stroke: o.stroke || 'transparent', strokeWidth: (o.sw || 0) * c.u, radius: (o.r || 0) * c.u,
    x: x * c.w, y: y * c.h, w: w * c.w, h: h * c.h, opacity: o.opacity ?? 1, rotation: o.rot || 0
  });
  const Sq = (cx, cy, size, fill, o = {}) => {
    const s = size * c.u;
    return { ...R(c, 0, 0, 0, 0, fill, o), x: cx * c.w - s / 2, y: cy * c.h - s / 2, w: s, h: s };
  };
  const Ic = (cx, cy, size, icon, color, o = {}) => {
    const s = size * c.u;
    return { ...base(), type: 'icon', icon, color, strokeWidth: o.sw || 2, fill: o.fill || 'transparent',
      x: cx * c.w - s / 2, y: cy * c.h - s / 2, w: s, h: s, opacity: o.opacity ?? 1
    };
  };
  const Img = (x, y, w, h, o = {}) => ({
    ...base(), type: 'image', src: '', fit: 'cover', radius: (o.r || 0) * c.u,
    x: x * c.w, y: y * c.h, w: w * c.w, h: h * c.h
  });
  const bg = (color) => ({ color });
  const grad = (from, to, angle = 135) => ({ from, to, angle });

  const kit = { T, Sq, Ic, R, Img, bg, grad, newId };

  // Get templates for this module
  const templates = useMemo(() => {
    try {
      return getTemplates(mod.type);
    } catch (e) {
      console.error('Failed to load templates:', e);
      return [];
    }
  }, [mod.type]);

  const filters = useMemo(() => getTemplateFilters(mod.type), [mod.type]);

  // Build preview document for templates
  const previewCache = useMemo(() => new Map(), [templates]);
  const previewOf = (t) => {
    if (!previewCache.has(t.id)) {
      try {
        const baseDoc = createDocument({ type: mod.type, format: mod.formats[0] });
        const ctx = { type: mod.type, allowExtraPages: false, name: 'Demo', slogan: 'Your slogan' };
        const built = t.build(c, ctx);
        const doc = {
          ...baseDoc,
          pages: built.map((p, i) => ({
            id: `pg-${i}`,
            name: `Page ${i + 1}`,
            background: p.background,
            elements: p.elements || []
          }))
        };
        previewCache.set(t.id, doc);
      } catch (e) {
        console.error('Failed to build preview:', e);
        previewCache.set(t.id, null);
      }
    }
    return previewCache.get(t.id);
  };

  // If no templates available
  if (!templates || templates.length === 0) {
    return (
      <div className="min-h-screen bg-main dark:bg-main-dark">
        <header className="bg-card dark:bg-card-dark border-b border-border dark:border-border-dark">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to={homePath} className="text-2xl font-bold text-action">MaCarte</Link>
            <Link to="/register" className="ui-btn ui-btn-primary">{t('auth.register')}</Link>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-4">{mod.label}</h1>
          <p className="text-text-muted dark:text-text-muted-dark mb-8">Bientôt disponible</p>
          <Link to="/templates" className="ui-btn ui-btn-primary">Voir les modèles de cartes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main dark:bg-main-dark">
      <header className="bg-card dark:bg-card-dark border-b border-border dark:border-border-dark">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={homePath} className="text-2xl font-bold text-action">MaCarte</Link>
          <Link to="/register" className="ui-btn ui-btn-primary">{t('auth.register')}</Link>
        </div>
      </header>

      {/* Tab navigation */}
      <nav aria-label="Rubriques" className="bg-card dark:bg-card-dark border-b border-border dark:border-border-dark">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap justify-center gap-2">
          <Link to="/templates" className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-surface-dark transition-colors">
            {t('nav.printableCard')}
          </Link>
          {MODULE_LIST.map((m) => (
            <Link
              key={m.type}
              to={`/modeles/${m.slug}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                m.slug === slug
                  ? 'bg-action text-white'
                  : 'text-text-secondary dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-surface-dark'
              }`}
            >
              {m.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-2">{mod.label}</h1>
          <p className="text-text-muted dark:text-text-muted-dark">{mod.description}</p>
        </div>

        <TemplateGallery
          templates={templates}
          styles={filters.styles}
          industries={filters.industries}
          gridClass="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          placeholder="Rechercher un modèle..."
          renderTile={(template, labels) => {
            const doc = previewOf(template);
            if (!doc) return null;
            return (
              <div key={template.id} className="group flex flex-col">
                <div className="aspect-[4/3] bg-surface dark:bg-surface-dark rounded-lg overflow-hidden p-2">
                  <DesignSvg doc={doc} uid={`tpl-${template.id}`} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark truncate">{template.name}</p>
                  <p className="text-xs text-text-muted dark:text-text-muted-dark truncate">{template.tags?.join(', ') || ''}</p>
                </div>
                <Link
                  to="/register"
                  className="mt-2 ui-btn ui-btn-secondary w-full text-sm text-center"
                >
                  {t('templates.publicCatalog.useTemplate')}
                </Link>
              </div>
            );
          }}
        />
      </main>
    </div>
  );
}
