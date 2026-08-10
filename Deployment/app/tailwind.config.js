/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          dark: "#000000",
          warm: "#785108",
          bright: "#FFCCF9",
        },
        footerEnd: "#ADA02E",
      },
      fontFamily: {
        michroma: ["Michroma", "sans-serif"],
      },
      fontSize: {
        base: "12px",
      },
    },
  },
  plugins: [],
};
