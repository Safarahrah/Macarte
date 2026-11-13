import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './i18n';
import App from './App';
const swiishTheme = require('./theme/swiish');

// Helper to convert camelCase to kebab-case
const toKebabCase = (str) => str.replace(/([A-Z])/g, (match) => '-' + match).toLowerCase();

// Initialize CSS custom properties from theme
// This ensures the page looks correct before React loads
const initializeThemeVars = (theme) => {
  const root = document.documentElement;
  const colors = theme.colors || {};
  
  // Set all color CSS variables from theme
  Object.keys(colors).forEach((colorKey) => {
    const colorValue = colors[colorKey];
    if (colorValue && typeof colorValue === 'object' && colorValue.light !== undefined) {
      const cssVarName = `--color-${toKebabCase(colorKey)}`;
      root.style.setProperty(`${cssVarName}-light`, colorValue.light);
      root.style.setProperty(`${cssVarName}-dark`, colorValue.dark);
    }
  });
  
  // Set texture variables
  const textures = theme.textures?.main || {};
  root.style.setProperty('--texture-main-light', textures.light ? `url(${textures.light})` : 'none');
  root.style.setProperty('--texture-main-dark', textures.dark ? `url(${textures.dark})` : 'none');
  root.style.setProperty('--texture-main-size', textures.size || '540px 540px');
  root.style.setProperty('--texture-main-blend-light', textures.blendLight || 'multiply');
  root.style.setProperty('--texture-main-blend-dark', textures.blendDark || 'overlay');
  root.style.setProperty('--texture-main-opacity-light', textures.opacityLight ?? 0.08);
  root.style.setProperty('--texture-main-opacity-dark', textures.opacityDark ?? 0.1);
  
  // Surface textures
  root.style.setProperty('--texture-surface-light', 
    theme.textures?.surface?.light ? `url(${theme.textures.surface.light})` : 'none');
  root.style.setProperty('--texture-surface-dark', 
    theme.textures?.surface?.dark ? `url(${theme.textures.surface.dark})` : 'none');
  
  // Card textures
  root.style.setProperty('--texture-card-light', 
    theme.textures?.card?.light ? `url(${theme.textures.card.light})` : 'none');
  root.style.setProperty('--texture-card-dark', 
    theme.textures?.card?.dark ? `url(${theme.textures.card.dark})` : 'none');
};

// Initialize with swiish theme before rendering
initializeThemeVars(swiishTheme);

// Design Token Annotation System
// Automatically adds data-theme-* attributes to elements based on their Tailwind classes
// This makes it easy to see which design tokens are used in Chrome DevTools

// List of semantic design tokens from the theme
const DESIGN_TOKENS = [
  'main', 'card', 'surface', 'action', 'action-hover',
  'text-primary', 'text-secondary', 'text-muted', 'text-muted-subtle',
  'confirm', 'confirm-hover', 'confirm-text', 'confirm-bg', 'confirm-border',
  'success', 'success-hover', 'success-bg', 'success-text', 'success-border',
  'error', 'error-hover', 'error-bg', 'error-text', 'error-border',
  'info', 'info-hover', 'info-bg', 'info-text', 'info-border',
  'link', 'link-bg', 'link-border', 'link-hover',
  'input-bg', 'input-border', 'input-text',
  'border', 'border-subtle',
  'focus-ring', 'overlay'
];

// Extract token name from class (handles both light and dark variants)
const extractToken = (classPart, type) => {
  let token = classPart;
  
  // Remove prefixes based on type
  if (type === 'bg') {
    token = token.replace(/^(bg|hover:bg)-/, '');
  } else if (type === 'text') {
    token = token.replace(/^text-/, '');
  } else if (type === 'border') {
    token = token.replace(/^border-/, '');
  }
  
  // Remove -dark suffix
  token = token.replace(/-dark$/, '');
  
  // Direct match - check if the remaining token is in our list
  if (DESIGN_TOKENS.includes(token)) {
    return token;
  }
  
  // Try to find a matching token by checking if any design token appears in the class
  // This handles cases like:
  // - "text-text-secondary" -> after removing "text-", we have "text-secondary" which matches token "text-secondary"
  // - "text-confirm-text" -> after removing "text-", we have "confirm-text" which matches token "confirm-text"
  // Sort by length (longest first) to prefer more specific matches
  const sortedTokens = [...DESIGN_TOKENS].sort((a, b) => b.length - a.length);
  
  for (const designToken of sortedTokens) {
    // Check if the token ends with the design token (e.g., "text-secondary" ends with "text-secondary")
    if (token === designToken || token.endsWith('-' + designToken)) {
      return designToken;
    }
    // Check if the token starts with the design token (e.g., "confirm-text" starts with "confirm")
    if (token.startsWith(designToken + '-')) {
      return designToken;
    }
  }
  
  return null;
};

