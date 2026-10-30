
 // Swiish Design Tokens
// Centralized theme configuration - change values here to restyle the entire site
// Only includes values actually used in the application

const tailwindColors = require('tailwindcss/colors');

module.exports = {
  // Colors - Premium Professional SaaS Palette
  colors: {
    // Main backgrounds - clean, elegant
    main: {
      light: '#f7f9fc',
      dark: '#0b1026',
    },

    // Card backgrounds - crisp, elevated
    card: {
      light: '#ffffff',
      dark: '#151b2f',
    },

    // Secondary card/surface backgrounds
    surface: {
      light: '#f8fafc',
      dark: '#10162a',
    },

    // Primary action - refined indigo/violet
    action: {
      light: '#4f46e5',
      dark: '#6366f1',
    },

    // Primary action button hover
    actionHover: {
      light: '#4338ca',
      dark: '#4f46e5',
    },

    // Accent - vivid purple/magenta for highlights
    accent: {
      light: '#a855f6',
      dark: '#d946ef',
    },

    // Accent hover
    accentHover: {
      light: '#c084fc',
      dark: '#e9d8fd',
    },

    // Primary text
    textPrimary: {
      light: '#0f172a',
      dark: '#f8fafc',
    },

    // Secondary text
    textSecondary: {
      light: '#475569',
      dark: '#cbd5e1',
    },

    // Muted text
    textMuted: {
      light: '#64748b',
      dark: '#94a3b8',
    },

    // Very muted text
    textMutedSubtle: {
      light: '#94a3b8',
      dark: '#64748b',
    },

    // Borders
    border: {
      light: '#e5e7eb',
      dark: '#2a2f45',
    },

    // Borders (subtle)
    borderSubtle: {
      light: '#f1f5f9',
      dark: '#1f2540',
    },

    // Success - emerald for positive actions
    success: {
      light: '#10b981',
      dark: '#059669',
    },

    successHover: {
      light: '#34d399',
      dark: '#10b981',
    },

    successBg: {
      light: '#ecfdf5',
      dark: 'rgba(6, 78, 59, 0.3)',
    },

    successText: {
      light: '#10b981',
      dark: '#059669',
    },

    successBorder: {
      light: '#d1fae5',
      dark: '#065f46',
    },

    // Error - rose for destructive actions
    error: {
      light: '#f87171',
      dark: '#ef4444',
    },

    errorHover: {
      light: '#fca5a5',
      dark: '#f87171',
    },

    errorBg: {
      light: '#fff1f2',
      dark: 'rgba(136, 19, 55, 0.3)',
    },

    errorText: {
      light: '#f87171',
      dark: '#ef4444',
    },

    errorBorder: {
      light: '#fecaca',
      dark: '#9f1239',
    },

    // Info - sky for informational
    info: {
      light: '#6366f1',
      dark: '#8b5cf6',
    },

    infoHover: {
      light: '#8b5cf6',
      dark: '#a78bfa',
    },

    infoBg: {
      light: '#eef2ff',
      dark: 'rgba(30, 58, 138, 0.3)',
    },

    infoText: {
      light: '#6366f1',
      dark: '#8b5cf6',
    },

    infoBorder: {
      light: '#bfdbfe',
      dark: '#6b46c1',
    },

    // Link colors - indigo for tech feel
    link: {
      light: '#4f46e5',
      dark: '#a5f3fc',
    },

    linkBg: {
      light: '#e4e6f1',
      dark: '#1e293b',
    },

    linkBorder: {
      light: '#cbd5e1',
      dark: '#334155',
    },

    linkHover: {
      light: '#e2e8f0',
      dark: '#334155',
    },

    // Input fields
    inputBg: {
      light: '#ffffff',
      dark: '#1e293b',
    },

    inputBorder: {
      light: '#cbd5e1',
      dark: '#334155',
    },

    inputText: {
      light: '#1e293b',
      dark: '#f1f5f9',
    },

    // Focus ring
    focusRing: {
      light: '#6366f1',
      dark: '#818cf8',
    },

    // Modal overlay
    overlay: {
      light: 'rgba(15, 23, 42, 0.6)',
      dark: 'rgba(2, 6, 23, 0.8)',
    },

    confirm: {
      light: '#f8fafc',
      dark: '#1f2540',
    },

    confirmHover: {
      light: '#f1f5f9',
      dark: '#262b4a',
    },

    confirmText: {
      light: '#0f172a',
      dark: '#e5e7eb',
    },

    confirmBg: {
      light: '#ffffff',
      dark: '#151b2f',
    },

    confirmBorder: {
      light: '#e5e7eb',
      dark: '#2a2f45',
    },
  },

  // Border Radius (corner radius) - cleaner, more refined
  borderRadius: {
    card: '0.875rem',
    container: '1rem',
    page: '1.25rem',
    button: '0.625rem',
    input: '0.625rem',
    badge: '9999px',
    full: '9999px',
  },

  // Border Width (thickness)
  borderWidth: {
    default: '1px',
    thick: '1px',
    avatar: '3px',
    device: '8px',
  },

  // Background Textures
  // Paths are relative to public folder
  textures: {
    main: {
      light: '/textures/sandTexture.jpg',
      dark: '/textures/sandTexture.jpg',
      size: '1080px 1080px',
      blendLight: 'multiply',
      blendDark: 'overlay',
      opacityLight: 0.07,
      opacityDark: 0.20,
    },
    surface: {
      light: '',
      dark: '',
    },
    card: {
      light: '',
      dark: '',
    },
  },
};
