import MutableArray from '@ember/array/mutable';
import EmberObject from '@ember/object';

export default EmberObject.extend(MutableArray, {
  reload() {},

  save() {},

  createRecord(hash) {}
});
