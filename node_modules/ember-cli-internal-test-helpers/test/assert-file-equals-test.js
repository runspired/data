var assertFileEquals = require('../lib/helpers/assert-file-equals');
var chai = require('chai');
var expect = chai.expect;

chai.use(require('./helpers/throw-helper'));

describe('assert-file-equals', function() {
  it('should pass if file contents are equal', function() {
    assertFileEquals('test/fixtures/foo123.txt', 'test/fixtures/foo123-copy.txt');
  });

  it('should throw if file contents are not equal', function() {
    expect(function() {
      assertFileEquals('test/fixtures/foo123.txt', 'test/fixtures/empty.txt');
    }).to.throw();
  });
});
