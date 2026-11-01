// src/design/studio/TemplateGallery.jsx
// Shared template browser: search, Popular / New, style and industry filters,
// incremental loading. Tiles are rendered by the caller only for visible items.
import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

const PAGE = 24;

export default function TemplateGallery({ templates, styles = [], industries = [], renderTile, leading = null, compact = false, placeholder = 'Rechercher un modèle', gridClass }) {
  const [q, setQ] = useState('');
  const [axis, setAxis] = useState('all');
  const [cat, setCat] = useState('all');
  const [limit, setLimit] = useState(PAGE);
  const labels = useMemo(() => Object.fromEntries([...styles, ...industries].map((c) => [c.id, c.label])), [styles, industries]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return templates.filter((t) => {
      if (axis === 'popular' && !t.popular) return false;
      if (axis === 'new' && !t.isNew) return false;
      if (axis === 'style' && cat === 'all' && !(t.styles || []).length) return false;
      if (axis === 'industry' && cat === 'all' && !(t.industries || []).length) return false;
      if (cat !== 'all' && !(t.styles || []).includes(cat) && !(t.industries || []).includes(cat)) return false;
      if (!needle) return true;
      const hay = [t.name, ...(t.tags || []), ...(t.styles || []).map((id) => labels[id]), ...(t.industries || []).map((id) => labels[id])].join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [templates, axis, cat, q, labels]);

  const axes = [['all', 'Tous'], ['popular', 'Populaires'], ['new', 'Nouveautés']];
  if (styles.length) axes.push(['style', 'Par style']);
  if (industries.length) axes.push(['industry', 'Par industrie']);
  const cats = axis === 'style' ? styles : axis === 'industry' ? industries : [];
  const pill = (active) => `shrink-0 whitespace-nowrap rounded-full border ${compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} ${active ? 'border-action bg-action text-white' : 'border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark hover:border-action'}`;

  return (
    <div className="space-y-3" data-testid="template-gallery">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className={`relative w-full ${compact ? '' : 'sm:max-w-xs'}`}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input type="search" className="ui-input !pl-9" placeholder={placeholder} value={q} aria-label={placeholder}
            onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} data-testid="gallery-search" />
        </div>
        <p className="text-xs text-text-muted dark:text-text-muted-dark" data-testid="gallery-count">{filtered.length} modèles</p>
      </div>
      <div className={`flex gap-1.5 ${compact ? 'flex-wrap' : 'flex-wrap'}`} role="tablist" aria-label="Parcourir les modèles">
        {axes.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={axis === id} className={pill(axis === id)} data-testid={`gallery-axis-${id}`}
            onClick={() => { setAxis(id); setCat('all'); setLimit(PAGE); }}>{label}</button>
        ))}
      </div>
      {cats.length > 0 && (
        <div className={`flex gap-1.5 ${compact ? 'flex-wrap' : 'overflow-x-auto pb-1'}`} data-testid="gallery-categories">
          {cats.map((c) => (
            <button key={c.id} type="button" className={pill(cat === c.id)} data-testid={`gallery-cat-${c.id}`}
              onClick={() => { setCat(cat === c.id ? 'all' : c.id); setLimit(PAGE); }}>{c.label}</button>
          ))}
        </div>
      )}
      <div className={gridClass || (compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5')}>
        {leading}
        {filtered.slice(0, limit).map((t) => renderTile(t, labels))}
      </div>
      {filtered.length === 0 && <p className="text-sm text-text-muted">Aucun modèle ne correspond à cette recherche.</p>}
      {filtered.length > limit && (
        <button type="button" className="ui-btn ui-btn-secondary w-full !text-xs" onClick={() => setLimit((n) => n + PAGE)} data-testid="gallery-more">
          Afficher plus de modèles ({filtered.length - limit})
        </button>
      )}
    </div>
  );
}
