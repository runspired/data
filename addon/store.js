import CollectionManager from './collection-manager';

export default class Store {
  constructor() {
    // internal bookkeeping; not observable
    this.collectionManager = new CollectionManager({ store: this });

    this._resourceCache = new Map();
    this._resourceDataCache = new Map();
    this._resourceIdentifierCache = new Map();
    this._relationshipCache = new Map();
  }

  // sync cache peek
  getIdentifier({ type, id, meta, links }) {}
  peekResource({ type, id }) {}
  peekResourceData({ type, id }) {}
  // peekAll replacement (kill RecordArray)
  peekResourceType(type) {}

  _inverseRelationshipFor(modelName, member) {}

  // Operations
  createResource() {}
  saveResource() {}
  deleteResource() {}
  unloadResource() {}
  reloadResource() {}

  // fuzzy, basically setRecordId / _commit of today
  //  but only for updating cache state not for pushing the
  //  mutations / transitioning the model
  resourceDidSave() {}

  // macro for "adapter.fetchDocument => store.pushDocument"
  //  all older find requests could be re-implemented using this
  fetchDocument(query, options) {}

  // async store.push and store._push store.pushPayload replacement
  pushDocument(document) {}

  // we should look at Orbit and M3's schema management for inspiration
  //  but until then these are still rather necessary as attributes and
  //  relationships are stored on Model class
  //  of note: we should kill mixin support for polymorphism
  modelFor(modelName) {}
  // necessary due to factory v. class divide
  _modelFactoryFor(modelName) {}
  hasModelFor(modelName) {}

  // clone the store
  fork() {}

  // unloadAll replacement, we remove unloadAll(<type>)
  // this is probably not even necessary, just need to dereference
  //  this store
  discardFork() {}
};
