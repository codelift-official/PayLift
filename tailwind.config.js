/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  // Dark mode via data-theme="dark" on <html>
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Themeable CSS variables
        'app-bg': 'var(--bg-app)',
        'card': 'var(--bg-card)',
        'border': 'var(--bg-border)',
        'text-primary': 'var(--text-primary)',
        'text-muted': 'var(--text-muted)',
        // Brand & semantic tokens
        'primary': '#E53935',
        'primary-hover': '#C62828',
        'primary-soft': '#FFF0F0',
        'success': '#00A86B',
        'success-soft': '#E8F7EF',
        'info': '#2563EB',
        'info-soft': '#EEF4FF',
        'warning': '#F59E0B',
        'danger': '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        chip: '999px',
        input: '10px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        raised: '0 4px 12px rgba(15,23,42,0.08)',
        modal: '0 20px 60px rgba(15,23,42,0.18)',
        fab: '0 4px 12px rgba(229,57,53,0.4)',
      },
    },
  },
  plugins: [],
};
