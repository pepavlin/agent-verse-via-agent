import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        // Primary - Deep Indigo (professional tech look)
        primary: {
          light: 'var(--primary-light)',
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
        },

        // Secondary - Purple (creative/AI feel)
        secondary: {
          light: 'var(--secondary-light)',
          DEFAULT: 'var(--secondary)',
          dark: 'var(--secondary-dark)',
        },

        // Accent - Cyan (modern tech)
        accent: {
          light: 'var(--accent-light)',
          DEFAULT: 'var(--accent)',
          dark: 'var(--accent-dark)',
        },

        // Semantic colors
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',

        // Neutral scale
        neutral: {
          50: 'var(--neutral-50)',
          100: 'var(--neutral-100)',
          200: 'var(--neutral-200)',
          300: 'var(--neutral-300)',
          400: 'var(--neutral-400)',
          500: 'var(--neutral-500)',
          600: 'var(--neutral-600)',
          700: 'var(--neutral-700)',
          800: 'var(--neutral-800)',
          900: 'var(--neutral-900)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        'sm': '4px',
        'md': '12px',
        'lg': '16px',
      },
    },
  },
  plugins: [],
}

export default config
