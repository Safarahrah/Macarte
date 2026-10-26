// src/marketing/SiteFooter.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from './SiteHeader';

const COLUMNS = [
  {
    title: 'Produit',
    links: [
      { to: '/templates', label: 'Modèles' },
      { to: '/#features', label: 'Fonctionnalités' },
      { to: '/#how', label: 'Comment ça marche' }
    ]
  },
  {
    title: 'Compte',
    links: [
      { to: '/login', label: 'Connexion' },
      { to: '/register', label: 'Créer un compte' },
      { to: '/settings', label: 'Organisation' }
    ]
  }
];

export default function SiteFooter({ appVersion, githubUrl }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border-subtle dark:border-border-dark bg-card dark:bg-card-dark">
      <div className="ui-container py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(2,1fr)]">
          <div>
            <BrandMark />
            <p className="mt-4 max-w-xs text-sm text-text-muted dark:text-text-muted-dark leading-relaxed">
              Créez, personnalisez et imprimez des cartes de visite professionnelles avec QR code, en quelques minutes.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-3">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-text-muted dark:text-text-muted-dark hover:text-action dark:hover:text-action-dark transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-border-subtle dark:border-border-dark flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted-subtle dark:text-text-muted-subtle-dark">
            © {year} Macarte · v{appVersion || '—'}
          </p>
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-text-muted dark:text-text-muted-dark hover:text-action dark:hover:text-action-dark"
            >
              Code source sur GitHub
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
