/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: "hsl(var(--surface))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Stitch Tactile Workshop Studio Palette
        terracotta: {
          DEFAULT: "#D85A38",
          hover: "#BF4321",
          light: "#FBECE8",
        },
        carbon: {
          DEFAULT: "#1C1A17",
          muted: "#2D2A26",
          pencil: "#78746D",
          rule: "#DCD6CD",
        },
        vellum: {
          DEFAULT: "#FAF7F0",
          pure: "#FBF9F4",
          board: "#F4EFE6",
          dark: "#181715",
        },
        studio: {
          canary: "#FFF6CC",
          canaryBorder: "#E6D374",
          canaryInk: "#332D06",
          sage: "#E2F0D9",
          sageBorder: "#B5CFAC",
          sageInk: "#1A2F17",
          coral: "#FDE2D2",
          coralBorder: "#E8AFA4",
          coralInk: "#3D1B14",
          sky: "#E0EDFF",
          skyBorder: "#AECDF0",
          skyInk: "#132B45",
        },
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.375rem",
        xl: "0.5rem",
        '2xl': "0.75rem",
        full: "9999px",
      },
      fontFamily: {
        sans: ['"DM Sans"', '"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        headline: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        label: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"Space Grotesk"', '"JetBrains Mono"', 'monospace'],
        sticky: ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        'stamp-xs': '1.5px 1.5px 0px #1C1A17',
        'stamp': '2px 2px 0px #1C1A17',
        'stamp-md': '3px 3px 0px #1C1A17',
        'stamp-lg': '4px 4px 0px #1C1A17',
        'stamp-xl': '6px 6px 0px #1C1A17',
        'stamp-terracotta': '2px 2px 0px #D85A38',
        'stamp-white': '2px 2px 0px rgba(255, 255, 255, 0.4)',
        'glow': '0 0 20px -5px hsl(var(--primary) / 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
