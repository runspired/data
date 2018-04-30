'use strict';

var chai = require('chai');
var chaiFiles = require('chai-files');

chai.use(chaiFiles);

var expect = chai.expect;
var file = chaiFiles.file;

/*
  Assert that a given file matches another.

  @method assertFileEqual
  @param {String} pathToActual
  @param {String} pathToExpected
*/
module.exports = function assertFileEquals(pathToActual, pathToExpected) {
  expect(file(pathToActual)).to.equal(file(pathToExpected));
};
