import Service from '@ember/service';
import IdentityMap from './identity-map';
import RecordArrayManager from "./record-array-manager";

export default Service.extend({
  init() {
    this._super(...arguments);
    // internal bookkeeping; not observable
    this.recordArrayManager = new RecordArrayManager({ store: this });
    this._identityMap = new IdentityMap();
  },

  createRecord(modelName, inputProperties) {},

  deleteRecord(record) { record.deleteRecord(); },
  unloadRecord(record) {record.unloadRecord(); },
  _reloadRecord(internalModel, options) {},

  getReference(modelName, id) {},
  peekRecord(modelName, id) {},
  hasRecordForId(modelName, id) {},
  recordForId(modelName, id) {},

  // same as findRecord but exists due to defaultStore
  find(modelName, id, options) {},
  findRecord(modelName, id, options) {},
  findMany(internalModels) {},
  findHasMany(internalModel, link, relationship) {},
  findBelongsTo(internalModel, link, relationship) {},

  query(modelName, query, options) {},
  queryRecord(modelName, query, options) {},

  findAll(modelName, options) {},

  peekAll(modelName) {},
  unloadAll(modelName) {},

  scheduleSave(internalModel, resolver, options) {},
  didSaveRecord(internalModel, dataArg) {},
  recordWasInvalid(internalModel, errors) {},
  recordWasError(internalModel, error) {},

  updateId(internalModel, data) {},

  modelFor(modelName) {},

  _modelFactoryFor(modelName) {},
  _hasModelFor(modelName) {},

  push(data) {},
  _push(jsonApiDoc) {},

  pushPayload(modelName, inputPayload) {},

  normalize(modelName, payload) {},
  recordWasLoaded(record) {},

  adapterFor(modelName) {},

  serializerFor(modelName) {},

  willDestroy() {},
});

function getModelFactory(store, cache, normalizedModelName) {}
function _modelForMixin(store, normalizedModelName) {}
function setupRelationships(store, internalModel, data, modelNameToInverseMap) {}
