/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#065f46',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#d97706',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#b91c1c',
          foreground: '#ffffff',
        },
        border: '#e2e8f0',
        input: '#e2e8f0',
        ring: '#065f46',
        background: '#f8fafc',
        foreground: '#0f172a',
        muted: {
          DEFAULT: '#f1f5f9',
          foreground: '#64748b',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a',
        },
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        alexandria: ['Alexandria', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
