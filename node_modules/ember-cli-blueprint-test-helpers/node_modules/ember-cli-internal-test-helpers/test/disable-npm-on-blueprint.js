var DisableNpmOnBlueprint = require('../lib/helpers/disable-npm-on-blueprint');
var chai = require('chai');
var expect = chai.expect;

var DummyBlueprint = function() {};
DummyBlueprint.prototype.taskFor = function() {
   throw new Error('Shouldn\'t be called in context of npm tasks');
}

describe('Disable npm tasks on blueprint', function() {

  beforeEach(function() {
    DisableNpmOnBlueprint.disableNPM(DummyBlueprint);
  });

  afterEach(function() {
    DisableNpmOnBlueprint.restoreNPM(DummyBlueprint);
  });

  it('should pass through for npm install', function() {
    expect(new DummyBlueprint().taskFor('npm-install')).to.be.ok;
  });

  it('shouldn\'t pass through for other tasks', function() {
    expect(function() { new DummyBlueprint().taskFor('bower-install') }).to.throw(Error);
  });

});
