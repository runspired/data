/**
  @module ember-data
*/

import Ember from 'ember';
import {
  RecordArray,
  FilteredRecordArray,
  AdapterPopulatedRecordArray
} from "ember-data/-private/system/record-arrays";
var  MapWithDefault = Ember.MapWithDefault;
import OrderedSet from "ember-data/-private/system/ordered-set";
var get = Ember.get;

const {
  create,
  recordDidChange,
  recordDidChange_scheduleUpdate,
  recordArraysForRecord,
  updateRecordArrays,
  _recordWasDeleted,
  _recordWasChanged,
  recordWasLoaded,
  updateFilterRecordArray,
  _addRecordToRecordArray,
  populateLiveRecordArray,
  updateFilter,
  liveRecordArrayFor,
  createRecordArray,
  createFilteredRecordArray,
  createAdapterPopulatedRecordArray,
  registerFilteredRecordArray,
  unregisterRecordArray,
  array_flatten,
  array_remove
} = heimdall.registerMonitor('recordArrayManager',
  'create',
  'recordDidChange',
  'recordDidChange_scheduleUpdate',
  'recordArraysForRecord',
  'updateRecordArrays',
  '_recordWasDeleted',
  '_recordWasChanged',
  'recordWasLoaded',
  'updateFilterRecordArray',
  '_addRecordToRecordArray',
  'populateLiveRecordArray',
  'updateFilter',
  'liveRecordArrayFor',
  'createRecordArray',
  'createFilteredRecordArray',
  'createAdapterPopulatedRecordArray',
  'registerFilteredRecordArray',
  'unregisterRecordArray',
  'array_fatten',
  'array_remove'
);

