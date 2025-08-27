import { heroui } from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              50: "hsl(145, 70%, 95%)",
              100: "hsl(145, 70%, 85%)",
              200: "hsl(145, 65%, 75%)",
              300: "hsl(145, 60%, 65%)",
              400: "hsl(145, 55%, 55%)",
              500: "hsl(145, 50%, 45%)", // main
              600: "hsl(145, 45%, 40%)",
              700: "hsl(145, 40%, 35%)",
              800: "hsl(145, 35%, 30%)",
              900: "hsl(145, 30%, 25%)",
            },
          },
        },
        dark: {
          colors: {
            primary: {
              50: "hsl(145, 70%, 15%)",
              100: "hsl(145, 65%, 20%)",
              200: "hsl(145, 60%, 25%)",
              300: "hsl(145, 55%, 30%)",
              400: "hsl(145, 50%, 35%)",
              500: "hsl(145, 45%, 40%)", // main dark
              600: "hsl(145, 40%, 45%)",
              700: "hsl(145, 35%, 50%)",
              800: "hsl(145, 30%, 55%)",
              900: "hsl(145, 25%, 60%)",
            },
          },
        },
      },
    }),
  ],
}

module.exports = config
