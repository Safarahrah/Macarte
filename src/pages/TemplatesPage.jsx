// src/pages/TemplatesPage.jsx
// Public template gallery: search, category filters and a responsive grid.
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Crown, Search, Sparkles, LayoutGrid } from 'lucide-react';
import SiteHeader from '../marketing/SiteHeader';
import SiteFooter from '../marketing/SiteFooter';
import CardSvgPreview, { sampleConfig } from '../marketing/CardSvgPreview';
import { PUBLIC_TEMPLATES, getCategories, getCategoryLabel } from '../printable/shared/templates';

export default function TemplatesPage({ darkMode, toggleDarkMode, isAuthenticated, appVersion, githubUrl }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = 'Modèles · Macarte';
  }, []);

  const categories = useMemo(() => getCategories(), []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PUBLIC_TEMPLATES.filter((t) => {
      if (category !== 'all' && t.category !== category) return false;
      if (!q) return true;
      const haystack = [t.name, t.description, getCategoryLabel(t.category), ...(t.tags || [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, category]);

  // Build the demo config once per visible template.
  const configs = useMemo(() => {
    const map = new Map();
    results.forEach((t) => map.set(t.id, sampleConfig(t.id)));
    return map;
  }, [results]);

  const primaryHref = isAuthenticated ? '/people' : '/register';

  return (
    <div className="min-h-screen bg-main dark:bg-main-dark flex flex-col">
      <SiteHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} isAuthenticated={isAuthenticated} />

      {/* ---------------- HEADER ---------------- */}
      <section className="relative overflow-hidden border-b border-border-subtle dark:border-border-dark bg-card dark:bg-card-dark">
        <div className="absolute inset-0 ui-hero-grid pointer-events-none" aria-hidden="true" />
        <div className="ui-container relative py-12 md:py-16">
          <span className="ui-badge">
            <Sparkles className="w-3.5 h-3.5" /> {PUBLIC_TEMPLATES.length} modèles inclus
          </span>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold text-text-primary dark:text-text-primary-dark">
            Choisissez votre modèle
          </h1>
          <p className="mt-3 max-w-2xl text-text-muted dark:text-text-muted-dark">
            Minimal, Modern, Corporate, Luxury, Creative, Healthcare, Technology — chaque modèle est
            entièrement personnalisable : textes, couleurs, logo, QR code et export prêt à imprimer.
          </p>

          {/* Search */}
          <div className="mt-7 relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted-subtle dark:text-text-muted-subtle-dark pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un modèle (ex. minimal, luxury…)"
              className="ui-input !pl-10"
              aria-label="Rechercher un modèle"
            />
          </div>
        </div>
      </section>

      {/* ---------------- FILTERS + GRID ---------------- */}
      <section className="py-10 md:py-14 flex-1">
        <div className="ui-container">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`ui-btn ${category === 'all' ? 'ui-btn-primary' : 'ui-btn-secondary'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Tous
            </button>
            {categories.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`ui-btn ${category === id ? 'ui-btn-primary' : 'ui-btn-secondary'}`}
              >
                {getCategoryLabel(id)}
              </button>
            ))}
          </div>

          <p className="mt-6 text-sm text-text-muted dark:text-text-muted-dark">
            {results.length} {results.length > 1 ? 'modèles' : 'modèle'}
          </p>

          {results.length === 0 ? (
            <div className="ui-card mt-6 p-12 text-center">
              <p className="font-display text-lg font-semibold text-text-primary dark:text-text-primary-dark">
                Aucun modèle ne correspond
              </p>
              <p className="mt-2 text-sm text-text-muted dark:text-text-muted-dark">
                Essayez un autre mot-clé ou réinitialisez les filtres.
              </p>
              <button
                type="button"
                className="ui-btn ui-btn-secondary mt-5"
                onClick={() => { setQuery(''); setCategory('all'); }}
              >
                Réinitialiser
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((t, i) => (
                <article
                  key={t.id}
                  className={`group ui-card overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1 hover:shadow-lifted ui-fade-up ui-fade-up-${(i % 3) + 1}`}
                >
                  <div className="relative aspect-[1.586/1] overflow-hidden bg-white ring-1 ring-inset ring-black/5">
                    <CardSvgPreview config={configs.get(t.id)} publicUrl="https://macarte.app/demo" />
                    {t.isPremium && (
                      <span className="absolute top-3 right-3 ui-badge !bg-amber-100 !text-amber-800 !border-amber-200">
                        <Crown className="w-3 h-3" /> Premium
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-display font-semibold text-text-primary dark:text-text-primary-dark">
                        {t.name}
                      </h2>
                      <span className="ui-badge shrink-0">{getCategoryLabel(t.category)}</span>
                    </div>
                    <p className="mt-2 text-sm text-text-muted dark:text-text-muted-dark leading-relaxed flex-1">
                      {t.description}
                    </p>
                    <Link to={primaryHref} className="ui-btn ui-btn-primary mt-4 ui-btn-block">
                      Utiliser ce modèle <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter appVersion={appVersion} githubUrl={githubUrl} />
    </div>
  );
}
