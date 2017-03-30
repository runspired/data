/* eslint-env node */
var EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
var merge    = require('broccoli-merge-trees');
var globals  = require('./lib/globals');
var yuidoc   = require('./lib/yuidoc');
var StripClassCallCheck = require('babel6-plugin-strip-class-callcheck');
var path = require('path');

// when heimdall is present, set flag to set ember to prod
var INSTRUMENT_HEIMDALL = false;
var args = process.argv;

for (var i = 0; i < args.length; i++) {
  if (args[i] === '--instrument') {
    INSTRUMENT_HEIMDALL = true;
    break;
  }
}

module.exports = function(defaults) {
  var app = new EmberAddon(defaults, {
    // use babel6 options until we are using ember-cli@2.13
    babel6: {
      postTransformPlugins: [
        // while ember-data strips itself, ember does not currently
        [StripClassCallCheck]
      ]
    }
  });

  if (INSTRUMENT_HEIMDALL) {
    console.warn('SET EMBER TO PRODUCTION');
    app.vendorFiles['ember.js'].development = path.join(app.bowerDirectory, 'ember/ember.prod.js');
  }

  /*
    This build file specifies the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

  var appTree = app.toTree();

  if (process.env.EMBER_ENV === 'production') {
    var globalsBuild = globals('addon', 'config/package-manager-files');
    return merge([appTree, globalsBuild, yuidoc()]);
  } else {
    return appTree;
  }
};
