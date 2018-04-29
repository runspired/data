/* eslint-env node */
const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const merge    = require('broccoli-merge-trees');
const yuidoc   = require('./lib/yuidoc');

module.exports = function(defaults) {
  let app = new EmberAddon(defaults, {});

  /*
    This build file specifies the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

  let appTree = app.toTree();

  if (process.env.EMBER_ENV === 'production') {
    return merge([appTree, yuidoc()]);
  } else {
    return appTree;
  }
};
