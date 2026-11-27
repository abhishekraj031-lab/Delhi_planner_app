import { getLang } from './i18n';
export const colors = {
  ink: '#000000', sub: '#6b6464', text: '#3a3535', fill: '#f1f2f9', primary: '#E8590C', primaryText: '#C2410C', primaryTint: '#FFEFE5', primarySoft: '#FFF6F0', primaryLine: '#FFD9C2',
  dark: '#1e1b1b', heading: '#334155', line: '#e3e4ee', white: '#ffffff',
  warn: '#9a5b00', unvBg: '#ece4fb', unv: '#6a3fb5', overlay: 'rgba(0,0,0,0.5)',
};
export const font = { regular: 'Figtree_400Regular', medium: 'Figtree_500Medium', semi: 'Figtree_600SemiBold', bold: 'Figtree_700Bold' };
const hindiFont = { regular: 'NotoSansDevanagari_400Regular', medium: 'NotoSansDevanagari_500Medium', semi: 'NotoSansDevanagari_600SemiBold', bold: 'NotoSansDevanagari_700Bold' };
/** Figtree has no Devanagari letters, so Hindi uses Noto Sans Devanagari. Call it while rendering. */
export const fontFor = (w: keyof typeof font = 'regular') => (getLang() === 'hi' ? hindiFont[w] : font[w]);
