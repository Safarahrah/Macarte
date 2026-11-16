// src/marketing/SiteFooter.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from './SiteHeader';
import { useTranslation } from 'react-i18next';

export default function SiteFooter({ appVersion, githubUrl }) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const COLUMNS = [
    {
      title: t('landing.product'),
      links: [
        { to: '/templates', label: t('landing.templatesTitle') },
        { to: '/#features', label: t('landing.featuresTitle') },
        { to: '/#how', label: t('landing.howItWorksTitle') }
      ]
    },
    {
      title: t('landing.account'),
      links: [
        { to: '/login', label: t('auth.login') },
        { to: '/register', label: t('auth.register') },
        { to: '/settings', label: t('landing.organization') }
      ]
    }
  ];

  return (
    <footer className="border-t border-border-subtle dark:border-border-dark bg-card dark:bg-card-dark">
      <div className="ui-container py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(2,1fr)]">
          <div>
            <BrandMark />
            <p className="mt-4 max-w-xs text-sm text-text-muted dark:text-text-muted-dark leading-relaxed">
              {t('landing.footerDescription')}
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
              {t('landing.sourceCode')}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
