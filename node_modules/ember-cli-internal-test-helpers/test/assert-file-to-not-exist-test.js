var assertFileToNotExist = require('../lib/helpers/assert-file-to-not-exist');
var chai = require('chai');
var expect = chai.expect;

chai.use(require('./helpers/throw-helper'));

describe('assert-file-to-not-exist', function() {
  it('should pass if file does not exist', function() {
    assertFileToNotExist('test/fixtures/missing.txt');
  });

  it('should throw if file exists', function() {
    expect(function() {
      assertFileToNotExist('test/fixtures/foo123.txt');
    }).to.throw();
  });
});
