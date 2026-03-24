/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ff",
          500: "#0066ff",
          700: "#0044aa",
        },
      },
    },
  },
  plugins: [],
};

