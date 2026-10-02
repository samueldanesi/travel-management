/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        canvas: '#f4f7f7',
        ink: { DEFAULT: '#14201f', soft: '#43524f', mute: '#82908d' },
        line: { DEFAULT: '#e1e8e6', strong: '#cbd6d3' },
        brand: { DEFAULT: '#0e7a86', dark: '#0a5d67', soft: '#e0f1f3' },
        moss: { DEFAULT: '#2f7d5b', soft: '#e1f1e9' },
        amber2: { DEFAULT: '#b7791f', soft: '#fbf0d9' },
        rose2: { DEFAULT: '#b83a3a', soft: '#f9e3e1' },
        sky2: { DEFAULT: '#2f6690', soft: '#e2edf5' },
      },
      boxShadow: { card: '0 1px 2px rgba(20,32,31,.04), 0 1px 1px rgba(20,32,31,.03)' },
    },
  },
  plugins: [],
}
