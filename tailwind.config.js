/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
        sage: {
          50: '#f6f7f4',
          100: '#e8ebe3',
          200: '#d1d8c7',
          300: '#b3bfa3',
          400: '#96a67f',
          500: '#7a8d64',
          600: '#5f6f4e',
          700: '#4b5740',
          800: '#3e4736',
          900: '#353d2f',
        },
        terra: {
          50: '#fdf5f0',
          100: '#fbe8db',
          200: '#f6cdb6',
          300: '#f0ab87',
          400: '#e88257',
          500: '#e16636',
          600: '#d34e2c',
          700: '#af3c26',
          800: '#8c3225',
          900: '#722c22',
        },
        lavender: {
          50: '#f8f5ff',
          100: '#f0e8ff',
          200: '#e3d5ff',
          300: '#cdb3ff',
          400: '#b285ff',
          500: '#9a57ff',
          600: '#8b35f5',
          700: '#7b23e1',
          800: '#671dbd',
          900: '#561a9a',
        },
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
  safelist: [
    'bg-sage-100', 'bg-sage-200', 'bg-sage-500', 'bg-sage-600',
    'bg-terra-100', 'bg-terra-200', 'bg-terra-500', 'bg-terra-600',
    'bg-lavender-100', 'bg-lavender-200', 'bg-lavender-500', 'bg-lavender-600',
    'text-sage-600', 'text-sage-700', 'text-sage-800',
    'text-terra-600', 'text-terra-700', 'text-terra-800',
    'text-lavender-600', 'text-lavender-700', 'text-lavender-800',
    'border-sage-200', 'border-terra-200', 'border-lavender-200',
    'from-sage-500', 'to-sage-600', 'from-terra-500', 'to-terra-600',
    'from-lavender-500', 'to-lavender-600',
  ]
}