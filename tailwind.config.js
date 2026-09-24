/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Les couleurs pointent maintenant vers des variables CSS (definies dans
        // globals.css, avec un jeu de valeurs pour le mode sombre et un pour le mode clair)
        // au lieu de couleurs fixes : la meme classe Tailwind (bg-bg, text-dim, etc.)
        // suit donc automatiquement le theme choisi, sans rien changer nulle part ailleurs.
        bg: "var(--color-bg)",
        frame: "var(--color-frame)",
        surface: "var(--color-surface)",
        surface2: "var(--color-surface2)",
        surface3: "var(--color-surface3)",
        border: "var(--color-border)",
        ink: "var(--color-ink)",
        dim: "var(--color-dim)",
        dimmer: "var(--color-dimmer)",
        gold: "var(--color-gold)",
        goldbright: "var(--color-goldbright)",
        green: "var(--color-green)",
        greenbg: "var(--color-greenbg)",
        red: "var(--color-red)",
        redbg: "var(--color-redbg)",
      },
      fontFamily: {
        heading: ["Sora", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg2: "22px",
        md2: "14px",
      },
    },
  },
  plugins: [],
};