// Annotate a single element with design token attributes
const annotateElement = (element) => {
  // Skip if element doesn't have className or already annotated
  if (!element.className || typeof element.className !== 'string') {
    return;
  }
  
  // Skip script, style, and other non-visual elements
  const tagName = element.tagName?.toLowerCase();
  if (tagName === 'script' || tagName === 'style' || tagName === 'meta' || tagName === 'link') {
    return;
  }
  
  const classes = element.className.split(/\s+/);
  const tokens = {
    bg: null,
    text: null,
    border: null,
    hover: null
  };
  
  // Parse classes to find design tokens
  classes.forEach(className => {
    // Hover tokens: hover:bg-{token} (check this first before regular bg-)
    if (className.startsWith('hover:bg-')) {
      const token = extractToken(className, 'bg');
      if (token && !tokens.hover) {
        tokens.hover = token;
      }
    }
    // Background tokens: bg-{token} or bg-{token}-dark
    else if (className.startsWith('bg-')) {
      const token = extractToken(className, 'bg');
      if (token && !tokens.bg) {
        tokens.bg = token;
      }
    }
    
    // Text tokens: text-{token} or text-{token}-dark
    if (className.startsWith('text-')) {
      const token = extractToken(className, 'text');
      if (token && !tokens.text) {
        tokens.text = token;
      }
    }
    
    // Border tokens: border-{token} or border-{token}-dark (skip arbitrary values like border-[...])
    if (className.startsWith('border-') && !className.startsWith('border-[')) {
      const token = extractToken(className, 'border');
      if (token && !tokens.border) {
        tokens.border = token;
      }
    }
  });
  
  // Add data attributes for found tokens
  if (tokens.bg) {
    element.setAttribute('data-theme-bg', tokens.bg);
  }
  if (tokens.text) {
    element.setAttribute('data-theme-text', tokens.text);
  }
  if (tokens.border) {
    element.setAttribute('data-theme-border', tokens.border);
  }
  if (tokens.hover) {
    element.setAttribute('data-theme-hover', tokens.hover);
  }
};

// Scan all elements in the DOM and annotate them
const scanAndAnnotate = (root = document.body) => {
  if (!root) return;
  
  // Annotate the root element itself
  annotateElement(root);
  
  // Annotate all descendant elements
  const allElements = root.querySelectorAll('*');
  allElements.forEach(element => {
    annotateElement(element);
  });
};

// Initialize token annotation system
const initializeTokenAnnotations = () => {
  // Function to do a full scan
  const doFullScan = () => {
    if (document.body) {
      scanAndAnnotate();
    }
  };
  
  // Watch for new elements added to the DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Annotate the new element and its children
          scanAndAnnotate(node);
        }
      });
    });
  });
  
  // Start observing immediately if body exists
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    // Wait for body if it doesn't exist yet
    const bodyObserver = new MutationObserver(() => {
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        bodyObserver.disconnect();
      }
    });
    bodyObserver.observe(document.documentElement, {
      childList: true
    });
  }
  
  // Do initial scans at multiple intervals to catch React-rendered content
  // React typically renders quickly, so we scan at several points
  doFullScan(); // Immediate scan
  
  // Scan after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      doFullScan();
    });
  }
  
  // Scan after a short delay (for React initial render)
  setTimeout(doFullScan, 100);
  
  // Scan after a longer delay (for React lazy loading)
  setTimeout(doFullScan, 500);
  
  // Scan after React has definitely rendered (using requestAnimationFrame)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      doFullScan();
    });
  });
};

// Start token annotation system
initializeTokenAnnotations();

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  // In production builds, webpack replaces process.env.NODE_ENV with the string "production"
  // In development mode (npm start), it's "development"
  // This is the most reliable way to detect production builds
  const isProductionBuild = process.env.NODE_ENV === 'production';
  
  if (isProductionBuild) {
    // Register service worker in production builds (works on localhost and live servers)
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL || ''}/service-worker.js`;
      
      navigator.serviceWorker
        .register(swUrl)
        .catch((error) => {
          console.error('Service worker registration failed:', error);
        });
    });
  } else {
    // Unregister any existing service workers in development mode
    // This prevents caching issues during local development with npm start
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

registerServiceWorker();
