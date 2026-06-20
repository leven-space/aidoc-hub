/** Brand palette from docs/logo-design.html */
export const brandColors = {
  sky: '#38bdf8',
  indigo: '#818cf8',
  purple: '#c084fc',
  primary: '#6366f1',
  dark: '#0f172a',
  darkDeep: '#0a0e1a',
  light: '#f8fafc',
  textMuted: '#64748b',
} as const;

export const brandGradient = `linear-gradient(135deg, ${brandColors.sky} 0%, ${brandColors.indigo} 50%, ${brandColors.purple} 100%)`;

export const authBackgroundGradient =
  'linear-gradient(135deg, #f8fafc 0%, rgba(56, 189, 248, 0.08) 45%, rgba(129, 140, 248, 0.14) 100%)';
