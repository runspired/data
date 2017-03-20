import { assert, assertPolymorphicType } from 'ember-data/-private/debug';
import { PromiseManyArray } from '../../promise-proxies';
import Relationship from './implicit';
import ManyArray from '../../many-array';
import diffArray from '../../diff-array';

export default class ManyRelationship extends Relationship {
  constructor(store, record, inverseKey, relationshipMeta) {
    super(store, record, inverseKey, relationshipMeta);
    this.kind = 'has-many';
    this.isPolymorphic = relationshipMeta.options.polymorphic;
    this.relatedModelName = relationshipMeta.type;
    this._manyArray = null;
    this.__loadingPromise = null;

    this.canonicalState = [];
    this.currentState = [];
  }

  get _loadingPromise() { return this.__loadingPromise; }

  _updateLoadingPromise(promise, content) {
    if (this.__loadingPromise) {
      if (content) {
        this.__loadingPromise.set('content', content)
      }
      this.__loadingPromise.set('promise', promise)
    } else {
      this.__loadingPromise = new PromiseManyArray({
        promise,
        content
      });
    }

    return this.__loadingPromise;
  }

  get manyArray() {
    if (!this._manyArray) {
      this._manyArray = ManyArray.create({
        canonicalState: this.canonicalState,
        currentState: this.currentState,
        store: this.store,
        relationship: this,
        type: this.store.modelFor(this.relatedModelName),
        record: this.internalModel,
        meta: this.meta,
        isPolymorphic: this.isPolymorphic
      });
    }
    return this._manyArray;
  }

  destroy() {
    super.destroy();
    if (this._manyArray) {
      this._manyArray.destroy();
      this._manyArray = null;
    }

    if (this._loadingPromise) {
      this._loadingPromise.destroy();
    }
  }

  updateMeta(meta) {
    super.updateMeta(meta);
    if (this._manyArray) {
      this._manyArray.set('meta', meta);
    }
  }

  addCanonicalRecord(record, idx) {
    if (this.canonicalState.indexOf(record) !== -1) {
      return;
    }

    if (idx !== undefined) {
      this.canonicalState.splice(idx, 0, record);
    } else {
      this.canonicalState.push(record);
    }
    super.addCanonicalRecord(record, idx);
  }

  inverseDidDematerialize() {
    if (this._manyArray) {
      this._manyArray.destroy();
      this._manyArray = null;
    }
    this.notifyHasManyChanged();
  }

  addRecord(record, idx) {
    if (this.currentState.indexOf(record) !== -1) {
      return;
    }

    this.manyArray.internalAddInternalModels([record], idx);
    super.addRecord(record, idx);
    // make lazy later
  }

  removeCanonicalRecordFromOwn(record, idx) {
    let i = idx;
    if (this.canonicalState.indexOf(record) === -1) {
      return;
    }

    if (i === undefined) {
      i = this.canonicalState.indexOf(record);
    }
    if (i > -1) {
      this.canonicalState.splice(i, 1);
    }
    super.removeCanonicalRecordFromOwn(record, idx);
  }

  flushCanonical() {
    let toSet = this.canonicalState;

    //a hack for not removing new records
    //TODO remove once we have proper diffing
    let newInternalModels = this.currentState.filter(
      // only add new records which are not yet in the canonical state of this
      // relationship (a new record can be in the canonical state if it has
      // been 'acknowleged' to be in the relationship via a store.push)
      (internalModel) => internalModel.isNew() && toSet.indexOf(internalModel) === -1
    );
    toSet = toSet.concat(newInternalModels);

    // diff to find changes
    let diff = diffArray(this.currentState, toSet);
    let manyArray = this.manyArray;

    if (diff.firstChangeIndex !== null) { // it's null if no change found
      // we found a change
      manyArray.arrayContentWillChange(diff.firstChangeIndex, diff.removedCount, diff.addedCount);
      manyArray.set('length', toSet.length);
      this.currentState = manyArray.currentState = toSet;
      manyArray.arrayContentDidChange(diff.firstChangeIndex, diff.removedCount, diff.addedCount);
      if (diff.addedCount > 0) {
        //notify only on additions
        //TODO only notify if unloaded
        this.notifyHasManyChanged();
      }
    }

    super.flushCanonical();
  }