/**
  @class RecordArrayManager
  @namespace DS
  @private
  @extends Ember.Object
*/
export default Ember.Object.extend({
  init() {
    heimdall.increment(create);
    this.filteredRecordArrays = MapWithDefault.create({
      defaultValue() { return []; }
    });

    this.liveRecordArrays = MapWithDefault.create({
      defaultValue: (schema) => {
        return this.createRecordArray(schema);
      }
    });

    this.changedRecords = [];
    this._adapterPopulatedRecordArrays = [];
  },

  recordDidChange(record) {
    heimdall.increment(recordDidChange);
    if (this.changedRecords.push(record) !== 1) { return; }
    heimdall.increment(recordDidChange_scheduleUpdate);
    Ember.run.schedule('actions', this, this.updateRecordArrays);
  },

  recordArraysForRecord(record) {
    heimdall.increment(recordArraysForRecord);
    record._recordArrays = record._recordArrays || OrderedSet.create();
    return record._recordArrays;
  },

  /**
    This method is invoked whenever data is loaded into the store by the
    adapter or updated by the adapter, or when a record has changed.

    It updates all record arrays that a record belongs to.

    To avoid thrashing, it only runs at most once per run loop.

    @method updateRecordArrays
  */
  updateRecordArrays() {
    heimdall.increment(updateRecordArrays);
    this.changedRecords.forEach((internalModel) => {
      if (get(internalModel, 'record.isDestroyed') || get(internalModel, 'record.isDestroying') ||
           (get(internalModel, 'currentState.stateName') === 'root.deleted.saved')) {
        this._recordWasDeleted(internalModel);
      } else {
        this._recordWasChanged(internalModel);
      }
    });

    this.changedRecords.length = 0;
  },

  _recordWasDeleted(record) {
    heimdall.increment(_recordWasDeleted);
    var recordArrays = record._recordArrays;

    if (!recordArrays) { return; }

    recordArrays.forEach((array) => array.removeInternalModel(record));

    record._recordArrays = null;
  },


  _recordWasChanged(record) {
    heimdall.increment(_recordWasChanged);
    var schema = record.schema;
    var recordArrays = this.filteredRecordArrays.get(schema);
    var filter;
    recordArrays.forEach((array) => {
      filter = get(array, 'filterFunction');
      this.updateFilterRecordArray(array, filter, schema, record);
    });
  },

  //Need to update live arrays on loading
  recordWasLoaded(record) {
    heimdall.increment(recordWasLoaded);
    var schema = record.schema;
    var recordArrays = this.filteredRecordArrays.get(schema);
    var filter;

    recordArrays.forEach((array) => {
      filter = get(array, 'filterFunction');
      this.updateFilterRecordArray(array, filter, schema, record);
    });

    if (this.liveRecordArrays.has(schema)) {
      var liveRecordArray = this.liveRecordArrays.get(schema);
      this._addRecordToRecordArray(liveRecordArray, record);
    }
  },
  /**
    Update an individual filter.

    @method updateFilterRecordArray
    @param {DS.FilteredRecordArray} array
    @param {Function} filter
    @param {Schema} schema
    @param {InternalModel} record
  */
  updateFilterRecordArray(array, filter, schema, record) {
    heimdall.increment(updateFilterRecordArray);
    var shouldBeInArray = filter(record.getRecord());
    var recordArrays = this.recordArraysForRecord(record);
    if (shouldBeInArray) {
      this._addRecordToRecordArray(array, record);
    } else {
      recordArrays.delete(array);
      array.removeInternalModel(record);
    }
  },

  _addRecordToRecordArray(array, record) {
    heimdall.increment(_addRecordToRecordArray);
    var recordArrays = this.recordArraysForRecord(record);
    if (!recordArrays.has(array)) {
      array.addInternalModel(record);
      recordArrays.add(array);
    }
  },

  populateLiveRecordArray(array, schema) {
    heimdall.increment(populateLiveRecordArray);
    var records = schema.typeMap.records;
    var record;

    for (var i = 0; i < records.length; i++) {
      record = records[i];

      if (!record.isDeleted() && !record.isEmpty()) {
        this._addRecordToRecordArray(array, record);
      }
    }
  },

  /**
    This method is invoked if the `filterFunction` property is
    changed on a `DS.FilteredRecordArray`.

    It essentially re-runs the filter from scratch. This same
    method is invoked when the filter is created in th first place.

    @method updateFilter
    @param {Array} array
    @param {Schema} schema
    @param {Function} filter
  */
  updateFilter(array, schema, filter) {
    heimdall.increment(updateFilter);
    var records = schema.typeMap.records;
    var record;

    for (var i = 0; i < records.length; i++) {
      record = records[i];

      if (!record.isDeleted() && !record.isEmpty()) {
        this.updateFilterRecordArray(array, filter, schema, record);
      }
    }
  },

  /**
    Get the `DS.RecordArray` for a model class, which contains all loaded records of
    given type.

    @method liveRecordArrayFor
    @param {Schema} schema
    @return {DS.RecordArray}
  */
  liveRecordArrayFor(schema) {
    heimdall.increment(liveRecordArrayFor);
    return this.liveRecordArrays.get(schema);
  },

  /**
    Create a `DS.RecordArray` for a model class.

    @method createRecordArray
    @param {Schema} schema
    @return {DS.RecordArray}
  */
  createRecordArray(schema) {
    heimdall.increment(createRecordArray);
    var array = RecordArray.create({
      type: schema.modelClass, // TODO deprecate somehow?
      schema: schema,
      content: Ember.A(),
      store: this.store,
      isLoaded: true,
      manager: this
    });

    return array;
  },

  /**
    Create a `DS.FilteredRecordArray` for a model class and register it for updates.

    @method createFilteredRecordArray
    @param {Schema} schema
    @param {Function} filter
    @param {Object} query (optional
    @return {DS.FilteredRecordArray}
  */
  createFilteredRecordArray(schema, filter, query) {
    heimdall.increment(createFilteredRecordArray);
    var array = FilteredRecordArray.create({
      query: query,
      type: schema.modelClass,
      schema: schema,
      content: Ember.A(),
      store: this.store,
      manager: this,
      filterFunction: filter
    });

    this.registerFilteredRecordArray(array, schema, filter);

    return array;
  },

  /**
    Create a `DS.AdapterPopulatedRecordArray` for a model class with given query.

    @method createAdapterPopulatedRecordArray
    @param {Schema} schema
    @param {Object} query
    @return {DS.AdapterPopulatedRecordArray}
  */
  createAdapterPopulatedRecordArray(schema, query) {
    heimdall.increment(createAdapterPopulatedRecordArray);
    var array = AdapterPopulatedRecordArray.create({
      type: schema.modelClass,
      schema: schema,
      query: query,
      content: Ember.A(),
      store: this.store,
      manager: this
    });

    this._adapterPopulatedRecordArrays.push(array);

    return array;
  },

  /**
    Register a RecordArray for a given model class to be backed by
    a filter function. This will cause the array to update
    automatically when records of that model class change attribute
    values or states.

    @method registerFilteredRecordArray
    @param {DS.RecordArray} array
    @param {Schema} schema
    @param {Function} filter
  */
  registerFilteredRecordArray(array, schema, filter) {
    heimdall.increment(registerFilteredRecordArray);
    var recordArrays = this.filteredRecordArrays.get(schema);
    recordArrays.push(array);

    this.updateFilter(array, schema, filter);
  },

  /**
    Unregister a RecordArray.
    So manager will not update this array.

    @method unregisterRecordArray
    @param {DS.RecordArray} array
  */
  unregisterRecordArray(array) {
    heimdall.increment(unregisterRecordArray);
    var schema = array.schema;

    // unregister filtered record array
    const recordArrays = this.filteredRecordArrays.get(schema);
    const removedFromFiltered = remove(recordArrays, array);

    // remove from adapter populated record array
    const removedFromAdapterPopulated = remove(this._adapterPopulatedRecordArrays, array);

    if (!removedFromFiltered && !removedFromAdapterPopulated) {

      // unregister live record array
      if (this.liveRecordArrays.has(schema)) {
        var liveRecordArrayForType = this.liveRecordArrayFor(schema);
        if (array === liveRecordArrayForType) {
          this.liveRecordArrays.delete(schema);
        }
      }

    }
  },

  willDestroy() {
    this._super(...arguments);

    this.filteredRecordArrays.forEach((value) => flatten(value).forEach(destroy));
    this.liveRecordArrays.forEach(destroy);
    this._adapterPopulatedRecordArrays.forEach(destroy);
  }
});

function destroy(entry) {
  entry.destroy();
}

function flatten(list) {
  heimdall.increment(array_flatten);
  var length = list.length;
  var result = Ember.A();

  for (var i = 0; i < length; i++) {
    result = result.concat(list[i]);
  }

  return result;
}

function remove(array, item) {
  heimdall.increment(array_remove);
  const index = array.indexOf(item);

  if (index !== -1) {
    array.splice(index, 1);
    return true;
  }

  return false;
}
