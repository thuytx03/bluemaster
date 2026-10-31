const plugin = require("tailwindcss/plugin")

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{tsx,html}"],
  darkMode: ["class", '[data-bluemaster-theme="dark"]'],
  prefix: "bm-",
  important: true,
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        mono: [
          "JetBrains Mono",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace"
        ]
      },
      colors: {
        app: "hsl(var(--x-bg) / <alpha-value>)",
        surface: {
          DEFAULT: "hsl(var(--x-surface) / <alpha-value>)",
          2: "hsl(var(--x-surface-2) / <alpha-value>)",
          3: "hsl(var(--x-surface-3) / <alpha-value>)"
        },
        line: {
          DEFAULT: "hsl(var(--x-border) / <alpha-value>)",
          strong: "hsl(var(--x-border-strong) / <alpha-value>)"
        },
        fg: {
          DEFAULT: "hsl(var(--x-fg) / <alpha-value>)",
          muted: "hsl(var(--x-fg-muted) / <alpha-value>)",
          subtle: "hsl(var(--x-fg-subtle) / <alpha-value>)"
        },
        brand: {
          DEFAULT: "hsl(var(--x-brand) / <alpha-value>)",
          hover: "hsl(var(--x-brand-hover) / <alpha-value>)",
          fg: "hsl(var(--x-brand-fg) / <alpha-value>)",
          ink: "hsl(var(--x-brand-ink) / <alpha-value>)",
          soft: "hsl(var(--x-brand-soft) / <alpha-value>)"
        },
        success: {
          DEFAULT: "hsl(var(--x-success) / <alpha-value>)",
          soft: "hsl(var(--x-success-soft) / <alpha-value>)"
        },
        warning: {
          DEFAULT: "hsl(var(--x-warning) / <alpha-value>)",
          soft: "hsl(var(--x-warning-soft) / <alpha-value>)"
        },
        danger: {
          DEFAULT: "hsl(var(--x-danger) / <alpha-value>)",
          soft: "hsl(var(--x-danger-soft) / <alpha-value>)"
        },
        info: {
          DEFAULT: "hsl(var(--x-info) / <alpha-value>)",
          soft: "hsl(var(--x-info-soft) / <alpha-value>)"
        }
      },
      /* Design rule: a single 8px radius everywhere (circles keep rounded-full) */
      borderRadius: {
        DEFAULT: "8px",
        sm: "8px",
        md: "8px",
        lg: "8px",
        xl: "8px",
        "2xl": "8px",
        "3xl": "8px",
        xl2: "8px",
        xl3: "8px"
      },
      boxShadow: {
        card: "0 1px 2px hsl(var(--x-shadow) / 0.04), 0 1px 1px hsl(var(--x-shadow) / 0.03)",
        pop: "0 12px 40px -8px hsl(var(--x-shadow) / 0.28), 0 2px 8px hsl(var(--x-shadow) / 0.08)",
        panel: "-16px 0 48px -12px hsl(var(--x-shadow) / 0.35)",
        glow: "0 0 0 4px hsl(var(--x-brand) / 0.18)"
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.96) translateY(-4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" }
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" }
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" }
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.9)", opacity: "0" }
        },
        "stripe": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "28px 0" }
        }
      },
      animation: {
        "fade-in": "fade-in .18s ease-out both",
        "fade-up": "fade-up .22s ease-out both",
        "pop-in": "pop-in .14s cubic-bezier(.2,.8,.2,1) both",
        "slide-in-right": "slide-in-right .22s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-ring": "pulse-ring 2.2s cubic-bezier(.2,.7,.3,1) infinite",
        stripe: "stripe .8s linear infinite"
      }
    }
  },
  plugins: [
    // Panel-width breakpoints (container queries). The extension panel is much
    // narrower than the viewport, so viewport breakpoints (sm/md/lg) are useless
    // inside it. Use `pw-md:bm-grid-cols-2` etc. instead.
    plugin(({ addVariant }) => {
      addVariant("pw-sm", "@container panel (min-width: 480px)")
      addVariant("pw-md", "@container panel (min-width: 600px)")
      addVariant("pw-lg", "@container panel (min-width: 760px)")
      addVariant("pw-xl", "@container panel (min-width: 960px)")
    })
  ]
}
