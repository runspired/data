import Reference from './reference';

export default class HasManyReference extends Reference {
  constructor(store, parentInternalModel, hasManyRelationship) {
    super(store, parentInternalModel);
    this.type = hasManyRelationship.relationshipMeta.type;
    this.parent = parentInternalModel.recordReference;
    // TODO inverse

    // we leak this
    this.hasManyRelationship = hasManyRelationship;
  }

  // "link" or "ids", again trolly (and unstable)
  remoteType() {}

  link() {}

  ids() {}

  meta() {}

  push(objectOrPromise) {}

  value() {}

  load() {}

  reload() {}
}
