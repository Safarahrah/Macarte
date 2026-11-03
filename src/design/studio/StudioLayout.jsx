// src/design/studio/StudioLayout.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { MODULE_LIST } from '../shared/modules';
import { api } from './api';

export const CATEGORIES = [
  { key: 'digital_card', label: 'Cartes numériques', description: 'Cartes de visite digitales avec page publique, QR code et vCard.', icon: 'Contact', to: '/people' },
  { key: 'printable_card', label: 'Cartes imprimables', description: 'Éditeur recto-verso avec exports PDF, JPG, PNG et SVG.', icon: 'Printer', to: '/studio/imprimables' },
  ...MODULE_LIST.map((m) => ({ key: m.type, label: m.label, description: m.description, icon: m.icon, to: `/studio/${m.slug}` }))
];

export function Icon({ name, ...props }) {
  const C = Icons[name] || Icons.Square;
  return <C {...props} />;
}

export default function StudioLayout({ title, subtitle, actions, children, back, wide }) {
  const navigate = useNavigate();
  useEffect(() => { if (title) document.title = `${title} · Macarte`; }, [title]);
  const logout = async () => {
    try { await api('POST', '/api/logout'); } catch (e) { /* ignore */ }
    navigate('/login');
  };
  return (
    <div className="min-h-screen bg-main dark:bg-main-dark">
      <header className="sticky top-0 z-30 border-b border-border-subtle dark:border-border-subtle-dark bg-card/95 dark:bg-card-dark/95 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-8">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-text-primary dark:text-text-primary-dark">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-action to-accent text-white shadow-md">
              <Icons.LayoutGrid className="h-5 w-5" />
            </span>
            <span className="hidden sm:inline font-display">Macarte Studio</span>
          </Link>
          <nav className="ml-2 flex flex-1 items-center gap-1 overflow-x-auto text-sm" aria-label="Rubriques">
            {CATEGORIES.map((c) => (
              <Link key={c.key} to={c.to} className="whitespace-nowrap rounded-lg px-3 py-2 text-text-muted dark:text-text-muted-dark hover:bg-action/5 dark:hover:bg-action/10 hover:text-action dark:hover:text-action-dark transition-colors">
                {c.label}
              </Link>
            ))}
          </nav>
          <button type="button" onClick={logout} className="ui-btn ui-btn-ghost text-sm hover:bg-error/5 hover:text-error" title="Se déconnecter">
            <Icons.LogOut className="h-4 w-4" /><span className="hidden md:inline">Déconnexion</span>
          </button>
        </div>
      </header>
      <main className={`mx-auto px-4 py-8 md:px-8 ${wide ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
        {(title || actions) && (
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {back && (
                <button type="button" onClick={() => navigate(back)} className="mt-1 rounded-full p-2 text-text-muted dark:text-text-muted-dark hover:bg-surface dark:hover:bg-surface-dark" aria-label="Retour">
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

export function Loading({ label = 'Chargement…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-text-muted dark:text-text-muted-dark">
      <Icons.Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}
