const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const app = require("../src/index");

const getFixturePath = (fileName) =>
  path.join(__dirname, "__fixtures__", fileName);
const testPageLink = "https://ru.hexlet.io/courses";
let before, after, result;

const tmpDirPath = path.join(os.tmpdir(), "page-loader-");

beforeAll(async () => {
  await fs.mkdtemp(path.join(os.tmpdir(), "page-loader-"));

  before = await fs.readFile(getFixturePath("before.html"));
  after = await fs.readFile(getFixturePath("after.html"));

  app(testPageLink, tmpDirPath);

  fs.readdir(tmpDirPath, function (err, items) {
    console.log(items);
  });
});

test("test", () => {
  expect(before.toString()).toEqual(after.toString());
});
