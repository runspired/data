var fs            = require('fs');
var path          = require('path');
var filterImports = require('babel-plugin-filter-imports');
var featureFlags  = require('babel-plugin-feature-flags');
var stripHeimdall = require('babel5-plugin-strip-heimdall');
var stripClassCallCheck = require('babel5-plugin-strip-class-callcheck');

module.exports = function(environment) {
  var featuresJsonPath = __dirname + '/../config/features.json';
  var featuresJson = fs.readFileSync(featuresJsonPath, { encoding: 'utf8' });
  var features = JSON.parse(featuresJson);

  // TODO explicitly set all features which are not enabled to `false`, so
  // they are stripped --> make this configurable or pass features
  //
  // for (var feature in features) {
  //   if (features[feature] !== true) {
  //     features[feature] = false;
  //   }
  // }
  var plugins = [
    featureFlags({
      import: { module: 'ember-data/-private/features' },
      features: features
    }),
    { transformer: stripClassCallCheck, position: 'after' }
  ];

  if (environment === 'production') {
    plugins.push(
      filterImports({
        'ember-data/-private/debug': [
          'assert',
          'assertPolymorphicType',
          'debug',
          'deprecate',
          'info',
          'runInDebug',
          'warn',
          'debugSeal'
        ]
      }),
      // comment out when running non-baseline production benchmarks
      // WARNING do not ever commit the commented out version!
      stripHeimdall
    );
  }

  if (environment === 'development') {
    // uncomment when running baseline development benchmarks
    // plugins.push(stripHeimdall);
  }

  if (environment === 'test') {
    plugins.push(
      filterImports({
        'ember-data/-private/debug': [
          'instrument'
        ]
      }),
      stripHeimdall
    );
  }

  return plugins;
};
