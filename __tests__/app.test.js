const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const nock = require('nock');
const app = require('../src/index');

const getFixturePath = (fileName) =>
  path.join(__dirname, '..', '__fixtures__', fileName);

const testPageLink = 'https://ru.hexlet.io/courses';

let tempDir = '';
let tempDirContent = [];

const scope = nock('https://ru.hexlet.io').persist();
nock.disableNetConnect();

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

  await scope.get('/courses').replyWithFile(200, getFixturePath('before.html'));
  await scope
    .get('/assets/application.css')
    .replyWithFile(200, getFixturePath('application.css'));
  await scope
    .get('/assets/professions/nodejs.png')
    .replyWithFile(200, getFixturePath('nodejs.png'));
  await scope
    .get('/packs/js/runtime.js')
    .replyWithFile(200, getFixturePath('runtime.js'));

  await app(testPageLink, tempDir);
});

beforeEach(async () => {
  tempDirContent = await fs.readdir(tempDir);
});

test('Should contain html file', async () => {
  expect(tempDirContent).toContain('ru-hexlet-io-courses.html');
});

test('Should contain folder with downloaded files', async () => {
  expect(tempDirContent).toContain('ru-hexlet-io-courses_files');
});

test('Downloaded files check', async () => {
  const downloadedFolderFiles = await fs.readdir(
    path.join(tempDir, 'ru-hexlet-io-courses_files')
  );
  expect(downloadedFolderFiles).toEqual([
    'ru-hexlet-io-assets-application.css',
    'ru-hexlet-io-assets-professions-nodejs.png',
    'ru-hexlet-io-courses.html',
    'ru-hexlet-io-packs-js-runtime.js',
  ]);
});

test('HTML file should have modified links', async () => {
  const downloadedHtmlContent = await fs.readFile(
    path.join(tempDir, 'ru-hexlet-io-courses.html'),
    'utf-8'
  );
  expect(
    downloadedHtmlContent.includes(
      'ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png'
    )
  ).toBeTruthy();
});
