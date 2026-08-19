/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#070712',
          panel: '#0e1022',
          border: '#1b2042',
          neonCyan: '#00f0ff',
          neonPink: '#ff007f',
          neonYellow: '#ffe600',
          neonPurple: '#a855f7',
          neonGreen: '#00ff66',
          neonOrange: '#ff6600',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.4), 0 0 30px rgba(0, 240, 255, 0.2)',
        'neon-pink': '0 0 15px rgba(255, 0, 127, 0.4), 0 0 30px rgba(255, 0, 127, 0.2)',
        'neon-yellow': '0 0 15px rgba(255, 230, 0, 0.4), 0 0 30px rgba(255, 230, 0, 0.2)',
        'neon-green': '0 0 15px rgba(0, 255, 102, 0.4), 0 0 30px rgba(0, 255, 102, 0.2)',
      }
    },
  },
  plugins: [],
}
