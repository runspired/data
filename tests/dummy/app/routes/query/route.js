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

    // TODO @runspired we should bake console.time into heimdall as a flag
    console.time('query');

    let token = heimdall.start('ember-data');
    return this.get('store').query(modelName, params)
      .then((records) => {
        // RecordArray lazily materializes the records
        // We call toArray() to force materialization for benchmarking
        // otherwise we would need to consume the RecordArray in our UI
        // and clutter our benchmarks and make it harder to time.
        records.toArray();
        heimdall.stop(token);
        console.timeEnd('query');

        window.result = heimdall.toString();

        return records;
      });
  }
});
