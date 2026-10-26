// src/printable/shared/sanitize.js
import { DEFAULT_DPI, DEFAULT_FORMAT_ID, FORMATS, FONT_STACKS } from './spec.js';
import { TEMPLATES } from './templates.js'; // Assurez-vous que templates.js exporte TEMPLATES

const SECRET_KEYS = ['password', 'passwordHash', 'token', 'secret', 'apiKey', 'jwt', 'csrf'];
const TEMPLATE_IDS = TEMPLATES.map((item) => item.id);
const FONT_IDS = Object.keys(FONT_STACKS);
const ALIGNMENTS = ['left', 'center', 'right'];

function clip(value, max) {
  return String(value || '').trim().substring(0, max);
}

function hexColor(value, fallback) {
  const raw = String(value || '').trim();
  if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(raw)) {
    return raw.length === 4
      ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase()
      : raw.toLowerCase();
  }
  return fallback;
}

function num(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function bool(value, fallback) {
  if (typeof value === 'boolean') return value;
  return fallback;
}

function stripSecrets(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return;
  Object.keys(input).forEach((key) => {
    if (SECRET_KEYS.some((secret) => key.toLowerCase().includes(secret.toLowerCase()))) {
      delete input[key];
    } else if (typeof input[key] === 'object') {
      stripSecrets(input[key]);
    }
  });
}

function sanitizeOverrides(overrides) {
  const result = {};
  if (!overrides || typeof overrides !== 'object') return result;
  Object.keys(overrides).slice(0, 60).forEach((id) => {
    const item = overrides[id] || {};
    result[clip(id, 40)] = {
      x: num(item.x, undefined, -20, 200),
      y: num(item.y, undefined, -20, 200),
      w: num(item.w, undefined, 4, 120),
      h: num(item.h, undefined, 4, 80)
    };
  });
  return result;
}

const CUSTOM_ELEMENT_TYPES = ['text', 'image'];

// User-added layers rendered on top of the template (free text, extra image).
function sanitizeCustomElements(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 20).map((el, index) => {
    const type = CUSTOM_ELEMENT_TYPES.includes(el && el.type) ? el.type : 'text';
    return {
      id: clip(el && el.id, 40) || `el-${index + 1}`,
      type,
      text: clip(el && el.text, 240),
      src: clip(el && el.src, 500),
      x: num(el && el.x, 8, -20, 200),
      y: num(el && el.y, 8, -20, 200),
      w: num(el && el.w, type === 'image' ? 20 : 45, 4, 120),
      h: num(el && el.h, type === 'image' ? 20 : 9, 4, 80),
      size: num(el && el.size, 7, 4, 30),
      color: hexColor(el && el.color, '#111111'),
      font: FONT_IDS.includes(el && el.font) ? el.font : 'inter',
      align: ALIGNMENTS.includes(el && el.align) ? el.align : 'left',
      bold: bool(el && el.bold, false),
      italic: bool(el && el.italic, false),
      spacing: num(el && el.spacing, 0, -2, 4)
    };
  });
}

export function defaultConfig() {
  const template = TEMPLATES.find(t => t.id === 'minimal') || TEMPLATES[0];
  return {
    formatId: DEFAULT_FORMAT_ID,
    templateId: template.id,
    doubleSided: false,
    cropMarks: false,
    includeBleed: true,
    dpi: DEFAULT_DPI,
    qrOnBack: false,
    fields: {
      firstName: '', lastName: '', title: '', company: '',
      phone: '', email: '', website: '', address: '',
      social: '', extra: '', slogan: ''
    },
    visibility: {
      title: true, company: true, phone: true, email: true,
      website: true, address: true, social: true, extra: true,
      slogan: true, logo: true, qr: true
    },
    colors: { ...template.colors },
    fonts: { ...template.fonts },
    typeScale: { ...template.typeScale },
    alignment: template.alignment,
    logo: { url: '', x: null, y: null, w: 14, h: 14 },
    qr: { x: null, y: null, size: 18 },
    background: { url: '' },
    customElements: [],
    elementOverrides: {},
    digitalCard: { slug: '', userId: '', shortCode: '', name: '' }
  };
}

