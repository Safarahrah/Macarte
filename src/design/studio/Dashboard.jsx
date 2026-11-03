// src/design/studio/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Search, Sparkles, Star, TrendingUp } from 'lucide-react';
import StudioLayout, { CATEGORIES, Icon, Loading } from './StudioLayout';
import { api, formatDate, useSession } from './api';
import { getModule } from '../shared/modules';

export default function Dashboard() {
  const { user, loading } = useSession();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    api('GET', '/api/designs/summary').then(setSummary).catch((e) => setError(e.message));
  }, [user]);

  if (loading) return <Loading />;
  const counts = (summary && summary.counts) || {};

  // Quick action shortcuts - most common use cases
  const quickActions = [
    { key: 'digital_card', label: 'Carte de visite', icon: 'Contact', color: 'bg-action/10 text-action', to: '/people' },
    { key: 'printable_card', label: 'Carte imprimable', icon: 'Printer', color: 'bg-accent/10 text-accent', to: '/studio/imprimables' },
    { key: 'logo', label: 'Créer un logo', icon: 'Gem', color: 'bg-coral/10 text-coral', to: '/studio/logos' },
    { key: 'flyer', label: 'Concevoir un flyer', icon: 'FileText', color: 'bg-info/10 text-info', to: '/studio/flyers' },
  ];

  const recentProjects = (summary && summary.recent) || [];

  // Filter projects based on search query
  const filteredProjects = searchQuery
    ? recentProjects.filter(p => {
        const mod = getModule(p.type);
        const searchTerm = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(searchTerm) ||
          (mod && mod.label.toLowerCase().includes(searchTerm))
        );
      })
    : recentProjects;

  return (
    <StudioLayout title="Bienvenue sur Macarte" subtitle="Créez des designs professionnels en quelques clics.">
      {error && <p className="mb-6 rounded-lg bg-error-bg dark:bg-error-bg-dark px-4 py-3 text-sm text-error-text dark:text-error-text-dark">{error}</p>}

      {/* Welcome Section with Search */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-action/5 to-accent/5 border border-border-subtle dark:border-border-subtle-dark p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
              Bonjour, {user?.email?.split('@')[0] || 'créateur'} <Sparkles className="inline w-6 h-6 text-coral" />
            </h1>
            <p className="text-text-muted dark:text-text-muted-dark max-w-lg">
              Que souhaitez-vous créer aujourd'hui ? Choisissez parmi nos outils de design professionnel.
            </p>
          </div>
          <div className="w-full md:w-96">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted-subtle" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark text-text-primary dark:text-text-primary-dark placeholder:text-text-muted-subtle focus:outline-none focus:ring-2 focus:ring-action/20 focus:border-action transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Most Popular */}
      <section className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary dark:text-text-primary-dark">
          <TrendingUp className="h-5 w-5 text-action" /> Créations populaires
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.key}
              to={action.to}
              className="group flex flex-col items-center p-5 rounded-xl border border-border-subtle dark:border-border-subtle-dark bg-card dark:bg-card-dark hover:border-action/30 hover:shadow-lifted transition-all duration-200"
            >
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${action.color} transition group-hover:scale-110`}>
                <Icon name={action.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-3 font-semibold text-text-primary dark:text-text-primary-dark text-center">{action.label}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* All Categories */}
      <section className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary dark:text-text-primary-dark">
          <Star className="h-5 w-5 text-accent" /> Tous les outils
        </h2>
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
      </section>

      {/* Recent Projects */}
      {filteredProjects.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary dark:text-text-primary-dark">
            <Clock className="h-5 w-5 text-accent" /> Créations récentes
            {searchQuery && <span className="text-sm text-text-muted dark:text-text-muted-dark font-normal">({filteredProjects.length} résultat{filteredProjects.length > 1 ? 's' : ''})</span>}
          </h2>
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {filteredProjects.map((p) => {
                const mod = getModule(p.type);
                return (
                  <Link key={p.id} to={`/studio/${mod.slug}/${p.id}`} className="overflow-hidden rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark hover:shadow-lifted transition group">
                    <div className="flex aspect-[4/3] items-center justify-center bg-surface dark:bg-surface-dark">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt="" className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-200" />
                      ) : (
                        <Icon name={mod.icon} className="h-8 w-8 text-text-muted-subtle" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-medium text-text-primary dark:text-text-primary-dark">{p.title}</p>
                      <p className="text-xs text-text-muted dark:text-text-muted-dark">{mod.label} · {formatDate(p.updatedAt)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-text-muted dark:text-text-muted-dark py-8 text-center">Aucun projet ne correspond à votre recherche.</p>
          )}
        </section>
      )}
    </StudioLayout>
  );
}
