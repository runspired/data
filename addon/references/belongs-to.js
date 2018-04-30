import Reference from './reference';

export default class BelongsToReference extends Reference {
  constructor(store, parentInternalModel, belongsToRelationship) {
    super(store, parentInternalModel);
    this.type = belongsToRelationship.relationshipMeta.type;
    this.parent = parentInternalModel.recordReference;
    // TODO inverse

    // we leak this
    this.belongsToRelationship = belongsToRelationship;
  }

  // link or id
  remoteType() {}

  id() {}

  link() {}

  meta() {}

  push(objectOrPromise) {}

  value() {
    let inverseInternalModel = this.belongsToRelationship.inverseInternalModel;

    if (inverseInternalModel && inverseInternalModel.isLoaded()) {
      return inverseInternalModel.getRecord();
    }

    return null;
  }

  load() {}

  reload() {}

}
