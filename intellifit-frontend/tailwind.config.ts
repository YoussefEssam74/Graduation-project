import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#0b4fd4',
          lime: '#a3e221',
          light: '#f5fee3',
        },
        secondary: {
          paleGreen: '#dcee7e',
          black: '#000000',
        },
        text: {
          dark: '#1a1a1a',
          light: '#ffffff',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        danger: '#ef4444',
        success: '#22c55e',
        warning: '#f59e0b',
      },
      fontFamily: {
        main: ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        md: '12px',
        lg: '20px',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
export default config;
