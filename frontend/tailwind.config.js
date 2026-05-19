/** @type {import('tailwindcss').Config} */
/*
 *  MANDIYA — Food Platform design system
 *  Cream + ink + chili-red palette. Fraunces / Inter / JetBrains Mono.
 *  Dark "night terminal" mode is opt-in via [data-theme="night"] on <html>.
 */
export default {
  darkMode: ['class', '[data-theme="night"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1320px' },
    },
    extend: {
      fontFamily: {
        display: ['"Fraunces"', '"Source Serif Pro"', 'Georgia', 'serif'],
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        ui: ['"Inter"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        masthead: ['clamp(3.5rem, 9vw, 8.5rem)', { lineHeight: '0.92', letterSpacing: '-0.045em' }],
        kicker: ['0.68rem', { lineHeight: '1', letterSpacing: '0.22em' }],
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        elevated: 'var(--shadow-elevated)',
        glow: 'var(--shadow-glow)',
        paper: '0 1px 0 rgba(14,14,12,0.06), 0 8px 28px -12px rgba(14,14,12,0.18)',
        press: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 0 rgba(14,14,12,0.08), 0 2px 0 rgba(14,14,12,0.04)',
        stamp: '2px 2px 0 rgba(14,14,12,0.85)',
        ink: '0 2px 0 #0E0E0C',
      },
      colors: {
        /* legacy brand scale — now aliased to chili red so existing classes keep working */
        brand: {
          50: '#FCEEEA',
          100: '#F9DDD4',
          200: '#F1B8A6',
          300: '#E58973',
          400: '#D5563D',
          500: '#C8321E',
          600: '#A82716',
          700: '#841C0F',
          800: '#5F140A',
          900: '#3B0C06',
        },
        /* Paper — warm off-white surfaces */
        paper: {
          50: '#FFFBF1',
          100: '#FBF7EE',
          200: '#F4EDE0',
          300: '#EBE3D2',
          400: '#E3DAC4',
          500: '#D6CAAE',
          600: '#BFB293',
        },
        /* Ink — type and rules */
        ink: {
          DEFAULT: '#0E0E0C',
          900: '#0E0E0C',
          700: '#2A2820',
          500: '#3A372F',
          400: '#6B6657',
          300: '#9C967F',
          200: '#C6BFA5',
          faint: 'var(--color-text-faint)',
        },
        chili: {
          50: '#FCEEEA',
          100: '#F9DDD4',
          400: '#D5563D',
          500: '#C8321E',
          600: '#A82716',
          700: '#841C0F',
        },
        turmeric: {
          50: '#FCF3DC',
          100: '#F7E4AC',
          400: '#EBB23A',
          500: '#E8A317',
          600: '#C58B0E',
        },
        curry: {
          400: '#3F6431',
          500: '#2C4A22',
          600: '#1E3417',
        },
        saffron: {
          500: '#D77A0F',
        },
        /* shadcn-style semantic tokens mapped to CSS variables */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        /* surface tokens */
        surface: {
          DEFAULT: 'var(--color-bg-card)',
          soft: 'var(--color-bg-secondary)',
          elevated: 'var(--color-bg-elevated)',
        },
        ink: {
          faint: 'var(--color-text-faint)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        pill: '9999px',
        shell: '28px',
        panel: '20px',
        card: '16px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px) blur(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0) blur(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        'spring-in': {
          '0%': { opacity: '0', transform: 'scale(0.94) translateY(8px)' },
          '60%': { transform: 'scale(1.01) translateY(-2px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'loader-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px 0 rgba(200,50,30,0.25)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(200,50,30,0.40)' },
        },
        /* Mandiya — newspaper / market motion */
        'flip-up': {
          '0%': { transform: 'rotateX(0deg)', transformOrigin: '50% 100%' },
          '50%': { transform: 'rotateX(-90deg)', transformOrigin: '50% 100%' },
          '50.01%': { transform: 'rotateX(90deg)', transformOrigin: '50% 0%' },
          '100%': { transform: 'rotateX(0deg)', transformOrigin: '50% 0%' },
        },
        'paper-fold': {
          '0%': { opacity: '0', transform: 'rotateX(-8deg) translateY(-6px)', transformOrigin: 'top center' },
          '100%': { opacity: '1', transform: 'rotateX(0) translateY(0)', transformOrigin: 'top center' },
        },
        'tape-vertical': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' },
        },
        'tape-horizontal': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        scrub: {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-12' },
        },
        'ink-drip': {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'top' },
        },
        'stamp-press': {
          '0%': { transform: 'scale(1.6) rotate(-12deg)', opacity: '0' },
          '60%': { transform: 'scale(0.94) rotate(-2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-2deg)', opacity: '1' },
        },
        kettle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        'wipe-right': {
          '0%': { clipPath: 'inset(0 100% 0 0)' },
          '100%': { clipPath: 'inset(0 0 0 0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.55s var(--ease-spring) forwards',
        shimmer: 'shimmer 2.2s linear infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'spring-in': 'spring-in 0.5s var(--ease-spring) forwards',
        'loader-sweep': 'loader-sweep 1.2s linear infinite',
        glow: 'glow 2.5s ease-in-out infinite',
        'flip-up': 'flip-up 0.7s cubic-bezier(0.45, 0, 0.15, 1)',
        'paper-fold': 'paper-fold 0.42s cubic-bezier(0.22, 1, 0.36, 1) both',
        'tape-vertical': 'tape-vertical 38s linear infinite',
        'tape-horizontal': 'tape-horizontal 42s linear infinite',
        scrub: 'scrub 0.6s linear infinite',
        'ink-drip': 'ink-drip 0.5s cubic-bezier(0.4, 0, 0.6, 1) both',
        'stamp-press': 'stamp-press 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        kettle: 'kettle 2.4s ease-in-out infinite',
        'wipe-right': 'wipe-right 0.6s cubic-bezier(0.4, 0, 0.2, 1) both',
        marquee: 'marquee 28s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise-texture':
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
        'newsprint':
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.055 0 0 0 0 0.055 0 0 0 0 0.047 0 0 0 0.32 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E\")",
        'halftone':
          "radial-gradient(circle, rgba(14,14,12,0.18) 1px, transparent 1.4px)",
        'hairline-grid':
          "linear-gradient(to right, rgba(14,14,12,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(14,14,12,0.07) 1px, transparent 1px)",
        'paper-rule':
          "linear-gradient(to bottom, transparent calc(100% - 1px), rgba(14,14,12,0.10) calc(100% - 1px))",
      },
      backgroundSize: {
        'halftone-sm': '6px 6px',
        'halftone-md': '10px 10px',
        'grid-sm': '24px 24px',
        'grid-md': '48px 48px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
    },
  },
  plugins: [
    // tailwindcss-animate inline — adds animation utilities
    function({ addUtilities }) {
      addUtilities({
        '.animate-in': { animationFillMode: 'both' },
        '.animate-out': { animationFillMode: 'both' },
        '.num': { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1, "lnum" 1' },
        '.text-balance': { textWrap: 'balance' },
        '.text-pretty': { textWrap: 'pretty' },
      })
    },
  ],
}
