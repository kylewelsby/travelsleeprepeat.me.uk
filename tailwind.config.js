const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  theme: {
    extend: {
      height: {
        hero: "512px"
      },
      colors: {
        gray: {
          100: "#E8E8E8",
          200: "#C6C6C6",
          300: "#A3A3A3",
          400: "#5F5F5F",
          500: "#1A1A1A",
          600: "#171717",
          700: "#101010",
          800: "#0C0C0C",
          900: "#080808"
        },
        orange: {
          100: "#FEECEA",
          200: "#FDD1CB",
          300: "#FBB5AB",
          400: "#F97D6C",
          500: "#F6452D",
          600: "#DD3E29",
          700: "#94291B",
          800: "#6F1F14",
          900: "#4A150E"
        }
      },
      fontFamily: {
        sans: ["Raleway", ...defaultTheme.fontFamily.sans]
      }
    }
  },
  variants: {},
  plugins: [require("tailwindcss-hyphens")]
};
