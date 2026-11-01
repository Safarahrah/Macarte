import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Crown, ArrowRight } from 'lucide-react';
import SiteHeader from '../marketing/SiteHeader';
import SiteFooter from '../marketing/SiteFooter';
import CardSvgPreview, { sampleConfig } from '../marketing/CardSvgPreview';
import TemplateGallery from '../design/studio/TemplateGallery';
import { PUBLIC_TEMPLATES, getCategoryLabel } from '../printable/shared/templates';
import { CARD_STYLES, CARD_INDUSTRIES } from '../printable/shared/cardCatalog';

// Older templates only have a category: expose it (and the description) to the gallery search.
const GALLERY_TEMPLATES = PUBLIC_TEMPLATES.map((t) => ({
  ...t,
  tags: [...(t.tags || []), getCategoryLabel(t.category), t.description].filter(Boolean)
}));

export default function TemplatesPage({ darkMode, toggleDarkMode, isAuthenticated, appVersion, githubUrl }) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = 'Modèles · Macarte';
  }, []);

  // Demo configs are built lazily, only for the tiles actually shown.
  const configs = useMemo(() => new Map(), []);
  const configOf = (id) => {
    if (!configs.has(id)) configs.set(id, sampleConfig(id));
    return configs.get(id);
  };

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
            Classés par style et par industrie — chaque modèle est
            entièrement personnalisable : textes, couleurs, logo, QR code et export prêt à imprimer.
          </p>

        </div>
      </section>

      {/* ---------------- FILTERS + GRID ---------------- */}
      <section className="py-10 md:py-14 flex-1">
        <div className="ui-container">
          <TemplateGallery
            templates={GALLERY_TEMPLATES}
            styles={CARD_STYLES}
            industries={CARD_INDUSTRIES}
            placeholder="Rechercher un modèle (ex. luxe, barbier, immobilier…)"
            gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            renderTile={(t) => (
              <article key={t.id} className="group ui-card overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1 hover:shadow-lifted">
                <div className="relative aspect-[1.586/1] overflow-hidden bg-white rounded-md">
                  <CardSvgPreview config={configOf(t.id)} publicUrl="https://macarte.app/demo" />
                  {t.isPremium && (
                    <span className="absolute top-3 right-3 ui-badge !bg-amber-100 !text-amber-800 !border-amber-200">
                      <Crown className="w-3 h-3" /> Premium
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display font-semibold text-text-primary dark:text-text-primary-dark">{t.name}</h2>
                    <span className="ui-badge shrink-0">{getCategoryLabel(t.category)}</span>
                  </div>
                  {t.description && (
                    <p className="mt-2 text-sm text-text-muted dark:text-text-muted-dark leading-relaxed flex-1">{t.description}</p>
                  )}
                  <Link to={primaryHref} className="ui-btn ui-btn-primary mt-3 ui-btn-block">
                    Utiliser ce modèle <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            )}
          />
        </div>
      </section>

      <SiteFooter appVersion={appVersion} githubUrl={githubUrl} />
    </div>
  );
}
