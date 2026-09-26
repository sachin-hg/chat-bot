import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d1117',
        bg2: '#161b22',
        bg3: '#21262d',
        border: '#30363d',
        'c-text': '#e6edf3',
        muted: '#8b949e',
        accent: '#58a6ff',
        'accent-2': '#3fb950',
        'accent-3': '#f78166',
        'accent-4': '#d2a8ff',
        'accent-5': '#ffa657',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', 'monospace'],
      },
      width: {
        sidebar: '280px',
      },
    },
  },
  plugins: [],
} satisfies Config
