// src/design/studio/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import StudioLayout, { CATEGORIES, Icon, Loading } from './StudioLayout';
import { api, formatDate, useSession } from './api';
import { getModule } from '../shared/modules';

export default function Dashboard() {
  const { user, loading } = useSession();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api('GET', '/api/designs/summary').then(setSummary).catch((e) => setError(e.message));
  }, [user]);

  if (loading) return <Loading />;
  const counts = (summary && summary.counts) || {};

  return (
    <StudioLayout title="Tableau de bord" subtitle="Choisissez une rubrique pour créer ou gérer vos supports.">
      {error && <p className="mb-6 rounded-lg bg-error-bg dark:bg-error-bg-dark px-4 py-3 text-sm text-error-text dark:text-error-text-dark">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            to={c.to}
            data-testid={`category-${c.key}`}
            className="group flex flex-col rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lifted"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-action/10 dark:bg-action-dark/20 text-action dark:text-action-dark">
                <Icon name={c.icon} className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-surface dark:bg-surface-dark px-2.5 py-0.5 text-xs font-medium text-text-muted dark:text-text-muted-dark">
                {summary ? `${counts[c.key] || 0} projet${(counts[c.key] || 0) > 1 ? 's' : ''}` : '…'}
              </span>
            </div>
            <h2 className="mt-4 font-semibold text-text-primary dark:text-text-primary-dark">{c.label}</h2>
            <p className="mt-1 flex-1 text-sm text-text-muted dark:text-text-muted-dark">{c.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-action dark:text-action-dark">
              Ouvrir <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>

      {summary && summary.recent.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary dark:text-text-primary-dark"><Clock className="h-4 w-4" /> Créations récentes</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {summary.recent.map((p) => {
              const mod = getModule(p.type);
              return (
                <Link key={p.id} to={`/studio/${mod.slug}/${p.id}`} className="overflow-hidden rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark hover:shadow-lifted transition">
                  <div className="flex aspect-[4/3] items-center justify-center bg-surface dark:bg-surface-dark">
                    {p.thumbnail ? <img src={p.thumbnail} alt="" className="max-h-full max-w-full object-contain" /> : <Icon name={mod.icon} className="h-8 w-8 text-text-muted-subtle" />}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-text-primary dark:text-text-primary-dark">{p.title}</p>
                    <p className="text-xs text-text-muted dark:text-text-muted-dark">{mod.label} · {formatDate(p.updatedAt)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </StudioLayout>
  );
}
