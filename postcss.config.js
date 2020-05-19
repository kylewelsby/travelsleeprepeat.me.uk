const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");
const postcssPurgecss = require("@fullhuman/postcss-purgecss");
const purgecss = postcssPurgecss({
  content: ["./layouts/**/*.html"],
  defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
  whitelistPatterns: [
    /-(leave|enter|appear)(|-(to|from|active))$/,
    /^(?!(|.*?:)cursor-move).+-move$/,
    /^router-link(|-exact)-active$/
  ]
});

const nano = require('cssnano')({
  preset: 'default',
})

module.exports = {
  plugins: [
    tailwindcss,
    autoprefixer,
    ...(process.env.NODE_ENV === "production" ? [purgecss, nano] : []),
  ]
};
