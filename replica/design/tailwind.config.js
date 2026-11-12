/** Mappa i token su Tailwind: usa bg-surface text-muted, mai hex grezzi. */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        'bg-deep': 'var(--color-bg-deep)',
        surface: 'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        border: 'var(--color-border)',
        'border-input': 'var(--color-border-input)',
        text: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        accent: 'var(--color-accent)',
        'accent-strong': 'var(--color-accent-strong)',
        pink: 'var(--color-accent-pink)',
        cyan: 'var(--color-accent-cyan)',
        'on-accent': 'var(--color-on-accent)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
      },
      backgroundImage: {
        app: 'var(--grad-app)', hero: 'var(--grad-hero)', scan: 'var(--grad-scan)',
        clean: 'var(--grad-clean)', speed: 'var(--grad-speed)',
      },
      fontFamily: { sans: ['var(--font-sans)'], display: ['var(--font-display)'], mono: ['var(--font-mono)'] },
      fontSize: {
        xs: ['12px', '16px'], sm: ['14px', '20px'], base: ['16px', '24px'],
        lg: ['20px', '28px'], xl: ['28px', '34px'], display: ['44px', '48px'],
      },
      borderRadius: { sm: '8px', md: '14px', lg: '22px', xl: '32px' },
      boxShadow: { card: 'var(--shadow-card)', pop: 'var(--shadow-pop)', glow: 'var(--shadow-glow)' },
      transitionTimingFunction: { out: 'var(--ease)', spring: 'var(--ease-spring)' },
    },
  },
};
