/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        "*, *::before, *::after": {
          boxSizing: "border-box",
          margin: "0",
          padding: "0",
        },
        "html, body, #root": {
          width: "100%",
          minHeight: "100vh",
          margin: "0",
          padding: "0",
          overflowX: "hidden",
        },
      });
    },
  ],
}