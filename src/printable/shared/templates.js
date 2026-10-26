// src/printable/shared/templates.js
// Business-card design presets consumed by the print layout engine.
// `category` is one of the ids in CATEGORIES below.

export const CATEGORIES = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'modern', label: 'Modern' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'creative', label: 'Creative' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'technology', label: 'Technology' }
];

export const TEMPLATES = [
  {
    id: 'minimal', name: 'Minimalist', description: 'Open layout, thin rule, quiet hierarchy.', category: 'minimal', tags: ['clean', 'elegant', 'corporate'], isPremium: false,
    colors: { primary: '#111111', secondary: '#6b7280', text: '#111111', background: '#ffffff', accent: '#111111' },
    fonts: { heading: 'sans', body: 'sans' }, typeScale: { name: 13, title: 7.5, body: 6.5 }, alignment: 'left', pdfFontFamily: 'Helvetica', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 70, y: 8, size: 18 }, defaultLogoPosition: { x: 8, y: 8, w: 14, h: 14 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'minimal-ink', name: 'Ink Rule', description: 'Editorial whitespace with a bold left rule.', category: 'minimal', tags: ['minimal', 'editorial', 'clean'], isPremium: false,
    colors: { primary: '#0f172a', secondary: '#64748b', text: '#0f172a', background: '#ffffff', accent: '#0f172a' },
    fonts: { heading: 'poppins', body: 'inter' }, typeScale: { name: 14, title: 7.2, body: 6.2 }, alignment: 'left', pdfFontFamily: 'Helvetica-Bold', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 70, y: 8, size: 16 }, defaultLogoPosition: { x: 16, y: 6, w: 11, h: 11 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'nordic', name: 'Nordic Minimal', description: 'Scandinavian simplicity with natural colors.', category: 'minimal', tags: ['minimal', 'nordic', 'clean'], isPremium: false,
    colors: { primary: '#344B43', secondary: '#8B9B8A', text: '#26332D', background: '#F7F6F0', accent: '#D7CBB5' },
    fonts: { heading: 'sans', body: 'sans' }, typeScale: { name: 13.5, title: 7.2, body: 6.2 }, alignment: 'left', pdfFontFamily: 'Helvetica', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 69, y: 19, size: 15 }, defaultLogoPosition: { x: 7, y: 5, w: 11, h: 11 }, safeAreaPadding: { top: 5, right: 5, bottom: 5, left: 5 }
  },
  {
    id: 'modern', name: 'Modern', description: 'Bold colour field and a dedicated QR panel.', category: 'modern', tags: ['bold', 'colorful', 'dynamic'], isPremium: false,
    colors: { primary: '#2563eb', secondary: '#f97316', text: '#ffffff', background: '#1d4ed8', accent: '#ffffff' },
    fonts: { heading: 'sans', body: 'sans' }, typeScale: { name: 16, title: 7.5, body: 6.4 }, alignment: 'left', pdfFontFamily: 'Helvetica-Bold', pdfFontSizeMultiplier: 1.1,
    defaultQrPosition: { x: 72, y: 10, size: 20 }, defaultLogoPosition: { x: 8, y: 30, w: 16, h: 16 }, safeAreaPadding: { top: 5, right: 5, bottom: 5, left: 5 }
  },
  {
    id: 'modern-gradient', name: 'Gradient Flow', description: 'Soft gradient wash with rounded accents.', category: 'modern', tags: ['gradient', 'modern', 'vibrant'], isPremium: false,
    colors: { primary: '#6366f1', secondary: '#0ea5e9', text: '#ffffff', background: '#312e81', accent: '#22d3ee' },
    fonts: { heading: 'poppins', body: 'inter' }, typeScale: { name: 15, title: 7.4, body: 6.3 }, alignment: 'left', pdfFontFamily: 'Helvetica-Bold', pdfFontSizeMultiplier: 1.05,
    defaultQrPosition: { x: 69, y: 19, size: 15 }, defaultLogoPosition: { x: 8, y: 8, w: 12, h: 12 }, safeAreaPadding: { top: 5, right: 5, bottom: 5, left: 5 }
  },
  {
    id: 'editorial', name: 'Editorial Grid', description: 'Asymmetric typography and modern graphic structure.', category: 'modern', tags: ['editorial', 'typography', 'modern'], isPremium: false,
    colors: { primary: '#F97316', secondary: '#64748B', text: '#18181B', background: '#FAFAF9', accent: '#F97316' },
    fonts: { heading: 'sans', body: 'sans' }, typeScale: { name: 14, title: 7.2, body: 6.1 }, alignment: 'left', pdfFontFamily: 'Helvetica-Bold', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 69, y: 19, size: 15 }, defaultLogoPosition: { x: 7, y: 5, w: 11, h: 11 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'corporate', name: 'Corporate', description: 'Sidebar brand block with stacked contact details.', category: 'corporate', tags: ['brand', 'structured', 'traditional'], isPremium: false,
    colors: { primary: '#0f2744', secondary: '#c5a572', text: '#1f2937', background: '#f7f5f2', accent: '#0f2744' },
    fonts: { heading: 'sans', body: 'sans' }, typeScale: { name: 12, title: 7, body: 6.2 }, alignment: 'left', pdfFontFamily: 'Helvetica', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 70, y: 8, size: 16 }, defaultLogoPosition: { x: 4, y: 6, w: 14, h: 14 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'corporate-bold', name: 'Corporate Bold', description: 'Strong navy blocks and crisp business typography.', category: 'corporate', tags: ['corporate', 'bold', 'business'], isPremium: false,
    colors: { primary: '#142D4E', secondary: '#F59E0B', text: '#172338', background: '#FFFFFF', accent: '#F59E0B' },
    fonts: { heading: 'sans', body: 'sans' }, typeScale: { name: 13.5, title: 7.2, body: 6.2 }, alignment: 'left', pdfFontFamily: 'Helvetica-Bold', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 69, y: 19, size: 15 }, defaultLogoPosition: { x: 7, y: 5, w: 11, h: 11 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'corporate-executive', name: 'Executive', description: 'Top band, refined serif and a gold hairline.', category: 'corporate', tags: ['executive', 'serif', 'premium'], isPremium: true,
    colors: { primary: '#0b2e4f', secondary: '#b08d57', text: '#111827', background: '#ffffff', accent: '#0b2e4f' },
    fonts: { heading: 'montserrat', body: 'inter' }, typeScale: { name: 13.5, title: 7.1, body: 6.2 }, alignment: 'left', pdfFontFamily: 'Times-Roman', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 69, y: 19, size: 15 }, defaultLogoPosition: { x: 9, y: 13, w: 11, h: 11 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'luxury', name: 'Luxury', description: 'Centered serif composition with a gold rule.', category: 'luxury', tags: ['elegant', 'serif', 'gold', 'high-end'], isPremium: true,
    colors: { primary: '#c9a227', secondary: '#e8d5a3', text: '#f4efe4', background: '#161410', accent: '#c9a227' },
    fonts: { heading: 'serif', body: 'serif' }, typeScale: { name: 13, title: 7.2, body: 6.2 }, alignment: 'center', pdfFontFamily: 'Times-Roman', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 68, y: 8, size: 16 }, defaultLogoPosition: { x: 34, y: 4, w: 16, h: 16 }, safeAreaPadding: { top: 5, right: 5, bottom: 5, left: 5 }
  },
  {
    id: 'luxury-gold', name: 'Luxury Gold', description: 'Black, gold and refined premium typography.', category: 'luxury', tags: ['luxury', 'gold', 'elegant'], isPremium: true,
    colors: { primary: '#D4AF37', secondary: '#BFA66A', text: '#F8F1DF', background: '#11100D', accent: '#D4AF37' },
    fonts: { heading: 'serif', body: 'serif' }, typeScale: { name: 14, title: 7.5, body: 6.2 }, alignment: 'left', pdfFontFamily: 'Times-Roman', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 68, y: 19, size: 15 }, defaultLogoPosition: { x: 7, y: 5, w: 12, h: 12 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'luxury-noir', name: 'Noir', description: 'Deep black, hairline frame, quiet elegance.', category: 'luxury', tags: ['noir', 'dark', 'minimal', 'premium'], isPremium: true,
    colors: { primary: '#c8a96a', secondary: '#8a7a55', text: '#f5f2ea', background: '#0b0b0c', accent: '#c8a96a' },
    fonts: { heading: 'montserrat', body: 'inter' }, typeScale: { name: 12.5, title: 7, body: 6.1 }, alignment: 'left', pdfFontFamily: 'Helvetica', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 69, y: 19, size: 15 }, defaultLogoPosition: { x: 9, y: 9, w: 10, h: 10 }, safeAreaPadding: { top: 5, right: 5, bottom: 5, left: 5 }
  },
  {
    id: 'creative', name: 'Creative', description: 'Asymmetric colour shape with overlapping type.', category: 'creative', tags: ['artistic', 'asymmetric', 'vibrant'], isPremium: false,
    colors: { primary: '#db2777', secondary: '#0f172a', text: '#0f172a', background: '#fff7ed', accent: '#fb7185' },
    fonts: { heading: 'sans', body: 'sans' }, typeScale: { name: 15, title: 7.2, body: 6.3 }, alignment: 'left', pdfFontFamily: 'Helvetica-Bold', pdfFontSizeMultiplier: 1.05,
    defaultQrPosition: { x: 8, y: 30, size: 16 }, defaultLogoPosition: { x: 8, y: 8, w: 14, h: 14 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'creative-pop', name: 'Colour Pop', description: 'Bold geometric blocks and vivid accents.', category: 'creative', tags: ['pop', 'geometric', 'bold'], isPremium: false,
    colors: { primary: '#f43f5e', secondary: '#facc15', text: '#111827', background: '#fff7ed', accent: '#6366f1' },
    fonts: { heading: 'poppins', body: 'inter' }, typeScale: { name: 15.5, title: 7.3, body: 6.3 }, alignment: 'left', pdfFontFamily: 'Helvetica-Bold', pdfFontSizeMultiplier: 1.05,
    defaultQrPosition: { x: 69, y: 19, size: 15 }, defaultLogoPosition: { x: 8, y: 8, w: 12, h: 12 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'artistic', name: 'Artistic Flow', description: 'Expressive color blocks and asymmetric composition.', category: 'creative', tags: ['artistic', 'abstract', 'colorful'], isPremium: false,
    colors: { primary: '#7C3AED', secondary: '#F472B6', text: '#25143B', background: '#FFF7ED', accent: '#FDBA74' },
    fonts: { heading: 'sans', body: 'sans' }, typeScale: { name: 14, title: 7.5, body: 6.2 }, alignment: 'left', pdfFontFamily: 'Helvetica-Bold', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 69, y: 19, size: 15 }, defaultLogoPosition: { x: 7, y: 5, w: 11, h: 11 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'vintage', name: 'Vintage Paper', description: 'Warm paper tones and classic editorial details.', category: 'creative', tags: ['vintage', 'retro', 'classic'], isPremium: false,
    colors: { primary: '#70452C', secondary: '#A47750', text: '#3B2B21', background: '#F4E8D4', accent: '#B88A55' },
    fonts: { heading: 'serif', body: 'serif' }, typeScale: { name: 13, title: 7.2, body: 6.1 }, alignment: 'left', pdfFontFamily: 'Times-Roman', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 69, y: 19, size: 15 }, defaultLogoPosition: { x: 7, y: 5, w: 11, h: 11 }, safeAreaPadding: { top: 5, right: 5, bottom: 5, left: 5 }
  },
  {
    id: 'botanical', name: 'Botanical Zen', description: 'Sage green and calm botanical-inspired lines.', category: 'healthcare', tags: ['wellness', 'botanical', 'spa'], isPremium: false,
    colors: { primary: '#496B55', secondary: '#91A98B', text: '#263C30', background: '#F5F3E9', accent: '#C6A878' },
    fonts: { heading: 'serif', body: 'sans' }, typeScale: { name: 13.5, title: 7.2, body: 6.1 }, alignment: 'left', pdfFontFamily: 'Times-Roman', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 69, y: 19, size: 15 }, defaultLogoPosition: { x: 7, y: 5, w: 11, h: 11 }, safeAreaPadding: { top: 5, right: 5, bottom: 5, left: 5 }
  },
  {
    id: 'healthcare-clean', name: 'Clinic Clean', description: 'Clinical white with a teal care mark.', category: 'healthcare', tags: ['health', 'clinic', 'clean'], isPremium: false,
    colors: { primary: '#0e7490', secondary: '#67e8f9', text: '#0f172a', background: '#ffffff', accent: '#14b8a6' },
    fonts: { heading: 'inter', body: 'inter' }, typeScale: { name: 13.5, title: 7.1, body: 6.2 }, alignment: 'left', pdfFontFamily: 'Helvetica-Bold', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 69, y: 19, size: 15 }, defaultLogoPosition: { x: 9, y: 9, w: 11, h: 11 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'healthcare-soft', name: 'Care Soft', description: 'Soft mint tones and rounded shapes.', category: 'healthcare', tags: ['health', 'soft', 'calm'], isPremium: false,
    colors: { primary: '#2e7d6f', secondary: '#a7f3d0', text: '#134e4a', background: '#f0fdfa', accent: '#5eead4' },
    fonts: { heading: 'poppins', body: 'inter' }, typeScale: { name: 14, title: 7.2, body: 6.2 }, alignment: 'left', pdfFontFamily: 'Helvetica-Bold', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 69, y: 19, size: 15 }, defaultLogoPosition: { x: 9, y: 9, w: 11, h: 11 }, safeAreaPadding: { top: 5, right: 5, bottom: 5, left: 5 }
  },
  {
    id: 'tech', name: 'Technology', description: 'Dark grid, monospace labels, large scan target.', category: 'technology', tags: ['dark', 'monospace', 'grid', 'futuristic'], isPremium: false,
    colors: { primary: '#22d3ee', secondary: '#94a3b8', text: '#e2e8f0', background: '#020617', accent: '#22d3ee' },
    fonts: { heading: 'mono', body: 'mono' }, typeScale: { name: 11.5, title: 6.8, body: 6 }, alignment: 'left', pdfFontFamily: 'Courier', pdfFontSizeMultiplier: 0.95,
    defaultQrPosition: { x: 66, y: 8, size: 22 }, defaultLogoPosition: { x: 74, y: 2, w: 6, h: 6 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'tech-circuit', name: 'Circuit', description: 'Precision circuit traces on a deep panel.', category: 'technology', tags: ['circuit', 'tech', 'dark'], isPremium: false,
    colors: { primary: '#38bdf8', secondary: '#475569', text: '#e2e8f0', background: '#0b1220', accent: '#22d3ee' },
    fonts: { heading: 'roboto', body: 'roboto' }, typeScale: { name: 12.5, title: 7, body: 6.1 }, alignment: 'left', pdfFontFamily: 'Helvetica-Bold', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 67, y: 19, size: 16 }, defaultLogoPosition: { x: 9, y: 9, w: 10, h: 10 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    id: 'neon', name: 'Neon Future', description: 'Cyber-inspired dark card with electric accents.', category: 'technology', tags: ['neon', 'tech', 'futuristic'], isPremium: false,
    colors: { primary: '#22D3EE', secondary: '#A78BFA', text: '#E5F7FF', background: '#07111F', accent: '#F472B6' },
    fonts: { heading: 'mono', body: 'sans' }, typeScale: { name: 12.5, title: 7, body: 6 }, alignment: 'left', pdfFontFamily: 'Courier', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 69, y: 19, size: 15 }, defaultLogoPosition: { x: 7, y: 5, w: 11, h: 11 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  },
  {
    // Hidden preset used by "Importer ma carte": the uploaded image is rendered
    // full-bleed as background (config.background.url) with editable elements on top.
    id: 'custom', name: 'Ma carte importée', description: 'Votre visuel utilisé comme fond, avec vos éléments par-dessus.', category: 'creative', tags: ['import', 'custom'], isPremium: false, hidden: true,
    colors: { primary: '#0f172a', secondary: '#64748b', text: '#0f172a', background: '#ffffff', accent: '#0f172a' },
    fonts: { heading: 'inter', body: 'inter' }, typeScale: { name: 12, title: 7, body: 6.2 }, alignment: 'left', pdfFontFamily: 'Helvetica-Bold', pdfFontSizeMultiplier: 1.0,
    defaultQrPosition: { x: 69, y: 19, size: 16 }, defaultLogoPosition: { x: 9, y: 9, w: 11, h: 11 }, safeAreaPadding: { top: 4, right: 4, bottom: 4, left: 4 }
  }
];

