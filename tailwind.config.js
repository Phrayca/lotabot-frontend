/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#10151c",
        frame: "#0b0f14",
        surface: "#1a212b",
        surface2: "#212a35",
        surface3: "#28323e",
        border: "rgba(255,255,255,0.08)",
        ink: "#eef1f4",
        dim: "#8e99a8",
        dimmer: "#66707d",
        gold: "#c99a4b",
        goldbright: "#e4b565",
        green: "#3fa873",
        greenbg: "rgba(63,168,115,0.12)",
        red: "#c0563b",
        redbg: "rgba(192,86,59,0.12)",
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
