import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Updated PawPop Color System
        'site-bg': '#F5EED7',        // Page background
        'card-surface': '#FFFFFF',    // Content containers
        'text-primary': '#2C2C2C',    // Primary text
        
        // Accent Palette
        'pale-azure': '#70D6FF',      // Secondary accent
        'atomic-tangerine': '#FF9770', // Primary CTA
        'cyclamen': '#FF70A6',        // Secondary CTA
        'naples-yellow': '#FFD670',   // Highlights
        'mindaro': '#E9FF70',         // Playful accent
        
        // Legacy PawPop Brand Colors (maintain compatibility)
        'mona-gold': '#D4AF37',
        'gallery-white': '#FEFEFE',
        'charcoal-frame': '#2C2C2C',
        'french-blue': '#4A90E2',
        'warm-peach': '#FFB5A7',
        'sage-green': '#87A96B',
        'joy-yellow': '#FFD700',
        'love-pink': '#FF69B4',
        'magic-purple': '#8A2BE2',
        // Legacy colors for compatibility
        primary: {
          50: '#FFF5F2',
          100: '#FFE8E1',
          200: '#FFD5C9',
          300: '#FFB6A3',
          400: '#FF8C6E',
          500: '#D4AF37', // Updated to Mona Gold
          600: '#B8941F',
          700: '#9C7A0F',
          800: '#806008',
          900: '#644704',
        },
        secondary: {
          50: '#F0F8FF',
          100: '#E0F0FE',
          200: '#BAE0FD',
          300: '#7CC8FB',
          400: '#36ADF7',
          500: '#4A90E2', // Updated to French Blue
          600: '#0F73D4',
          700: '#105BAB',
          800: '#134E8D',
          900: '#154274',
        },
      },
      fontFamily: {
        // New font system
        'arvo': ['Arvo', ...fontFamily.serif],
        'geist': ['Geist', ...fontFamily.sans],
        'fredoka': ['Fredoka One', ...fontFamily.sans],
        // Legacy font mappings (maintain compatibility)
        'playfair': ['Playfair Display', ...fontFamily.serif],
        'inter': ['Inter', ...fontFamily.sans],
        sans: ['Geist', ...fontFamily.sans],
        heading: ['Arvo', ...fontFamily.serif],
        accent: ['Fredoka One', ...fontFamily.sans],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gallery-gradient": "linear-gradient(135deg, var(--tw-gradient-stops))",
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'gallery-hover': 'galleryHover 0.3s ease-out',
        'character-bounce': 'characterBounce 2s ease-in-out infinite',
        'brush-stroke': 'brushStroke 1.5s ease-in-out infinite',
        'gallery-slide': 'gallerySlide 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'gallery-fade-in': 'galleryFadeIn 0.5s ease-out',
      },
      transitionTimingFunction: {
        'gallery-snap': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'snappy': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        galleryHover: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.05)' },
        },
        characterBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        brushStroke: {
          '0%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
          '100%': { transform: 'rotate(-5deg)' },
        },
        gallerySlide: {
          '0%': { transform: 'translateX(10px)', opacity: '0.8' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        galleryFadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
