// src/design/shared/fonts.js
// Web-safe font stacks shared by the design editor, exports and the server
// sanitizer. System fonts are used so SVG → PNG/JPG/PDF rasterisation renders
// exactly what the editor shows.
export const DESIGN_FONTS = {
  sans: { id: 'sans', label: 'Helvetica / Arial', css: 'Helvetica, Arial, sans-serif' },
  system: { id: 'system', label: 'Système', css: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  verdana: { id: 'verdana', label: 'Verdana', css: 'Verdana, Geneva, sans-serif' },
  trebuchet: { id: 'trebuchet', label: 'Trebuchet', css: '"Trebuchet MS", "Lucida Grande", sans-serif' },
  gill: { id: 'gill', label: 'Gill Sans', css: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif' },
  impact: { id: 'impact', label: 'Impact', css: 'Impact, "Arial Black", "Franklin Gothic Bold", sans-serif' },
  serif: { id: 'serif', label: 'Georgia', css: 'Georgia, "Times New Roman", serif' },
  times: { id: 'times', label: 'Times', css: '"Times New Roman", Times, serif' },
  palatino: { id: 'palatino', label: 'Palatino', css: '"Palatino Linotype", Palatino, "Book Antiqua", serif' },
  mono: { id: 'mono', label: 'Courier', css: '"Courier New", Courier, monospace' },
  script: { id: 'script', label: 'Script', css: '"Brush Script MT", "Segoe Script", cursive' }
};

export const DESIGN_FONT_IDS = Object.keys(DESIGN_FONTS);

export function fontCss(id) {
  return (DESIGN_FONTS[id] || DESIGN_FONTS.sans).css;
}
