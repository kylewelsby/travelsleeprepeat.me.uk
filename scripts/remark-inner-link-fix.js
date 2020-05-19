const visit = require("unist-util-visit");
const https = require("https");
const http = require("http");
const axios = require("axios");

axios.create({
  timeout: 30 * 1000,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  maxRedirects: 10,
  maxContentLength: 50 * 1000 * 1000
});

module.exports = innerLinkFix;

let config = {};

function innerLinkFix(configInput) {
  config = configInput;

  return transformer;
}

function transformer(tree, file, done) {
  let count = 0;
  visit(tree, "link", (node) => {
    count++;
    let url = new URL(node.url);
    let slug = url.pathname.replace(/\/$/,'').split("/").slice(-1)[0];
    if (
      url.hostname === "travelsleeprepeat.me.uk" &&
      url.pathname.split("/")[1] !== "wp-content" &&
      node.children[0].type === "text"
    ) {
      console.log(`Checking ${node.url}`)
      axios.get(`${config.endpoint}/posts?slug=${slug}`).then(res => {
        if(res.data.length === 0 ) {
          console.log("Could not find by slug, checking site")
          return axios.get(node.url).then(res => {
            url = new URL(res.request.res.responseUrl);
            let slug = url.pathname.split("/")[1];
            return axios.get(`${config.endpoint}/posts?slug=${slug}`);
          })
        }
        return res
      })
        .then((res) => {
          let json = res.data[0]
          node.url = `/posts/${json.date.match(/^(\d{4}-\d{2})/)[0]}-${
            json.slug
          }`;
        })
        .then(() => {
          count--;
          if (count === 0) {
            done();
          }
        });
    } else {
      count--;
    }
  });
  if (count === 0) {
    done();
  }
}