/** Public designs (excludes internal presets such as `custom`). */
export const PUBLIC_TEMPLATES = TEMPLATES.filter((t) => !t.hidden);

/** Get template by ID, falling back to the first template. */
export function getTemplate(templateId) {
  return TEMPLATES.find((item) => item.id === templateId) || TEMPLATES[0];
}

/** Get template by exact ID, or undefined when it does not exist. */
export function getTemplateById(templateId) {
  return TEMPLATES.find((item) => item.id === templateId);
}

/** Get all templates in a category. */
export function getTemplatesByCategory(category) {
  return PUBLIC_TEMPLATES.filter((t) => t.category === category);
}

/** Ordered category ids that actually have at least one public template. */
export function getCategories() {
  return CATEGORIES.filter((c) => PUBLIC_TEMPLATES.some((t) => t.category === c.id)).map((c) => c.id);
}

/** Category label for a given id. */
export function getCategoryLabel(id) {
  const found = CATEGORIES.find((c) => c.id === id);
  return found ? found.label : id;
}

/** Generate a default editor configuration from a template. */
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

/** Check whether a template ID exists. */
export function hasTemplate(templateId) {
  return TEMPLATES.some((t) => t.id === templateId);
}

/** Return the number of available public templates. */
export function getTemplateCount() {
  return PUBLIC_TEMPLATES.length;
}
