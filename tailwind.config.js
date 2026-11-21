// eslint-disable-next-line @typescript-eslint/no-require-imports
const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Polish grade colors
        grade: {
          1: '#FF6B6B',      // 1 - danger
          2: '#FF8E53',      // 2 - orange
          3: '#FFD93D',      // 3 - warning/yellow
          4: '#A8D86E',      // 4 - lime
          5: '#6BCB77',      // 5 - success
          6: '#4ECDC4',      // 6 - info/teal
          default: '#A995BA', // accent default
        },
        // Pure black colors for minimalist design
        black: {
          DEFAULT: '#000000',
          dark: '#121212',
          deep: '#0A0A0A',
        },
      },
      animation: {
        'slide-up': 'slideUp 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
        'slide-down': 'slideDown 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fadeIn 150ms cubic-bezier(0.25, 0.1, 0.25, 1)',
        'fade-out': 'fadeOut 100ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      transitionTiming: {
        'smoother': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [
    plugin(function({ addBase, addUtilities }) {
      // Custom grade badge utilities
      addUtilities({
        '.grade-badge': {
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'width': '2.25rem',
          'height': '2.25rem',
          'border-radius': '0.75rem',
          'font-weight': '700',
        },
        '.grade-value-1': { backgroundColor: '#FF6B6B', color: 'white' },
        '.grade-value-2': { backgroundColor: '#FF8E53', color: 'white' },
        '.grade-value-3': { backgroundColor: '#FFD93D', color: 'white' },
        '.grade-value-4': { backgroundColor: '#A8D86E', color: 'white' },
        '.grade-value-5': { backgroundColor: '#6BCB77', color: 'white' },
        '.grade-value-6': { backgroundColor: '#4ECDC4', color: 'white' },
        '.grade-summary-1-2': { color: '#FF6B6B' },
        '.grade-summary-3': { color: '#FFD93D' },
        '.grade-summary-4': { color: '#6BCB77' },
        '.grade-summary-5-6': { color: '#4ECDC4' },
        '.minimal-card': {
          'background': '#1A1A1E',
          'border': '1px solid #33333A',
          'border-radius': '10px',
        },
        '.minimal-surface': {
          'background': '#2A2A31',
          'border': '1px solid #3A3A44',
        },
        '.smooth-transition': {
          'transition': 'all 120ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
      });

      // Base styles
      addBase({
        ':root': {
          '--animate-fade-in': 'fadeIn 150ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          '--animate-fade-out': 'fadeOut 100ms cubic-bezier(0.4, 0, 0.2, 1)',
          '--animate-slide-up': 'slideUp 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          '--animate-slide-down': 'slideDown 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          '--transition-base': '120ms ease-out',
        },
      });
    }),
  ],
};