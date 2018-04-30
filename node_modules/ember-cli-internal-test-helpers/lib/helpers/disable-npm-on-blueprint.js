'use strict';
var assert        = require('./assert');
var originTaskFor;
var Promise       = require('rsvp');

module.exports = {
  disableNPM: function(Blueprint) {
    originTaskFor = Blueprint.prototype.taskFor;
    Blueprint.prototype.taskFor = function(taskName) {
      // we don't actually need to run the npm-install task, so lets mock it to
      // speedup tests that need it
      assert.equal(taskName, 'npm-install');

      return {
        run: function() {
          return Promise.resolve();
        }
      };
    };
  },

  restoreNPM: function(Blueprint) {
    Blueprint.prototype.taskFor = originTaskFor;
  }
};
