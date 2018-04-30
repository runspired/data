'use strict';

var chai = require('chai');
var chaiFiles = require('chai-files');

chai.use(chaiFiles);

var expect = chai.expect;
var file = chaiFiles.file;

/*
  Assert that a file does not exist, for ensuring certain files aren't generated

  @method assertFileToNotExist
  @param {String} pathToCheck
*/
module.exports = function assertFileToNotExist(pathToCheck) {
  expect(file(pathToCheck)).to.not.exist;
};