  removeRecordFromOwn(record, idx) {
    if (this.currentState.indexOf(record) === -1) {
      return;
    }

    super.removeRecordFromOwn(record, idx);
    let manyArray = this.manyArray;
    if (idx !== undefined) {
      //TODO(Igor) not used currently, fix
      this.currentState.removeAt(idx);
    } else {
      manyArray.internalRemoveInternalModels([record]);
    }
  }

  notifyRecordRelationshipAdded(record, idx) {
    assertPolymorphicType(this.internalModel, this.relationshipMeta, record);

    this.internalModel.notifyHasManyAdded(this.key, record, idx);
  }

  reload() {
    let manyArray = this.manyArray;
    let manyArrayLoadedState = manyArray.get('isLoaded');

    if (this._loadingPromise) {
      if (this._loadingPromise.get('isPending')) {
        return this._loadingPromise;
      }
      if (this._loadingPromise.get('isRejected')) {
        manyArray.set('isLoaded', manyArrayLoadedState);
      }
    }

    let promise;
    if (this.link) {
      promise = this.fetchLink();
    } else {
      promise = this.store._scheduleFetchMany(this.currentState).then(() => manyArray);
    }

    this._updateLoadingPromise(promise);
    return this._loadingPromise;
  }

  computeChanges(records) {
    let state = this.canonicalState;
    let recordsToRemove = [];

    for (let i = 0; i < state.length; i++) {
      let internalModel = state[i];

      if (records.indexOf(internalModel) === -1) {
        recordsToRemove.push(internalModel);
      }
    }

    this.removeCanonicalRecords(recordsToRemove);

    for (let i = 0, l = records.length; i < l; i++) {
      let record = records[i];
      this.removeCanonicalRecord(record);
      this.addCanonicalRecord(record, i);
    }
  }

  fetchLink() {
    return this.store.findHasMany(this.internalModel, this.link, this.relationshipMeta).then(records => {
      if (records.hasOwnProperty('meta')) {
        this.updateMeta(records.meta);
      }
      this.store._backburner.join(() => {
        this.updateRecordsFromAdapter(records);
        this.manyArray.set('isLoaded', true);
      });
      return this.manyArray;
    });
  }

  findRecords() {
    let manyArray = this.manyArray;
    let internalModels = this.currentState;

    //TODO CLEANUP
    return this.store.findMany(internalModels).then(() => {
      if (!manyArray.get('isDestroyed')) {
        //Goes away after the manyArray refactor
        manyArray.set('isLoaded', true);
      }
      return manyArray;
    });
  }

  notifyHasManyChanged() {
    this.internalModel.notifyHasManyAdded(this.key);
  }

  getRecords() {
    //TODO(Igor) sync server here, once our syncing is not stupid
    let manyArray = this.manyArray;
    if (this.isAsync) {
      let promise;
      if (this.link) {
        if (this.hasLoaded) {
          promise = this.findRecords();
        } else {
          promise = this.findLink().then(() => this.findRecords());
        }
      } else {
        promise = this.findRecords();
      }
      return this._updateLoadingPromise(promise, manyArray);
    } else {
      assert(`You looked up the '${this.key}' relationship on a '${this.internalModel.type.modelName}' with id ${this.internalModel.id} but some of the associated records were not loaded. Either make sure they are all loaded together with the parent record, or specify that the relationship is async ('DS.hasMany({ async: true })')`, manyArray.isEvery('isEmpty', false));

      //TODO(Igor) WTF DO I DO HERE?
      // TODO @runspired equal WTFs to Igor
      if (!manyArray.get('isDestroyed')) {
        manyArray.set('isLoaded', true);
      }
      return manyArray;
    }
  }

  updateData(data) {
    let internalModels = this.store._pushResourceIdentifiers(this, data);
    this.updateRecordsFromAdapter(internalModels);
  }

  replace(idx, amt, objects) {
    this.currentState.splice(idx, amt, ...objects);
  }
}
