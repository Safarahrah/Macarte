// src/design/studio/PrintableStudio.jsx
// Dashboard integration of the existing printable-card editor (PrintTab).
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, Pencil, Plus, Printer, Trash2 } from 'lucide-react';
import PrintTab from '../../printable/PrintTab';
import StudioLayout, { Loading } from './StudioLayout';
import { api, formatDate, getCsrf, useSession } from './api';

export default function PrintableStudio() {
  const { user, loading } = useSession();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState(null);
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');
  const [picker, setPicker] = useState(false);
  const [editor, setEditor] = useState(null);
  const [csrf, setCsrf] = useState('');

  const designId = params.get('design');
  const cardSlug = params.get('card');
  const cardUser = params.get('user');

  const refresh = useCallback(async () => {
    try {
      const [d, c] = await Promise.all([api('GET', '/api/printable-cards'), api('GET', '/api/admin/cards')]);
      setDesigns(d);
      setCards(c.filter((x) => x.slug));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { if (user) { refresh(); getCsrf().then(setCsrf).catch(() => {}); } }, [user, refresh]);

  // Open the editor: load the linked digital card (if any) so PrintTab can prefill fields / QR.
  useEffect(() => {
    if (!user || (!designId && !cardSlug)) { setEditor(null); return; }
    let cancelled = false;
    (async () => {
      let data = {};
      if (cardSlug) {
        const listed = cards.find((c) => c.slug === cardSlug && (!cardUser || c.userId === cardUser));
        const url = cardUser && cardUser !== user.id ? `/api/admin/cards/${cardUser}/${cardSlug}` : `/api/cards/${cardSlug}`;
        try {
          data = await api('GET', url);
          data._shortCode = data._shortCode || (listed && listed.shortCode) || '';
        } catch (e) { data = {}; }
      }
      if (!cancelled) setEditor({ data, slug: cardSlug || '', designId });
    })();
    return () => { cancelled = true; };
  }, [user, designId, cardSlug, cardUser, cards]);

  if (loading) return <Loading />;

  if (designId || cardSlug) {
    return (
      <StudioLayout title="Éditeur de carte imprimable" subtitle={cardSlug ? `Carte liée : /${cardSlug}` : 'Design enregistré'} back="/studio/imprimables" wide>
        <div className="rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark p-4 md:p-6">
          {editor ? <PrintTab key={`${designId}-${cardSlug}`} data={editor.data} slug={editor.slug} csrfToken={csrf} initialDesignId={editor.designId} /> : <Loading label="Ouverture de l’éditeur…" />}
        </div>
      </StudioLayout>
    );
  }

  const open = (d) => {
    const q = new URLSearchParams({ design: d.id });
    if (d.digital_card_slug) { q.set('card', d.digital_card_slug); q.set('user', d.user_id); }
    navigate(`/studio/imprimables?${q.toString()}`);
  };
  const duplicate = async (d) => {
    try { await api('POST', `/api/printable-cards/${d.id}/duplicate`, {}); refresh(); } catch (e) { setError(e.message); }
  };
  const remove = async (d) => {
    if (!window.confirm(`Supprimer « ${d.name} » ?`)) return;
    try { await api('DELETE', `/api/printable-cards/${d.id}`); refresh(); } catch (e) { setError(e.message); }
  };

  return (
    <StudioLayout
      title="Cartes imprimables"
      subtitle="Créez vos cartes de visite à imprimer à partir de vos cartes numériques."
      back="/dashboard"
      actions={<button type="button" className="ui-btn ui-btn-primary" onClick={() => setPicker(true)}><Plus className="h-4 w-4" /> Nouvelle carte imprimable</button>}
    >
      {error && <p className="mb-6 rounded-lg bg-error-bg dark:bg-error-bg-dark px-4 py-3 text-sm text-error-text dark:text-error-text-dark">{error}</p>}
      {picker && (
        <div className="mb-8 rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark p-5">
          <h2 className="mb-3 font-semibold text-text-primary dark:text-text-primary-dark">Partir de quelle carte numérique ?</h2>
          {cards.length === 0 ? (
            <p className="text-sm text-text-muted dark:text-text-muted-dark">Aucune carte numérique. <button type="button" className="text-action underline" onClick={() => navigate('/people')}>Créez-en une d’abord</button>.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <button key={`${c.userId}-${c.slug}`} type="button" onClick={() => navigate(`/studio/imprimables?card=${encodeURIComponent(c.slug)}&user=${encodeURIComponent(c.userId || user.id)}`)}
                  className="rounded-lg border border-border dark:border-border-dark px-4 py-3 text-left hover:border-action hover:bg-surface dark:hover:bg-surface-dark">
                  <p className="font-medium text-text-primary dark:text-text-primary-dark">{c.name || c.slug}</p>
                  <p className="text-xs text-text-muted dark:text-text-muted-dark">/{c.slug}{c.title ? ` · ${c.title}` : ''}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {!designs ? <Loading /> : designs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border dark:border-border-dark bg-card dark:bg-card-dark py-16 text-center text-text-muted dark:text-text-muted-dark">
          <Printer className="mx-auto mb-3 h-8 w-8" />
          Aucun design imprimable enregistré pour l’instant.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((d) => (
            <div key={d.id} className="flex flex-col rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface dark:bg-surface-dark"><Printer className="h-5 w-5 text-text-muted" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary dark:text-text-primary-dark">{d.name}</p>
                  <p className="text-xs text-text-muted dark:text-text-muted-dark">{d.digital_card_slug ? `/${d.digital_card_slug} · ` : ''}{formatDate(d.updated_at)}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" className="ui-btn ui-btn-primary flex-1 text-sm" onClick={() => open(d)}><Pencil className="h-4 w-4" /> Ouvrir</button>
                <button type="button" className="ui-btn ui-btn-secondary text-sm" onClick={() => duplicate(d)} title="Dupliquer"><Copy className="h-4 w-4" /></button>
                <button type="button" className="ui-btn ui-btn-secondary text-sm" onClick={() => remove(d)} title="Supprimer"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </StudioLayout>
  );
}
