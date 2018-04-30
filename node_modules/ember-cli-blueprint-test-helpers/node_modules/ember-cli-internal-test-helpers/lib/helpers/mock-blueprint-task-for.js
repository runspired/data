'use strict';
var originalTaskForFn;
var Promise     = require('rsvp');

module.exports = {
  disableTasks: function(Blueprint, tasksToMock) {
    originalTaskForFn = Blueprint.prototype.taskFor;

    Blueprint.prototype.taskFor = function(taskName) {

      if (tasksToMock.indexOf(taskName) !== -1) {
        return {
          run: function() {
            return Promise.resolve();
          }
        };
      }

      return originalTaskForFn.call(this, taskName);
    };
  },

  restoreTasks: function(Blueprint) {
    Blueprint.prototype.taskFor = originalTaskForFn;
    originalTaskForFn = undefined;
  }
};
