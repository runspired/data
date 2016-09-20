import Ember from 'ember';
import { assert } from "ember-data/-private/debug";
import {
  _bind,
  _guard,
  _objectIsAlive
} from "ember-data/-private/system/store/common";

import {
  normalizeResponseHelper
} from "ember-data/-private/system/store/serializer-response";

var Promise = Ember.RSVP.Promise;

function payloadIsNotBlank(adapterPayload) {
  if (Array.isArray(adapterPayload)) {
    return true;
  } else {
    return Object.keys(adapterPayload || {}).length;
  }
}

export function _find(adapter, store, schema, id, internalModel, options) {
  var snapshot = internalModel.createSnapshot(options);
  var promise = adapter.findRecord(store, schema.modelClass, id, snapshot);
  var serializer = schema.serializer;
  var label = "DS: Handle Adapter#findRecord of " + schema + " with id: " + id;

  promise = Promise.resolve(promise, label);
  promise = _guard(promise, _bind(_objectIsAlive, store));

  return promise.then(function(adapterPayload) {
    assert("You made a `findRecord` request for a " + schema.modelName + " with id " + id + ", but the adapter's response did not have any data", payloadIsNotBlank(adapterPayload));
    return store._adapterRun(function() {
      var payload = normalizeResponseHelper(serializer, store, schema, adapterPayload, id, 'findRecord');
      assert('Ember Data expected the primary data returned from a `findRecord` response to be an object but instead it found an array.', !Array.isArray(payload.data));
      //TODO Optimize
      var record = store.push(payload);
      return record._internalModel;
    });
  }, function(error) {
    internalModel.notFound();
    if (internalModel.isEmpty()) {
      internalModel.unloadRecord();
    }

    throw error;
  }, "DS: Extract payload of '" + schema.modelName + "'");
}


export function _findMany(adapter, store, schema, ids, internalModels) {
  let snapshots = Ember.A(internalModels).invoke('createSnapshot');
  let promise = adapter.findMany(store, schema.modelClass, ids, snapshots);
  let serializer = schema.serializer;
  let label = "DS: Handle Adapter#findMany of " + schema.modelName;

  if (promise === undefined) {
    throw new Error('adapter.findMany returned undefined, this was very likely a mistake');
  }

  promise = Promise.resolve(promise, label);
  promise = _guard(promise, _bind(_objectIsAlive, store));

  return promise.then(function(adapterPayload) {
    assert("You made a `findMany` request for " + schema.modelName + " records with ids " + ids + ", but the adapter's response did not have any data", payloadIsNotBlank(adapterPayload));
    return store._adapterRun(function() {
      let payload = normalizeResponseHelper(serializer, store, schema, adapterPayload, null, 'findMany');
      //TODO Optimize, no need to materialize here
      let records = store.push(payload);
      let internalModels = new Array(records.length);

      for (let i = 0; i < records.length; i++) {
        internalModels[i] = records[i]._internalModel;
      }

      return internalModels;
    });
  }, null, "DS: Extract payload of " + schema.modelName);
}

export function _findHasMany(adapter, store, internalModel, link, relationship) {
  var snapshot = internalModel.createSnapshot();
  var schema = store.schemaFor(relationship.type);
  var promise = adapter.findHasMany(store, snapshot, link, relationship);
  var serializer = schema.serializer;
  var label = "DS: Handle Adapter#findHasMany of " + internalModel + " : " + relationship.type;

  promise = Promise.resolve(promise, label);
  promise = _guard(promise, _bind(_objectIsAlive, store));
  promise = _guard(promise, _bind(_objectIsAlive, internalModel));

  return promise.then(function(adapterPayload) {
    assert("You made a `findHasMany` request for a " + internalModel.modelName + "'s `" + relationship.key + "` relationship, using link " + link + ", but the adapter's response did not have any data", payloadIsNotBlank(adapterPayload));
    return store._adapterRun(function() {
      var payload = normalizeResponseHelper(serializer, store, schema, adapterPayload, null, 'findHasMany');
      //TODO Use a non record creating push
      var records = store.push(payload);
      var recordArray = records.map((record) => record._internalModel);
      recordArray.meta = payload.meta;
      return recordArray;
    });
  }, null, "DS: Extract payload of " + internalModel + " : hasMany " + relationship.type);
}

