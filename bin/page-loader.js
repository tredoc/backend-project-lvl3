#!/usr/bin/env node

const program = require('commander');
const { red } = require('chalk');
const pageLoader = require('../src');

program
  .version('0.0.1')
  .description('Downloads html page')
  .option('-o, --output <location>', 'enter location save to', process.cwd())
  .arguments('<url>')
  .helpOption('-h, --help', 'output usage information')
  .action((url) => {
    pageLoader(url, program.output).catch((err) => {
      console.error(red(err.message));
      process.exit(1);
    });
  });

program.parse(process.argv);
