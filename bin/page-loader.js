#!/usr/bin/env node

const program = require('commander')
const pageLoader = require('../src')
const { red, green } = require('chalk')

program
  .version('0.0.1')
  .description('Downloads html page')
  .option('-o, --output <location>', 'enter location save to', process.cwd())
  .arguments('<url>')
  .helpOption('-h, --help', 'output usage information')
  .action((url) => {
    pageLoader(url, program.output).catch((err) => {
      console.log(red(err.message))
    })
  })

program.parse(process.argv)
