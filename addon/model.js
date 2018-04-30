import EmberObject, { computed } from '@ember/object';
import RootState from './model/states';
// This is leaked from the rest/json-api adapter layer, not the min adapter API
// import Errors from './model/errors';

const Model = EmberObject.extend({
  store: null,
  isEmpty: computed.reads('currentState.isEmpty'),
  isLoading: computed.reads('currentState.isLoading'),
  isLoaded: computed.reads('currentState.isLoaded'),
  hasDirtyAttributes: computed.reads('currentState.isDirty'),
  isSaving: computed.reads('currentState.isSaving'),
  isDeleted: computed.reads('currentState.isDeleted'),
  isNew: computed.reads('currentState.isNew'),
  isValid: computed.reads('currentState.isValid'),
  dirtyType: computed.reads('currentState.dirtyType'),
  isError: false,
  isReloading: false,

  currentState: RootState.empty,

  errors: computed(function() {
    return new Errors();
  }).readOnly(),

  adapterError: null,

  deleteRecord() {},

  unloadRecord() {},

  changedAttributes() {},

  rollbackAttributes() {},

  _createSnapshot() {},

  save(options) {},

  reload(options) {},

 _debugInfo() {}
});

Object.defineProperty(Model.prototype, 'id', {});

Model.reopenClass({
  isModel: true,

  modelName: null,

  inverseFor(name, store) {},

  relationships: computed(function() {}).readOnly(),

  attributes: computed(function() {}).readOnly(),

  toString() {
    return `model:${get(this, 'modelName')}`;
  }
});

export default Model;
