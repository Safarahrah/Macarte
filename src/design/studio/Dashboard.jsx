// src/design/studio/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Search, Sparkles, Star, TrendingUp, Lock, Download, Image as ImageIcon } from 'lucide-react';
import StudioLayout, { useCategories, Icon, Loading } from './StudioLayout';
import { api, formatDate, useSession } from './api';
import { getModule } from '../shared/modules';

export default function Dashboard() {
  const { user, loading } = useSession();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const CATEGORIES = useCategories();

  useEffect(() => {
    if (!user) return;
    api('GET', '/api/designs/summary').then(setSummary).catch((e) => setError(e.message));
  }, [user]);

  if (loading) return <Loading />;
  const counts = (summary && summary.counts) || {};

  // Quick action shortcuts - most common use cases
  const quickActions = [
    { key: 'digital_card', label: 'Carte de visite', icon: 'Contact', color: 'from-violet-500 to-purple-600', to: '/people' },
    { key: 'printable_card', label: 'Carte imprimable', icon: 'Printer', color: 'from-cyan-500 to-teal-600', to: '/studio/imprimables' },
    { key: 'logo', label: 'Créer un logo', icon: 'Gem', color: 'from-orange-500 to-amber-600', to: '/studio/logos' },
    { key: 'flyer', label: 'Concevoir un flyer', icon: 'FileText', color: 'from-blue-500 to-indigo-600', to: '/studio/flyers' },
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

      {/* Hero Section - Modern Midjourney-style */}
      <div className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-cyan-300" />
            <span className="text-sm font-medium text-cyan-200 uppercase tracking-wider">Studio de création</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Bonjour, {user?.email?.split('@')[0] || 'créateur'}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mb-8">
            Transformez vos idées en designs professionnels. Logos, flyers, affiches, publications sociales et plus encore.
          </p>

          {/* Search bar integrated in hero */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="text"
              placeholder="Rechercher un projet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions - Modern Card Grid */}
      <section className="mb-10">
        <h2 className="mb-6 text-2xl font-bold text-text-primary dark:text-text-primary-dark flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-action" /> Créations populaires
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.key}
              to={action.to}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br bg-card dark:bg-card-dark border border-border-subtle dark:border-border-subtle-dark hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              <div className="relative p-6 flex flex-col items-center">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon name={action.icon} className="h-8 w-8 text-white" />
                </div>
                <h3 className="mt-4 font-semibold text-text-primary dark:text-text-primary-dark text-center text-sm">{action.label}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* All Categories - Modern Grid */}
      <section className="mb-10">
        <h2 className="mb-6 text-2xl font-bold text-text-primary dark:text-text-primary-dark flex items-center gap-2">
          <Star className="h-6 w-6 text-accent" /> Tous les outils
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              to={c.to}
              data-testid={`category-${c.key}`}
              className="group relative overflow-hidden rounded-2xl border border-border-subtle dark:border-border-subtle-dark bg-card dark:bg-card-dark hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-action/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-action/20 to-accent/20 flex items-center justify-center">
                    <Icon name={c.icon} className="h-6 w-6 text-action" />
                  </div>
                  <span className="rounded-full bg-surface dark:bg-surface-dark px-3 py-1 text-xs font-semibold text-text-muted dark:text-text-muted-dark border border-border-subtle dark:border-border-subtle-dark">
                    {summary ? `${counts[c.key] || 0}` : '…'}
                  </span>
                </div>
                <h2 className="font-bold text-text-primary dark:text-text-primary-dark mb-1">{c.label}</h2>
                <p className="text-sm text-text-muted dark:text-text-muted-dark mb-3 line-clamp-2">{c.description}</p>
                <div className="flex items-center gap-1 text-sm font-medium text-action">
                  <span>Créer</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Projects - Midjourney-style Gallery */}
      {filteredProjects.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-bold text-text-primary dark:text-text-primary-dark flex items-center gap-2">
            <Clock className="h-6 w-6 text-accent" /> Créations récentes
            {searchQuery && <span className="text-sm text-text-muted dark:text-text-muted-dark font-normal">({filteredProjects.length} résultat{filteredProjects.length > 1 ? 's' : ''})</span>}
          </h2>
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProjects.map((p) => {
                const mod = getModule(p.type);
                const isPaid = p.paymentStatus === 'paid';
                return (
                  <Link key={p.id} to={`/studio/${mod.slug}/${p.id}`} className="group relative overflow-hidden rounded-2xl bg-card dark:bg-card-dark border border-border-subtle dark:border-border-subtle-dark hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    {/* Thumbnail with gradient overlay */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface dark:bg-surface-dark">
                      {p.thumbnail ? (
                        <>
                          <img
                            src={p.thumbnail}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-surface-subtle dark:from-surface-dark dark:to-surface-subtle-dark">
                          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-action/20 to-accent/20 flex items-center justify-center">
                            <Icon name={mod.icon} className="h-8 w-8 text-action" />
                          </div>
                        </div>
                      )}

                      {/* Payment status badge */}
                      <div className="absolute top-3 right-3">
                        {isPaid ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium">
                            <Download className="h-3 w-3" />
                            <span>Payé</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/90 backdrop-blur-sm text-white text-xs font-medium">
                            <Lock className="h-3 w-3" />
                            <span>4.99 $</span>
                          </div>
                        )}
                      </div>

                      {/* Hover overlay with action */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm text-text-primary text-sm font-medium shadow-lg">
                          Ouvrir
                        </div>
                      </div>
                    </div>

                    {/* Project info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-text-primary dark:text-text-primary-dark line-clamp-1">{p.title}</p>
                        <div className="h-8 w-8 rounded-lg bg-surface dark:bg-surface-dark flex items-center justify-center flex-shrink-0">
                          <Icon name={mod.icon} className="h-4 w-4 text-text-muted" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-muted dark:text-text-muted-dark">
                        <span>{mod.label}</span>
                        <span>{formatDate(p.updatedAt)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <ImageIcon className="h-16 w-16 text-text-muted-subtle mx-auto mb-4" />
              <p className="text-text-muted dark:text-text-muted-dark">Aucun projet ne correspond à votre recherche.</p>
            </div>
          )}
        </section>
      )}
    </StudioLayout>
  );
}
