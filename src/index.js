const axios = require('axios')
const fs = require('fs').promises
const path = require('path')
const cheerio = require('cheerio')
const _ = require('lodash')
const Listr = require('listr')

const normalize = (str) => {
  return _.trim(str.replace(/\W/g, '-'), '-')
}

const assetNormalize = (str) => {
  return _.trim(str.replace(/[/]/gm, '-'), '-')
}

const getAsset = (url) => {
  return axios.get(url, {
    responseType: 'arraybuffer',
  })
}

const isDownloadable = (src, link) => {
  const srcUrl = new URL(src, link)
  const pageUrl = new URL(link)
  return srcUrl.origin === pageUrl.origin
}

const mapping = {
  img: 'src',
  script: 'src',
  link: 'href',
}

const app = (pageLink, destination) => {
  const pageUrl = new URL(pageLink)
  const { hostname, pathname } = pageUrl

  const htmlFileName = normalize(`${hostname}${pathname}`) + '.html'
  const htmlFilePath = path.join(destination, htmlFileName)
  const assetsFolderName = normalize(`${hostname}${pathname}`) + '_files'
  const assetsFolderPath = path.join(destination, assetsFolderName)

  let html = ''
  let assets = []

  return axios
    .get(pageLink)
    .then(({ data }) => {
      $ = cheerio.load(data, { decodeEntities: false })

      const tagNames = Object.keys(mapping)

      tagNames.forEach((tagName) => {
        $(tagName).each(function (i, elem) {
          const attrName = mapping[tagName]
          const srcLink = $(this).attr(attrName)
          if (srcLink && isDownloadable(srcLink, pageLink)) {
            const fileUrl = new URL(srcLink, pageLink)

            const name = `${normalize(fileUrl.host)}-${assetNormalize(
              fileUrl.pathname
            )}`
            const localPath = path.join(assetsFolderPath, name)
            const absolutePath = new URL(srcLink, pageLink).href

            const addHtml = (filePath) => {
              if (filePath.split('.').length <= 1) {
                return filePath + '.html'
              }
              return filePath
            }

            $(this).attr(attrName, path.join(assetsFolderName, addHtml(name)))

            return assets.push({ absolutePath, localPath: addHtml(localPath) })
          }
        })
      })

      html = $.html()
    })
    .then(() => {
      return fs.mkdir(assetsFolderPath)
    })
    .then(() => {
      const tasks = new Listr(
        assets.map((asset) => {
          const { absolutePath, localPath } = asset
          const task = {
            title: absolutePath,
            task: () =>
              getAsset(absolutePath).then(({ data }) => {
                return fs.writeFile(localPath, data)
              }),
          }
          return task
        }),
        { concurrent: true, exitOnError: false }
      )

      return tasks.run()
    })
    .then(() => {
      return new Listr([
        {
          title: pageLink,
          task: () => {
            return fs.writeFile(htmlFilePath, html)
          },
        },
      ]).run()
    })
}

module.exports = app
