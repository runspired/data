export default class Relationship {
  constructor(store, internalModel, inverseKey, relationshipMeta) {
    let asyncOptionValue = relationshipMeta.options.async;

    this.store = store;
    this.internalModel = internalModel;
    this.relationshipMeta = relationshipMeta;
    this.inverseKey = inverseKey;

    this.key = relationshipMeta.key;
    this.isAsync = typeof asyncOptionValue === 'undefined' ? true : asyncOptionValue;

    this.currentState = null;
    this.canonicalState = null;

    this.linkPromise = null;
    this.hasData = false;
    this.hasLoaded = false;
    this.meta = null;
  }
}
