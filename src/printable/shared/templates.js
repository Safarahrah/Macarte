// src/printable/shared/templates.js

export const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimalist',
    description: 'Open layout, thin rule, quiet hierarchy.',
    category: 'professional',
    tags: ['clean', 'elegant', 'corporate'],
    isPremium: false,
    colors: {
      primary: '#111111',
      secondary: '#6b7280',
      text: '#111111',
      background: '#ffffff',
      accent: '#111111'
    },
    fonts: { heading: 'sans', body: 'sans' },
    typeScale: { name: 13, title: 7.5, body: 6.5 },
    alignment: 'left',
    pdfFontFamily: 'Helvetica',
    pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 70, y: 8, size: 18 },
    defaultLogoPosition: { x: 8, y: 8, w: 14, h: 14 },
    safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Sidebar brand block with stacked contact details.',
    category: 'professional',
    tags: ['brand', 'structured', 'traditional'],
    isPremium: false,
    colors: {
      primary: '#0f2744',
      secondary: '#c5a572',
      text: '#1f2937',
      background: '#f7f5f2',
      accent: '#0f2744'
    },
    fonts: { heading: 'sans', body: 'sans' },
    typeScale: { name: 12, title: 7, body: 6.2 },
    alignment: 'left',
    pdfFontFamily: 'Helvetica',
    pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 70, y: 8, size: 16 },
    defaultLogoPosition: { x: 4, y: 6, w: 14, h: 14 },
    safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Bold colour field and a dedicated QR panel.',
    category: 'creative',
    tags: ['bold', 'colorful', 'dynamic'],
    isPremium: false,
    colors: {
      primary: '#2563eb',
      secondary: '#f97316',
      text: '#ffffff',
      background: '#1d4ed8',
      accent: '#ffffff'
    },
    fonts: { heading: 'sans', body: 'sans' },
    typeScale: { name: 16, title: 7.5, body: 6.4 },
    alignment: 'left',
    pdfFontFamily: 'Helvetica-Bold',
    pdfFontSizeMultiplier: 1.1,
    defaultQrPosition: { x: 72, y: 10, size: 20 },
    defaultLogoPosition: { x: 8, y: 30, w: 16, h: 16 },
    safeAreaPadding: { top: 5, right: 5, bottom: 5, left: 5 }
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Centered serif composition with a gold rule.',
    category: 'premium',
    tags: ['elegant', 'serif', 'gold', 'high-end'],
    isPremium: true,
    colors: {
      primary: '#c9a227',
      secondary: '#e8d5a3',
      text: '#f4efe4',
      background: '#161410',
      accent: '#c9a227'
    },
    fonts: { heading: 'serif', body: 'serif' },
    typeScale: { name: 13, title: 7.2, body: 6.2 },
    alignment: 'center',
    pdfFontFamily: 'Times-Roman',
    pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 68, y: 8, size: 16 },
    defaultLogoPosition: { x: 34, y: 4, w: 16, h: 16 },
    safeAreaPadding: { top: 5, right: 5, bottom: 5, left: 5 }
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Asymmetric colour shape with overlapping type.',
    category: 'creative',
    tags: ['artistic', 'asymmetric', 'vibrant'],
    isPremium: false,
    colors: {
      primary: '#db2777',
      secondary: '#0f172a',
      text: '#0f172a',
      background: '#fff7ed',
      accent: '#fb7185'
    },
    fonts: { heading: 'sans', body: 'sans' },
    typeScale: { name: 15, title: 7.2, body: 6.3 },
    alignment: 'left',
    pdfFontFamily: 'Helvetica-Bold',
    pdfFontSizeMultiplier: 1.05,
    defaultQrPosition: { x: 8, y: 30, size: 16 },
    defaultLogoPosition: { x: 8, y: 8, w: 14, h: 14 },
    safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'tech',
    name: 'Technology',
    description: 'Dark grid, monospace labels, large scan target.',
    category: 'professional',
    tags: ['dark', 'monospace', 'grid', 'futuristic'],
    isPremium: false,
    colors: {
      primary: '#22d3ee',
      secondary: '#94a3b8',
      text: '#e2e8f0',
      background: '#020617',
      accent: '#22d3ee'
    },
    fonts: { heading: 'mono', body: 'mono' },
    typeScale: { name: 11.5, title: 6.8, body: 6 },
    alignment: 'left',
    pdfFontFamily: 'Courier',
    pdfFontSizeMultiplier: 0.95,
    defaultQrPosition: { x: 66, y: 8, size: 22 },
    defaultLogoPosition: { x: 74, y: 2, w: 6, h: 6 },
    safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  }
];

/**
 * Get template by ID
 * @param {string} templateId 
 * @returns {object} Template config or first template as fallback
 */
export function getTemplate(templateId) {
  return TEMPLATES.find((item) => item.id === templateId) || TEMPLATES[0];
}

/**
 * Get template by exact match (returns undefined if not found)
 * @param {string} templateId 
 * @returns {object|undefined}
 */
export function getTemplateById(templateId) {
  return TEMPLATES.find((item) => item.id === templateId);
}

/**
 * Get all templates in a specific category
 * @param {string} category - 'professional' | 'creative' | 'premium'
 * @returns {array} Filtered templates
 */
export function getTemplatesByCategory(category) {
  return TEMPLATES.filter(t => t.category === category);
}

/**
 * Get all available categories
 * @returns {array} Unique category names
 */
export function getCategories() {
  return [...new Set(TEMPLATES.map(t => t.category))];
}

/**
 * Generate a default editor configuration from a template
 * @param {string} templateId 
 * @returns {object} Full editor-ready config
 */
export function getDefaultTemplateConfig(templateId = 'minimal') {
  const template = getTemplate(templateId);
  return {
    templateId: template.id,
    colors: { ...template.colors },
    fonts: { ...template.fonts },
    typeScale: { ...template.typeScale },
    alignment: template.alignment,
    qr: { ...template.defaultQrPosition },
    logo: { ...template.defaultLogoPosition, url: '' },
    elementOverrides: {},
    safeAreaPadding: { ...template.safeAreaPadding }
  };
}

/**
 * Check if a template exists
 * @param {string} templateId 
 * @returns {boolean}
 */
export function hasTemplate(templateId) {
  return TEMPLATES.some(t => t.id === templateId);
}

/**
 * Get total number of templates
 * @returns {number}
 */
export function getTemplateCount() {
  return TEMPLATES.length;
}