import EmberObject from '@ember/object';

export default EmberObject.extend({
  findRecord(store, type, id, snapshot) {},
  findAll(store, type, sinceToken, snapshotRecordArray) {},
  query(store, modelClass, query, recordArray, options) {},
  queryRecord(store, type, query, options) {},
  generateIdForRecord(store, modelName, properties) {},
  createRecord(store, type, snapshot) {},
  updateRecord(store, type, snapshot) {},
  deleteRecord(store, type, snapshot) {},
  findMany(store, type, ids, snapshots) {},
  findHasMany(store, snapshot, url, relationship) {},
  findBelongsTo(store, snapshot, url, relationship) {},
  coalesceFindRequests: true,

  groupRecordsForFindMany(store, snapshots) {},

  shouldReloadRecord(store, snapshot) {},
  shouldReloadAll(store, snapshotRecordArray) {},
  shouldBackgroundReloadRecord(store, snapshot) {},
  shouldBackgroundReloadAll(store, snapshotRecordArray) {}
});
