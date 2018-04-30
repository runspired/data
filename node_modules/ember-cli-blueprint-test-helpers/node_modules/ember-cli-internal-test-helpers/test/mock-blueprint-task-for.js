var MockBlueprintTaskFor = require('../lib/helpers/mock-blueprint-task-for');
var chai = require('chai');
var expect = chai.expect;

var DummyBlueprint = function() {};
DummyBlueprint.prototype.taskFor = function() {
   throw new Error('Shouldn\'t be called');
}

describe('Disable multiple tasks on blueprint', function() {

  it('should pass through for pre-configured tasks', function() {
    MockBlueprintTaskFor.disableTasks(DummyBlueprint, ['npm-install']);
    expect(new DummyBlueprint().taskFor('npm-install')).to.be.ok;
    MockBlueprintTaskFor.restoreTasks(DummyBlueprint);
  });

  it('shouldn\'t pass through for other tasks', function() {
    MockBlueprintTaskFor.disableTasks(DummyBlueprint, []);
    expect(function() { new DummyBlueprint().taskFor('bower-install') }).to.throw(Error);
    MockBlueprintTaskFor.restoreTasks(DummyBlueprint);
  });

  it('should pass through once restored', function() {
    MockBlueprintTaskFor.disableTasks(DummyBlueprint, ['npm-install']);
    MockBlueprintTaskFor.restoreTasks(DummyBlueprint);
    expect(function() { new DummyBlueprint().taskFor('npm-install') }).to.throw(Error);
  });

});