export function sanitizeConfig(raw) {
  const base = defaultConfig();
  const input = raw && typeof raw === 'object' ? { ...raw } : {};
  stripSecrets(input);

  const templateId = TEMPLATE_IDS.includes(input.templateId) ? input.templateId : base.templateId;
  const template = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
  const formatId = FORMATS[input.formatId] ? input.formatId : base.formatId;
  const headingFont = FONT_IDS.includes(input.fonts?.heading) ? input.fonts.heading : template.fonts.heading;
  const bodyFont = FONT_IDS.includes(input.fonts?.body) ? input.fonts.body : template.fonts.body;
  const alignment = ALIGNMENTS.includes(input.alignment) ? input.alignment : template.alignment;

  return {
    formatId,
    templateId,
    doubleSided: bool(input.doubleSided, false),
    cropMarks: bool(input.cropMarks, false),
    includeBleed: bool(input.includeBleed, true),
    dpi: num(input.dpi, DEFAULT_DPI, 300, 600),
    qrOnBack: bool(input.qrOnBack, false),
    fields: {
      firstName: clip(input.fields?.firstName, 80),
      lastName: clip(input.fields?.lastName, 80),
      title: clip(input.fields?.title, 120),
      company: clip(input.fields?.company, 120),
      phone: clip(input.fields?.phone, 50),
      email: clip(input.fields?.email, 120),
      website: clip(input.fields?.website, 200),
      address: clip(input.fields?.address, 200),
      social: clip(input.fields?.social, 200),
      extra: clip(input.fields?.extra, 240),
      slogan: clip(input.fields?.slogan, 160)
    },
    visibility: {
      title: bool(input.visibility?.title, true),
      company: bool(input.visibility?.company, true),
      phone: bool(input.visibility?.phone, true),
      email: bool(input.visibility?.email, true),
      website: bool(input.visibility?.website, true),
      address: bool(input.visibility?.address, true),
      social: bool(input.visibility?.social, true),
      extra: bool(input.visibility?.extra, true),
      slogan: bool(input.visibility?.slogan, true),
      logo: bool(input.visibility?.logo, true),
      qr: bool(input.visibility?.qr, true)
    },
    colors: {
      primary: hexColor(input.colors?.primary, template.colors.primary),
      secondary: hexColor(input.colors?.secondary, template.colors.secondary),
      text: hexColor(input.colors?.text, template.colors.text),
      background: hexColor(input.colors?.background, template.colors.background),
      accent: hexColor(input.colors?.accent, template.colors.accent)
    },
    fonts: { heading: headingFont, body: bodyFont },
    typeScale: {
      name: num(input.typeScale?.name, template.typeScale.name, 8, 22),
      title: num(input.typeScale?.title, template.typeScale.title, 5, 14),
      body: num(input.typeScale?.body, template.typeScale.body, 5, 12)
    },
    alignment,
    logo: {
      url: clip(input.logo?.url, 500),
      x: input.logo?.x == null ? null : num(input.logo.x, 8, 0, 120),
      y: input.logo?.y == null ? null : num(input.logo.y, 8, 0, 80),
      w: num(input.logo?.w, 14, 6, 40),
      h: num(input.logo?.h, 14, 6, 40)
    },
    qr: {
      x: input.qr?.x == null ? null : num(input.qr.x, 70, 0, 120),
      y: input.qr?.y == null ? null : num(input.qr.y, 8, 0, 80),
      size: num(input.qr?.size, 18, 14, 36)
    },
    background: { url: clip(input.background?.url, 500) },
    customElements: sanitizeCustomElements(input.customElements),
    elementOverrides: sanitizeOverrides(input.elementOverrides),
    digitalCard: {
      slug: clip(input.digitalCard?.slug, 50).toLowerCase(),
      userId: clip(input.digitalCard?.userId, 80),
      shortCode: clip(input.digitalCard?.shortCode, 16),
      name: clip(input.digitalCard?.name, 120)
    }
  };
}

export function applyTemplatePreset(config, templateId) {
  const template = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
  return sanitizeConfig({
    ...config,
    templateId: template.id,
    colors: { ...template.colors },
    fonts: { ...template.fonts },
    typeScale: { ...template.typeScale },
    alignment: template.alignment,
    elementOverrides: {},
    logo: { ...config.logo, x: null, y: null },
    qr: { ...config.qr, x: null, y: null },
    // Keep the imported artwork only when the custom preset is active.
    background: template.id === 'custom' ? config.background : { url: '' }
  });
}

export function resetStyles(config) {
  return applyTemplatePreset(config, config.templateId);
}