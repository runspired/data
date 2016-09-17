import EmptyObject from '../empty-object';

export default class Schema {
  constructor(modelClass, store) {
    this.primaryKey = 'id';
    this._attributes = null;
    this._relationships = null;
    this._expandedModel = false;
    this.modelClass = modelClass;
    this.modelName = modelClass.modelName;
    this._typeMap = null;
    this._adapter = null;
    this._serializer = null;
    this.store = store;
  }

  get adapter() {
    if (this._adapter === null) {
      this._adapter = this.store.adapterFor(this.modelName);
    }
    return this._adapter;
  }

  get serializer() {
    if (this._serializer === null) {
      this._serializer = this.store.serializerFor(this.modelName);
    }
    if (!this._serializer) {
      throw new Error('Cant find serializer!');
    }
    return this._serializer;
  }

  get relationships() {
    if (this._expandedModel === false) {
      this._parseModel();
    }

    return this._relationships;
  }

  get attributes() {
    if (this._expandedModel === false) {
      this._parseModel();
    }

    return this._attributes;
  }

  get typeMap() {
    if (this._typeMap === null) {
      this._typeMap = {
        idToRecord: new EmptyObject(),
        records: [],
        metadata: new EmptyObject(),
        type: this.model
      };
    }

    return this._typeMap;
  }

  _parseModel() {
    let model = this.model;
    let keys = Object.keys(model);
    let attributes;
    let relationships;

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let value = model[key];

      if (value && value.meta) {
        if (value.meta.isAttribute === true) {
          if (!attributes) {
            attributes = new EmptyObject();
          }
          attributes[key] = value.meta;
        } else if (value.meta.isRelationship === true) {
          if (!relationships) {
            relationships = new EmptyObject();
          }
          relationships[key] = value.meta;
        }
      }
    }

    this._expandedModel = true;
    this._attributes = attributes;
    this._relationships = relationships;
  }
}
