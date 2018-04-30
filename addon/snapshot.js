export default class Snapshot {
  constructor(internalModel, options = {}) {
    this.id = internalModel.id;
    this.adapterOptions = options.adapterOptions;
    this.include = options.include;
    this.modelName = internalModel.modelName;
  }

  get record() {}
  get type() {}

  attr(keyName) {}

  attributes() {}
  changedAttributes() {}

  belongsTo(keyName, options) {}

  hasMany(keyName, options) {}
}
