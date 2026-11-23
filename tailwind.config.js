/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'], mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'] },
      colors: {
        bg: v('bg'), surface: v('surface'), raised: v('raised'), border: v('border'),
        fg: v('fg'), muted: v('muted'), tertiary: v('tertiary'), brand: v('brand'),
        primary: v('primary'), 'primary-strong': v('primary-strong'), subtle: v('subtle'),
        'status-danger': v('status-danger-fg'), 'status-warning': v('status-warning-fg'),
        success: v('success'), warning: v('warning'), danger: v('danger'), info: v('info'),
        'state-active': v('state-active-bg'), 'state-active-fg': v('state-active-fg'), 'state-hover': v('state-hover-bg'),
        'state-inactive': v('state-inactive-fg'), 'state-border': v('state-border'), 'state-indicator': v('state-indicator'),
        'focus-ring': v('focus-ring'),
        'dock-bg': v('dock-bg'), 'canvas-bg': v('canvas-bg'),
        'backdrop-a': v('backdrop-a'), 'backdrop-b': v('backdrop-b'), 'backdrop-c': v('backdrop-c'),
      },
      borderRadius: { control: '8px', card: '12px', dialog: '16px' },
      boxShadow: { surface: 'var(--surface-shadow)', popover: 'var(--popover-shadow)' },
      fontSize: {
        display: ['24px', { lineHeight: '1.2', letterSpacing: '-0.035em', fontWeight: '650' }],
        h1: ['20px', { lineHeight: '1.25', letterSpacing: '-0.03em', fontWeight: '650' }],
        h2: ['16px', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '600' }],
        h3: ['14px', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        body: ['14px', { lineHeight: '1.5' }],
        small: ['13px', { lineHeight: '1.45' }],
        caption: ['11px', { lineHeight: '1.35', letterSpacing: '0.01em' }],
      },
    },
  },
  plugins: [],
};
