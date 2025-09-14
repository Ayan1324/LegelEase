/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#eaf0ff',
          200: '#d9e2ff',
          300: '#b9c7ff',
          400: '#8a9fff',
          500: '#5b78ff',
          600: '#3a57e6',
          700: '#2a42b3',
          800: '#21358c',
          900: '#1c2c72'
        }
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,0.06)'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem'
      }
    }
  },
  plugins: []
}


