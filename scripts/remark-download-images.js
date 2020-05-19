const visit = require("unist-util-visit");
const https = require("https");
const http = require("http");
const path = require("path");
const fs = require("fs");

module.exports = downloadImages;
let config = {
  dir: "/tmp",
  relPath: "./"
};

const defaultOptions = {
  keepAlive: true,
  timeout: 30 * 1000,
  maxRedirects: 10,
  maxContentLength: 50 * 1000 * 1000
};

function downloadImages(configInput) {
  config = configInput;
  return transformer;
}

function transformer(tree, file, done) {
  visit(tree, "link", (node) => {
    if (node.children.length === 1 && node.children[0].type === "image") {
      node.type = "image";
      node.url = node.children[0].url;
      node.title = node.children[0].title;
      node.children = null;
    }
  });
  visit(tree, "image", visitor);

  done();
}

function visitor(node) {
  const url = new URL(node.url);
  let filename = url.pathname.split("/").slice(-1)[0];
  let options = Object.assign({}, defaultOptions, {
    host: url.host,
    path: url.pathname
  });

  const proto = url.protocol === "https:" ? https : http;
  const file = fs.createWriteStream(path.resolve(config.dir, "./", filename));
  console.log(`Downloading Image: ${url}`)
  proto.get(options, (res) => {
    res.pipe(file);
  });

  node.url = `${config.relPath}${filename}`;
}
