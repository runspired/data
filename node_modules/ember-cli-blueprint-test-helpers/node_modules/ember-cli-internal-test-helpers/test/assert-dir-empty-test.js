var assertDirEmpty = require('../lib/helpers/assert-dir-empty');
var chai = require('chai');
var expect = chai.expect;

chai.use(require('./helpers/throw-helper'));

describe('assert-dir-empty', function() {
  it('should pass if directory does not exist', function() {
    assertDirEmpty('test/fixtures/missing');
  });

  it('should pass if directory is empty', function() {
    assertDirEmpty('test/fixtures/empty');
  });

  it('should pass if directory only contains output folder', function() {
    assertDirEmpty('test/fixtures/with-output');
  });

  it('should throw if directory is not empty', function() {
    expect(function() {
      assertDirEmpty('test/fixtures/not-empty');
    }).to.throw(function(err) {
      expect(err.toString()).to.equal('AssertionError: test/fixtures/not-empty/ should be empty after `ember` tasks. Contained: empty.txt: expected [ \'empty.txt\' ] to deeply equal []');
    });
  });
});
