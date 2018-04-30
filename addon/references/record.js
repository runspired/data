import Reference from './reference';

export default class RecordReference extends Reference {
  constructor(store, internalModel) {
    super(store, internalModel);
    this.type = internalModel.modelName;
  }

  id() {}

  // "identity" vs "id" or "link" which is a mega-troll
  remoteType() {}

  push(objectOrPromise) {}

  value() {}

  load() {}

  reload() {}
}
