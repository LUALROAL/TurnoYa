/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // Fondo
        bg: {
          primary: '#03050A',
          secondary: '#0A0E17',
          tertiary: '#121826',
          card: '#1A1F2F',
          'card-hover': '#222837',
        },
        // Neones
        neon: {
          primary: '#00E0FF',
          'primary-dark': '#00B8D4',
          secondary: '#00F5D4',
          'secondary-dark': '#00D9C0',
        },
        // Texto
        text: {
          primary: '#FFFFFF',
          secondary: '#B0C4DE',
          tertiary: '#7086A0',
          inverse: '#03050A',
        },
        // Bordes
        border: {
          primary: 'rgba(0, 224, 255, 0.3)',
          secondary: 'rgba(255, 255, 255, 0.08)',
        }
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 4px 12px rgba(0, 0, 0, 0.3)',
        'md': '0 8px 24px rgba(0, 0, 0, 0.4)',
        'lg': '0 16px 40px rgba(0, 0, 0, 0.5)',
        'neon': '0 0 30px rgba(0, 224, 255, 0.3)',
        'neon-strong': '0 0 40px rgba(0, 224, 255, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
      },
      backdropBlur: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(0, 224, 255, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(0, 224, 255, 0.6)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
      backgroundImage: {
        'gradient-glow': 'linear-gradient(135deg, rgba(0, 224, 255, 0.2) 0%, rgba(0, 245, 212, 0.2) 50%, rgba(0, 224, 255, 0.2) 100%)',
        'gradient-card': 'linear-gradient(145deg, #1A1F2F 0%, #121826 100%)',
        'gradient-radial': 'radial-gradient(circle at center, rgba(0,224,255,0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};
