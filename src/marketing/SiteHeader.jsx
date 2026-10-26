// src/marketing/SiteHeader.jsx
// Shared public navigation used by the homepage and the templates gallery.
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, LayoutDashboard } from 'lucide-react';

const NAV_LINKS = [
  { to: '/#features', label: 'Fonctionnalités' },
  { to: '/#how', label: 'Comment ça marche' },
  { to: '/templates', label: 'Modèles' }
];

export function BrandMark({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-action dark:bg-action-dark text-white dark:text-[#04211d] font-display font-bold text-lg shadow-soft">
        M
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-text-primary dark:text-text-primary-dark">
        Macarte
      </span>
    </span>
  );
}

export default function SiteHeader({ darkMode, toggleDarkMode, isAuthenticated }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const dashboardHref = '/people';

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        scrolled
          ? 'bg-main/85 dark:bg-main-dark/85 backdrop-blur border-b border-border-subtle dark:border-border-dark'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="ui-container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="shrink-0" aria-label="Macarte — accueil">
          <BrandMark />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 text-sm font-medium text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark rounded-button transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Basculer le thème"
            className="ui-btn ui-btn-ghost !px-2.5"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {isAuthenticated ? (
            <Link to={dashboardHref} className="ui-btn ui-btn-primary">
              <LayoutDashboard className="w-4 h-4" /> Tableau de bord
            </Link>
          ) : (
            <>
              <Link to="/login" className="ui-btn ui-btn-ghost">Connexion</Link>
              <Link to="/register" className="ui-btn ui-btn-primary">Créer ma carte</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden ui-btn ui-btn-ghost !px-2.5"
          onClick={() => setOpen((v) => !v)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border-subtle dark:border-border-dark bg-main dark:bg-main-dark">
          <div className="ui-container py-4 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="px-3 py-2.5 rounded-button text-sm font-medium text-text-secondary dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-surface-dark"
              >
                {l.label}
              </Link>
            ))}
            <div className="h-px bg-border-subtle dark:bg-border-dark my-2" />
            <button type="button" onClick={toggleDarkMode} className="ui-btn ui-btn-secondary justify-start">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {darkMode ? 'Thème clair' : 'Thème sombre'}
            </button>
            {isAuthenticated ? (
              <Link to={dashboardHref} className="ui-btn ui-btn-primary ui-btn-block">
                <LayoutDashboard className="w-4 h-4" /> Tableau de bord
              </Link>
            ) : (
              <>
                <Link to="/login" className="ui-btn ui-btn-secondary ui-btn-block">Connexion</Link>
                <Link to="/register" className="ui-btn ui-btn-primary ui-btn-block">Créer ma carte</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
