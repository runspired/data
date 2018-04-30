'use strict';

var path    = require('path');
var Promise = require('rsvp');
var fs = require('fs-extra');
var copy = Promise.denodeify(fs.copy);

var rootPath = process.cwd();

module.exports = function copyFixtureFiles(sourceDir) {
  return copy(path.join(rootPath, 'tests', 'fixtures', sourceDir), '.', { clobber: true });
};
