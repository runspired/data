var runCommand = require('../lib/helpers/run-command');
var chai = require('chai');
var expect = chai.expect;
var path = require('path');

var commandPath = path.join(process.cwd(), 'test', '.bin', 'fake-command.js');

describe('run-commannd', function() {

  it('should return command output', function() {
    return runCommand(commandPath, '--version').then(function(result) {
      var output = result.output[0].trim();
      expect(output).to.equal('ok');
    });
  });

  it('should return zero error code on success', function() {
    return runCommand(commandPath, '--version').then(function(result) {
      var resultCode = result.code;
      expect(resultCode).to.equal(0);
    });
  });

  it('should return empty error list on success', function() {
    return runCommand(commandPath, '--version').then(function(result) {
      var errors = result.errors;
      expect(errors.length).to.equal(0);
    });
  });

  it('should be rejected with error message on invalid invocation', function() {
    return runCommand(commandPath, '-----version').catch(function(result) {
      var errors = result.errors;
      expect(errors.length).to.be.above(0);
    });
  });

  it('should be rejected with error code on invalid invocation', function() {
    return runCommand(commandPath, '-----version').catch(function(result) {
      var code = result.code;
      expect(code).to.be.above(0);
    });
  });
});
