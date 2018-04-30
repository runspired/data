'use strict';

var lint = require('mocha-eslint');

var paths = [
  'lib',
  'test',
];

lint(paths);
