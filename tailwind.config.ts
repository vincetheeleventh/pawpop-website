import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5F2',
          100: '#FFE8E1',
          200: '#FFD5C9',
          300: '#FFB6A3',
          400: '#FF8C6E',
          500: '#FF6B35',
          600: '#ED4F13',
          700: '#C63A0E',
          800: '#A32F0F',
          900: '#892A13',
        },
        secondary: {
          50: '#F0FDFB',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#4ECDC4',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        accent: {
          yellow: '#FFD166',
          coral: '#FF7E6B',
          lavender: '#9B5DE5',
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#2D3142',
        }
      },
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
        heading: ['Nunito', 'sans-serif'],
        accent: ['Quicksand', 'sans-serif'],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        pawpop: {
          "primary": "#FF6B35",
          "secondary": "#4ECDC4",
          "accent": "#9B5DE5",
          "neutral": "#2D3142",
          "base-100": "#FFFFFF",
          "info": "#3B82F6",
          "success": "#10B981",
          "warning": "#F59E0B",
          "error": "#EF4444",
          "accent-yellow": "#FFD166",
          "accent-coral": "#FF7E6B",
        },
      },
    ],
  },
};

export default config;
