const http = require("http");
const https = require("https");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const unified = require("unified");
const parse = require("rehype-parse");
const rehype2remark = require("rehype-remark");
const stringify = require("remark-stringify");
const downloadImages = require("./remark-download-images");
const innerLinkFix = require("./remark-inner-link-fix");

const contentDir = path.resolve(__dirname, "../content/");

let catResp;
let tagResp;

axios.create({
  timeout: 30 * 1000,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  maxRedirects: 10,
  maxContentLength: 50 * 1000 * 1000
});

const ENDPOINT = "http://travelsleeprepeat.me.uk/wp-json/wp/v2";

async function fetchCategories(page = 1) {
  catResp = await axios.get(`${ENDPOINT}/categories`, {
    params: {
      per_page: 100,
      page: page
    }
  });

  for (let item of catResp.data) {
    if (item.description.length > 0) {
      let fm = matter("");
      fm.data.title = item.name;
      fm.data.url = item.link.replace(
        "http://travelsleeprepeat.me.uk/category/",
        "/categories/"
      );
      fm.content = item.description;
      let filepath = path.resolve(
        __dirname,
        `content/categories/${item.slug}/_index.md`
      );
      try {
        fs.mkdirSync(
          path.resolve(__dirname, `content/categories/${item.slug}`)
        );
      } catch (e) {}
      fs.writeFileSync(filepath, matter.stringify(fm), "utf-8");
    }
  }
}

async function fetchPosts(page = 1) {
  const resp = await axios.get(`${ENDPOINT}/posts`, {
    params: {
      per_page: 10,
      page: page
    }
  }).catch(err => {
    if(err.response.status === 400) {
      return {
        data: []
      }
    }
  })

  for (let post of resp.data) {
    await processPost(post);
  }
  return resp.data.length;
}

async function processPost(post) {
  console.log(`Processing ${post.link}`);
  let dir = path.resolve(
    contentDir,
    "posts",
    `${post.date.match(/^(\d{4}-\d{2})/)[0]}-${post.slug}`
  );
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {}

  await fetchCoverArtwork(post, dir);
  await fetchFrontMatter(post, dir);
}

async function fetchCoverArtwork(post, dir) {
  if (post.featured_media) {
    let resp = await axios.get(`${ENDPOINT}/media/${post.featured_media}`);
    await downloadImage(resp.data.source_url, dir, "cover.jpg");
  }
}

async function downloadImage(url, dir, filename) {
  console.log(`Downloading image ${url}`);
  try {
    fs.mkdirSync(path.resolve(dir, "images/"));
  } catch (err) {}

  if (!filename) {
    filename = new URL(url).pathname.split("/").slice(-1);
  }
  let outputFile = path.resolve(dir, `images/${filename}`);

  let artworkWriter = fs.createWriteStream(outputFile);
  let artworkStream = await axios.get(url, {
    responseType: "stream"
  });
  artworkStream.data.pipe(artworkWriter);
  await new Promise((resolve, reject) => {
    artworkWriter.on("finish", resolve);
    artworkWriter.on("error", reject);
  });
  return `images/${filename}`;
}

async function fetchFrontMatter(post, dir) {
  let frontMatter = {};
  let indexFilePath = path.resolve(dir, "index.md");
  try {
    fs.mkdirSync(path.resolve(dir, "images/"), { recursive: true });
  } catch (err) {}

  if (fs.existsSync(dir, "images/cover.jpg")) {
    frontMatter.cover = "images/cover.jpg";
  }
  if (!fs.existsSync(indexFilePath)) {
    fs.writeFileSync(indexFilePath, `---\ntitle: Untitled\n---`, "utf-8");
  }
  frontMatter.date = post.date;
  frontMatter.title = post.title.rendered;
  let categories = post.categories
    .map((id) => catResp.data.find((item) => item.id === id))
    .filter(Boolean);
  let tags = post.tags
    .map((id) => tagResp.data.find((item) => item.id === id))
    .filter(Boolean);
  frontMatter.destinations = categories
    .filter((item) => /\/destinations\//.test(item.link))
    .filter(item => item.slug !== 'destinations')
    .map((c) => c.name);
  frontMatter.categories = categories.map((c) => c.name);
  frontMatter.tags = tags.map((c) => c.name);
  let content = await unified()
    .use(parse)
    .use(rehype2remark)
    .use(innerLinkFix, { endpoint: ENDPOINT })
    .use(downloadImages, {
      dir: path.resolve(dir, "images/"),
      relPath: "images/"
    })
    .use(stringify)
    .process(post.content.rendered);
  fm = matter.read(indexFilePath);
  fm.data = Object.assign({}, fm.data, frontMatter);
  fm.content = String(content);
  let data = matter.stringify(fm);
  fs.writeFileSync(indexFilePath, data, "utf-8");
}

(async function main() {
  // catResp = await axios.get(
  //   `${ENDPOINT}/categories?per_page=100`
  // );
  tagResp = await axios.get(`${ENDPOINT}/tags?per_page=100`);
  await fetchCategories();
  let count = 10;
  let page = 13;
  while (count > 0) {
    console.log(`Page ${page}`);
    count = await fetchPosts(page);
    page++;
  }
  console.log("Complete")
})();
