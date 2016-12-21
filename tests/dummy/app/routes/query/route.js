/* global window, heimdall, console */
import Ember from 'ember';

const {
  Route
} = Ember;

export default Route.extend({

  queryParams: {
    limit: {
      refreshModel: true
    },
    modelName: {
      refreshModel: true
    },
    included: {
      refreshModel: true
    }
  },

  model(params) {
    // switch this to 'production' when generating production build baselines
    let modelName = params.modelName;
    delete params.modelName;

    // Once heimdall 0.4.x is released we can uncomment this
    // to have nice timeline and trace events integration
    // heimdall.enableTimelineFeatures();

    let token = heimdall.start('ember-data');
    return this.get('store').query(modelName, params)
      .then((records) => {
        // RecordArray lazily materializes the records
        // We call toArray() to force materialization for benchmarking
        // otherwise we would need to consume the RecordArray in our UI
        // and clutter our benchmarks and make it harder to time.
        let toArrayToken = heimdall.start('queryResult.toArray');
        records.toArray();
        heimdall.stop(toArrayToken);
        heimdall.stop(token);
        window.result = heimdall.toString();

        return records;
      });
  }
});
