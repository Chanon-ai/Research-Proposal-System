const fs = require('fs');
const path = require('path');
const Module = require('module');

const extraNodeModules = path.resolve(__dirname, '..', '.runtime-packages', 'node_modules');

if (fs.existsSync(extraNodeModules)) {
  process.env.NODE_PATH = process.env.NODE_PATH
    ? `${extraNodeModules}${path.delimiter}${process.env.NODE_PATH}`
    : extraNodeModules;

  Module._initPaths();
}
