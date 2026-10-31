// src/design/studio/StudioApp.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import Dashboard from './Dashboard';
import DesignLibrary from './DesignLibrary';
import DesignEditor from './DesignEditor';
import PrintableStudio from './PrintableStudio';
import StudioLayout from './StudioLayout';
import { getModuleBySlug } from '../shared/modules';

export function StudioDashboard() {
  return <Dashboard />;
}

export function StudioModule() {
  const { module: slug, id } = useParams();
  if (slug === 'imprimables') return <PrintableStudio />;
  const mod = getModuleBySlug(slug);
  if (!mod) {
    return <StudioLayout title="Rubrique introuvable" back="/dashboard"><p className="text-text-muted">Cette rubrique n’existe pas.</p></StudioLayout>;
  }
  return id ? <DesignEditor key={id} mod={mod} id={id} /> : <DesignLibrary key={slug} mod={mod} />;
}
