// src/pages/HomePage.jsx
import React, { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  QrCode,
  Palette,
  Printer,
  Upload,
  Smartphone,
  ShieldCheck,
  Sparkles,
  MousePointerClick
} from 'lucide-react';
import SiteHeader from '../marketing/SiteHeader';
import SiteFooter from '../marketing/SiteFooter';
import CardSvgPreview, { sampleConfig } from '../marketing/CardSvgPreview';
import { TEMPLATES } from '../printable/shared/templates';

const SHOWCASE_IDS = ['minimal', 'corporate-bold', 'modern', 'luxury-gold', 'tech', 'editorial', 'neon', 'nordic'];

export default function HomePage({ darkMode, toggleDarkMode, isAuthenticated, appVersion, githubUrl }) {
  const { t } = useTranslation();
  const location = useLocation();

  const STEPS = [
    {
      icon: MousePointerClick,
      title: t('home.steps.choose.title'),
      text: t('home.steps.choose.text')
    },
    {
      icon: Palette,
      title: t('home.steps.customize.title'),
      text: t('home.steps.customize.text')
    },
    {
      icon: Printer,
      title: t('home.steps.print.title'),
      text: t('home.steps.print.text')
    }
  ];

  const FEATURES = [
    { icon: QrCode, title: t('home.features.qr.title'), text: t('home.features.qr.text') },
    { icon: Upload, title: t('home.features.import.title'), text: t('home.features.import.text') },
    { icon: Palette, title: t('home.features.editor.title'), text: t('home.features.editor.text') },
    { icon: Printer, title: t('home.features.export.title'), text: t('home.features.export.text') },
    { icon: Smartphone, title: t('home.features.responsive.title'), text: t('home.features.responsive.text') },
    { icon: ShieldCheck, title: t('home.features.selfHosted.title'), text: t('home.features.selfHosted.text') }
  ];

  // Smooth-scroll to anchors (react-router does not do it automatically).
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location.hash, location.pathname]);

  const showcase = useMemo(
    () => SHOWCASE_IDS.map((id) => ({
      template: TEMPLATES.find((t) => t.id === id),
      config: sampleConfig(id)
    })).filter((x) => x.template),
    []
  );

  const heroFront = useMemo(() => sampleConfig('minimal'), []);
  const heroBack = useMemo(() => sampleConfig('corporate-bold', { doubleSided: true }), []);
  const primaryHref = isAuthenticated ? '/people' : '/register';

  return (
    <div className="min-h-screen bg-main dark:bg-main-dark bg-main-texture flex flex-col">
      <SiteHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} isAuthenticated={isAuthenticated} />

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 ui-hero-grid pointer-events-none" aria-hidden="true" />
        <div className="ui-container relative py-16 md:py-24 grid items-center gap-12 lg:grid-cols-2">
          <div className="ui-fade-up">
            <span className="ui-badge bg-gradient-to-r from-action/10 to-accent/10 text-action dark:text-action-dark border-action/20">
              <Sparkles className="w-3.5 h-3.5" /> {t('home.hero.badge')}
            </span>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-[3.25rem] leading-[1.08] font-bold text-text-primary dark:text-text-primary-dark">
              {t('home.hero.title')}
            </h1>
            <p className="mt-5 text-lg text-text-muted dark:text-text-muted-dark leading-relaxed max-w-xl">
              {t('home.hero.subtitle')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to={primaryHref} className="ui-btn ui-btn-primary ui-btn-lg bg-gradient-to-r from-action to-accent hover:from-action-hover hover:to-accent-hover shadow-md">
                {t('home.hero.createCard')} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/templates" className="ui-btn ui-btn-secondary ui-btn-lg">
                {t('home.hero.seeTemplates')}
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted dark:text-text-muted-dark">
              <li className="flex items-center gap-2"><QrCode className="w-4 h-4 text-action dark:text-action-dark" /> {t('home.hero.feature1')}</li>
              <li className="flex items-center gap-2"><Printer className="w-4 h-4 text-accent dark:text-accent-dark" /> {t('home.hero.feature2')}</li>
              <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-coral dark:text-coral-dark" /> {t('home.hero.feature3')}</li>
            </ul>
          </div>

          {/* Card preview with QR */}
          <div className="ui-fade-up ui-fade-up-2 relative">
            <div className="relative mx-auto max-w-md">
              <div className="ui-card p-4 shadow-floating rotate-[-1.5deg]">
                <div className="rounded-md overflow-hidden ring-1 ring-black/5">
                  <CardSvgPreview config={heroFront} publicUrl="https://macarte.app/demo" />
                </div>
              </div>
              <div className="ui-card p-4 shadow-floating mt-[-28%] ml-10 rotate-[2deg] hidden sm:block">
                <div className="rounded-md overflow-hidden ring-1 ring-black/5">
                  <CardSvgPreview config={heroBack} publicUrl="https://macarte.app/demo" side="back" />
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 ui-card px-4 py-3 shadow-lifted flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-action/10 text-action dark:text-action-dark">
                  <QrCode className="w-4 h-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">{t('home.qrCard.title')}</p>
                  <p className="text-[11px] text-text-muted dark:text-text-muted-dark">{t('home.qrCard.subtitle')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- TEMPLATE SHOWCASE ---------------- */}
      <section id="templates-showcase" className="py-16 md:py-20 border-y border-border-subtle dark:border-border-dark bg-card dark:bg-card-dark">
        <div className="ui-container">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-text-primary dark:text-text-primary-dark">{t('home.templates.title')}</h2>
              <p className="mt-2 text-text-muted dark:text-text-muted-dark">{t('home.templates.subtitle')}</p>
            </div>
            <Link to="/templates" className="ui-btn ui-btn-secondary shrink-0">
              {t('home.templates.allTemplates')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {showcase.map(({ template, config }, i) => (
              <Link
                key={template.id}
                to="/templates"
                className={`group ui-card overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-lifted ui-fade-up ui-fade-up-${(i % 3) + 1}`}
              >
                <div className="aspect-[1.586/1] overflow-hidden bg-white rounded-md">
                  <CardSvgPreview config={config} publicUrl="https://macarte.app/demo" />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-sm text-text-primary dark:text-text-primary-dark">{template.name}</p>
                  <p className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5 capitalize">{template.category}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section id="how" className="py-16 md:py-24">
        <div className="ui-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl font-bold text-text-primary dark:text-text-primary-dark">{t('home.howItWorks.title')}</h2>
            <p className="mt-3 text-text-muted dark:text-text-muted-dark">{t('home.howItWorks.subtitle')}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="ui-card p-6 relative">
                <span className="absolute top-6 right-6 font-display text-4xl font-bold text-border-subtle dark:text-border-dark select-none">
                  0{i + 1}
                </span>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-action/10 text-action dark:text-action-dark">
                  <s.icon className="w-5 h-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-text-primary dark:text-text-primary-dark">{s.title}</h3>
                <p className="mt-2 text-sm text-text-muted dark:text-text-muted-dark leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section id="features" className="py-16 md:py-24 border-y border-border-subtle dark:border-border-dark bg-card dark:bg-card-dark">
        <div className="ui-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl font-bold text-text-primary dark:text-text-primary-dark">{t('home.features.title')}</h2>
            <p className="mt-3 text-text-muted dark:text-text-muted-dark">{t('home.features.subtitle')}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-action/10 text-action dark:text-action-dark">
                  <f.icon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-text-primary dark:text-text-primary-dark">{f.title}</h3>
                  <p className="mt-1 text-sm text-text-muted dark:text-text-muted-dark leading-relaxed">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="py-16 md:py-24">
        <div className="ui-container">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-action via-action to-accent px-6 py-14 sm:px-12 text-center text-white shadow-floating">
            <div className="absolute inset-0 opacity-20 ui-hero-grid" aria-hidden="true" />
            <div className="relative">
              <h2 className="font-display text-3xl sm:text-4xl font-bold">{t('home.cta.title')}</h2>
              <p className="mt-3 text-white/90 max-w-xl mx-auto">
                {t('home.cta.subtitle')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to={primaryHref}
                  className="ui-btn ui-btn-lg bg-white text-action hover:bg-white/90 shadow-lifted"
                >
                  {t('home.cta.createCard')} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/templates"
                  className="ui-btn ui-btn-lg border border-white/40 text-white hover:bg-white/10"
                >
                  {t('home.cta.seeTemplates')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter appVersion={appVersion} githubUrl={githubUrl} />
    </div>
  );
}