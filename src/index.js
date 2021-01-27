const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const _ = require('lodash');
const Listr = require('listr');

const normalize = (str) => _.trim(str.replace(/\W/g, '-'), '-');

const assetNormalize = (str) => _.trim(str.replace(/[/]/gm, '-'), '-');

const getAsset = (url) => axios.get(url, { responseType: 'arraybuffer' });

const isDownloadable = (src, link) => {
  const srcUrl = new URL(src, link);
  const pageUrl = new URL(link);
  return srcUrl.origin === pageUrl.origin;
};

const mapping = {
  img: 'src',
  script: 'src',
  link: 'href',
};

const app = (pageLink, destination) => {
  const pageUrl = new URL(pageLink);
  const { hostname, pathname } = pageUrl;

  const htmlFileName = `${normalize(`${hostname}${pathname}`)}.html`;
  const htmlFilePath = path.join(destination, htmlFileName);
  const assetsFolderName = `${normalize(`${hostname}${pathname}`)}_files`;
  const assetsFolderPath = path.join(destination, assetsFolderName);

  let html = '';
  const assets = [];

  return axios
    .get(pageLink)
    .then(({ data }) => {
      const $ = cheerio.load(data, { decodeEntities: false });

      const tagNames = Object.keys(mapping);

      tagNames.forEach((tagName) => {
        $(tagName).each(() => {
          const attrName = mapping[tagName];
          const srcLink = $(this).attr(attrName);
          if (srcLink && isDownloadable(srcLink, pageLink)) {
            const fileUrl = new URL(srcLink, pageLink);

            const name = `${normalize(fileUrl.host)}-${assetNormalize(
              fileUrl.pathname,
            )}`;
            const localPath = path.join(assetsFolderPath, name);
            const absolutePath = new URL(srcLink, pageLink).href;

            const addHtml = (filePath) => {
              if (filePath.split('.').length <= 1) {
                return `${filePath}.html`;
              }
              return filePath;
            };

            $(this).attr(attrName, path.join(assetsFolderName, addHtml(name)));

            return assets.push({ absolutePath, localPath: addHtml(localPath) });
          }
        });
      });

      html = $.html();
    })
    .then(() => fs.mkdir(assetsFolderPath))
    .then(() => {
      const tasks = new Listr(
        assets.map((asset) => {
          const { absolutePath, localPath } = asset;
          const task = {
            title: absolutePath,
            task: () => getAsset(absolutePath).then(({ data }) => fs.writeFile(localPath, data)),
          };
          return task;
        }),
        { concurrent: true, exitOnError: false },
      );

      return tasks.run();
    })
    .then(() => new Listr([
      {
        title: pageLink,
        task: () => fs.writeFile(htmlFilePath, html),
      },
    ]).run());
};

module.exports = app;
