// src/design/studio/StudioLayout.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MODULE_LIST } from '../shared/modules';
import { api } from './api';
import LanguageSwitcher from '../../LanguageSwitcher';

export function useCategories() {
  const { t } = useTranslation();
  return [
    { key: 'digital_card', label: t('nav.digitalCard'), description: t('nav.digitalCardDesc'), icon: 'Contact', to: '/people' },
    { key: 'printable_card', label: t('nav.printableCard'), description: t('nav.printableCardDesc'), icon: 'Printer', to: '/studio/imprimables' },
    ...MODULE_LIST.map((m) => ({ key: m.type, label: m.label, description: m.description, icon: m.icon, to: `/studio/${m.slug}` }))
  ];
}

export function Icon({ name, ...props }) {
  const C = Icons[name] || Icons.Square;
  return <C {...props} />;
}

export default function StudioLayout({ title, subtitle, actions, children, back, wide }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const CATEGORIES = useCategories();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => { if (title) document.title = `${title} · Macarte`; }, [title]);
  const logout = async () => {
    try { await api('POST', '/api/logout'); } catch (e) { /* ignore */ }
    navigate('/login');
  };
  return (
    <div className="min-h-screen bg-main dark:bg-main-dark">
      <header className="sticky top-0 z-30 border-b border-border-subtle dark:border-border-subtle-dark bg-card/95 dark:bg-card-dark/95 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2 md:py-3 md:px-8">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-text-primary dark:text-text-primary-dark">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-action to-accent text-white shadow-md">
              <Icons.LayoutGrid className="h-5 w-5" />
            </span>
            <span className="hidden sm:inline font-display">Macarte Studio</span>
          </Link>
          <nav className="hidden md:flex ml-2 flex-1 flex-wrap items-center gap-1 text-sm" aria-label="Rubriques">
            {CATEGORIES.map((c) => (
              <Link key={c.key} to={c.to} className="whitespace-nowrap rounded-lg px-3 py-2 text-text-muted dark:text-text-muted-dark hover:bg-action/5 dark:hover:bg-action/10 hover:text-action dark:hover:text-action-dark transition-colors">
                {c.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher className="text-text-muted dark:text-text-muted-dark hover:text-action dark:hover:text-action-dark" />
            <button type="button" onClick={logout} className="ui-btn ui-btn-ghost text-sm hover:bg-error/5 hover:text-error flex items-center gap-2" title={t('nav.logout')}>
              <Icons.LogOut className="h-4 w-4" /><span className="hidden md:inline">{t('nav.logout')}</span>
            </button>
          </div>
          <button
            type="button"
            className="md:hidden ui-btn ui-btn-ghost !px-2.5 min-h-[44px]"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={t('common.menu')}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <Icons.X className="w-5 h-5" /> : <Icons.Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border-subtle dark:border-border-subtle-dark bg-card dark:bg-card-dark">
            <div className="px-4 py-4 flex flex-col gap-1">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.key}
                  to={c.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-3 min-h-[44px] rounded-lg text-sm font-medium text-text-muted dark:text-text-muted-dark hover:bg-action/5 dark:hover:bg-action/10 hover:text-action dark:hover:text-action-dark transition-colors"
                >
                  {c.label}
                </Link>
              ))}
              <div className="h-px bg-border-subtle dark:border-border-subtle-dark my-2" />
              <LanguageSwitcher className="w-full justify-start text-text-muted dark:text-text-muted-dark hover:text-action dark:hover:text-action-dark min-h-[44px]" />
              <button
                type="button"
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="ui-btn ui-btn-secondary justify-start min-h-[44px] hover:bg-error/5 hover:text-error flex items-center gap-2"
              >
                <Icons.LogOut className="h-4 w-4" /> {t('nav.logout')}
              </button>
            </div>
          </div>
        )}
      </header>
      <main className={`mx-auto px-4 py-8 md:px-8 ${wide ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
        {(title || actions) && (
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {back && (
                <button type="button" onClick={() => navigate(back)} className="mt-1 rounded-full p-2 text-text-muted dark:text-text-muted-dark hover:bg-surface dark:hover:bg-surface-dark" aria-label={t('nav.back')}>
                  <Icons.ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-text-primary dark:text-text-primary-dark">{title}</h1>
                {subtitle && <p className="mt-1 text-sm md:text-base text-text-muted dark:text-text-muted-dark">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

export function Loading({ label }) {
  const { t } = useTranslation();
  const displayLabel = label || t('common.loading');
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-text-muted dark:text-text-muted-dark">
      <Icons.Loader2 className="h-4 w-4 animate-spin" /> {displayLabel}
    </div>
  );
}
