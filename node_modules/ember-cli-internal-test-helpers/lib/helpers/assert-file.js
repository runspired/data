'use strict';

var flatten    = require('lodash/flatten');
var debug      = require('debug')('ember-cli-internal-test-helpers:assert-file');

var chai = require('chai');
var chaiFiles = require('chai-files');

chai.use(chaiFiles);

var expect = chai.expect;
var file = chaiFiles.file;

/*
  Asserts that a given file exists.

  ```js
  assertFile('some/file.js');
  ```

  You can also make assertions about the file’s contents using
  `contains` and `doesNotContain`:

  ```js
  assertFile('some/file.js', {
    contains: [
      'foo',
      /[0-9]+/
    ],
    doesNotContain: 'bar'
  });
  ```

  @method assertFile
  @param {String} path
  @param {Object} options
         Optional extra assertions to perform on the file.
  @param {String, Array} options.contains
         Strings or regular expressions the file must contain.
  @param {String, Array} options.doesNotContain
         Strings or regular expressions the file must *not* contain.
*/
module.exports = function assertFile(path, options) {
  var f = file(path);
  expect(f).to.exist;

  if (!options) {
    debug('no options, returning.');
    return;
  }

  if (options.contains) {
    flatten([options.contains]).forEach(function(expected) {
      if (expected.test) {
        expect(f).to.match(expected);
      } else {
        expect(f).to.contain(expected);
      }
    });
  }

  if (options.doesNotContain) {
    flatten([options.doesNotContain]).forEach(function(unexpected) {
      if (unexpected.test) {
        expect(f).to.not.match(unexpected);
      } else {
        expect(f).to.not.contain(unexpected);
      }
    });
  }

  if (options.isEmpty) {
    expect(f).to.equal('');
  }
};