export function _findBelongsTo(adapter, store, internalModel, link, relationship) {
  var snapshot = internalModel.createSnapshot();
  var schema = store.schemaFor(relationship.type);
  var promise = adapter.findBelongsTo(store, snapshot, link, relationship);
  var serializer = schema.serializer;
  var label = "DS: Handle Adapter#findBelongsTo of " + internalModel + " : " + relationship.type;

  promise = Promise.resolve(promise, label);
  promise = _guard(promise, _bind(_objectIsAlive, store));
  promise = _guard(promise, _bind(_objectIsAlive, internalModel));

  return promise.then(function(adapterPayload) {
    return store._adapterRun(function() {
      var payload = normalizeResponseHelper(serializer, store, schema, adapterPayload, null, 'findBelongsTo');

      if (!payload.data) {
        return null;
      }

      //TODO Optimize
      var record = store.push(payload);
      return record._internalModel;
    });
  }, null, "DS: Extract payload of " + internalModel + " : " + relationship.type);
}

export function _findAll(adapter, store, schema, sinceToken, options) {
  var modelName = schema.modelName;
  var recordArray = store.peekAll(modelName);
  var snapshotArray = recordArray.createSnapshot(options);
  var promise = adapter.findAll(store, schema.modelClass, sinceToken, snapshotArray);
  var serializer = schema.serializer;
  var label = "DS: Handle Adapter#findAll of " + modelName;

  promise = Promise.resolve(promise, label);
  promise = _guard(promise, _bind(_objectIsAlive, store));

  return promise.then(function(adapterPayload) {
    assert("You made a `findAll` request for " + modelName + " records, but the adapter's response did not have any data", payloadIsNotBlank(adapterPayload));
    store._adapterRun(function() {
      var payload = normalizeResponseHelper(serializer, store, schema, adapterPayload, null, 'findAll');
      //TODO Optimize
      store.push(payload);
    });

    store.didUpdateAll(schema);
    return store.peekAll(modelName);
  }, null, "DS: Extract payload of findAll " + modelName);
}

export function _query(adapter, store, schema, query, recordArray) {
  var modelName = schema.modelName;
  var promise = adapter.query(store, schema.modelClass, query, recordArray);

  var serializer = schema.serializer;
  var label = "DS: Handle Adapter#query of " + modelName;

  promise = Promise.resolve(promise, label);
  promise = _guard(promise, _bind(_objectIsAlive, store));

  return promise.then(function(adapterPayload) {
    var records, payload;
    store._adapterRun(function() {
      payload = normalizeResponseHelper(serializer, store, schema, adapterPayload, null, 'query');
      //TODO Optimize
      records = store.push(payload);
    });

    assert('The response to store.query is expected to be an array but it was a single record. Please wrap your response in an array or use `store.queryRecord` to query for a single record.', Array.isArray(records));
    recordArray.loadRecords(records, payload);

    return recordArray;
  }, null, "DS: Extract payload of query " + modelName);
}

export function _queryRecord(adapter, store, schema, query) {
  var modelName = schema.modelName;
  var promise = adapter.queryRecord(store, schema.modelClass, query);
  var serializer = schema.serializer;
  var label = "DS: Handle Adapter#queryRecord of " + modelName;

  promise = Promise.resolve(promise, label);
  promise = _guard(promise, _bind(_objectIsAlive, store));

  return promise.then(function(adapterPayload) {
    var record;
    store._adapterRun(function() {
      var payload = normalizeResponseHelper(serializer, store, schema, adapterPayload, null, 'queryRecord');

      assert("Expected the primary data returned by the serializer for a `queryRecord` response to be a single object or null but instead it was an array.", !Array.isArray(payload.data), {
        id: 'ds.store.queryRecord-array-response'
      });

      //TODO Optimize
      record = store.push(payload);
    });

    return record;

  }, null, "DS: Extract payload of queryRecord " + modelName);
}
