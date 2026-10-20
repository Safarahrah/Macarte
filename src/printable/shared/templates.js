'use strict';

const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimalist',
    description: 'Open layout, thin rule, quiet hierarchy.',
    colors: {
      primary: '#111111',
      secondary: '#6b7280',
      text: '#111111',
      background: '#ffffff',
      accent: '#111111'
    },
    fonts: { heading: 'sans', body: 'sans' },
    typeScale: { name: 13, title: 7.5, body: 6.5 },
    alignment: 'left'
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Sidebar brand block with stacked contact details.',
    colors: {
      primary: '#0f2744',
      secondary: '#c5a572',
      text: '#1f2937',
      background: '#f7f5f2',
      accent: '#0f2744'
    },
    fonts: { heading: 'sans', body: 'sans' },
    typeScale: { name: 12, title: 7, body: 6.2 },
    alignment: 'left'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Bold colour field and a dedicated QR panel.',
    colors: {
      primary: '#2563eb',
      secondary: '#f97316',
      text: '#ffffff',
      background: '#1d4ed8',
      accent: '#ffffff'
    },
    fonts: { heading: 'sans', body: 'sans' },
    typeScale: { name: 16, title: 7.5, body: 6.4 },
    alignment: 'left'
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Centered serif composition with a gold rule.',
    colors: {
      primary: '#c9a227',
      secondary: '#e8d5a3',
      text: '#f4efe4',
      background: '#161410',
      accent: '#c9a227'
    },
    fonts: { heading: 'serif', body: 'serif' },
    typeScale: { name: 13, title: 7.2, body: 6.2 },
    alignment: 'center'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Asymmetric colour shape with overlapping type.',
    colors: {
      primary: '#db2777',
      secondary: '#0f172a',
      text: '#0f172a',
      background: '#fff7ed',
      accent: '#fb7185'
    },
    fonts: { heading: 'sans', body: 'sans' },
    typeScale: { name: 15, title: 7.2, body: 6.3 },
    alignment: 'left'
  },
  {
    id: 'tech',
    name: 'Technology',
    description: 'Dark grid, monospace labels, large scan target.',
    colors: {
      primary: '#22d3ee',
      secondary: '#94a3b8',
      text: '#e2e8f0',
      background: '#020617',
      accent: '#22d3ee'
    },
    fonts: { heading: 'mono', body: 'mono' },
    typeScale: { name: 11.5, title: 6.8, body: 6 },
    alignment: 'left'
  }
];

function getTemplate(templateId) {
  return TEMPLATES.find((item) => item.id === templateId) || TEMPLATES[0];
}

module.exports = {
  TEMPLATES,
  getTemplate
};
