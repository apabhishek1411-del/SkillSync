/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
                display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
            },
            colors: {
                primary: {
                    50:  '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                },
                accent: {
                    50:  '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                },
                violet: {
                    50:  '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6',
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                    950: '#2e1065',
                },
                surface: {
                    50:  '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    700: '#334155',
                    800: '#1e293b',
                    850: '#172033',
                    900: '#0f172a',
                    950: '#020617',
                },
            },
            animation: {
                'fade-in':     'fadeIn 0.7s ease-out forwards',
                'slide-up':    'slideUp 0.7s ease-out forwards',
                'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
                'scale-in':    'scaleIn 0.5s ease-out forwards',
                'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
                'float':       'float 6s ease-in-out infinite',
                'shimmer':     'shimmer 2.5s infinite',
                'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
                'spin-slow':   'spin 3s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%':   { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%':   { opacity: '0', transform: 'translateY(32px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInLeft: {
                    '0%':   { opacity: '0', transform: 'translateX(-24px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%':   { opacity: '0', transform: 'scale(0.92)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                bounceSoft: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%':      { transform: 'translateY(-8px)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%':      { transform: 'translateY(-20px)' },
                },
                shimmer: {
                    '0%':   { backgroundPosition: '-200% center' },
                    '100%': { backgroundPosition: '200% center' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.4)' },
                    '50%':      { boxShadow: '0 0 40px rgba(99,102,241,0.7)' },
                },
            },
            backgroundSize: {
                '200%': '200%',
            },
            boxShadow: {
                'card':    '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
                'card-lg': '0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                'card-dark':    '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
                'card-dark-lg': '0 8px 30px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
                'btn':     '0 4px 14px -3px rgba(79,70,229,0.5)',
                'btn-lg':  '0 8px 20px -4px rgba(79,70,229,0.5)',
                'glow':    '0 0 30px rgba(99,102,241,0.5)',
                'inner-light': 'inset 0 1px 0 rgba(255,255,255,0.1)',
            },
        },
    },
    plugins: [],
}
