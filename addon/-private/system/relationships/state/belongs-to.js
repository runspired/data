import Ember from 'ember';
import {
  assertPolymorphicType,
  assert
} from 'ember-data/-private/debug';
import {
  PromiseObject
} from '../../promise-proxies';
import Relationship from "./implicit";
const ImplicitRelationship = Relationship;

export default class BelongsToRelationship extends Relationship {
  get inverseRecord() {
    return this.currentState;
  }

  set inverseRecord(v) {
    this.currentState = v;
  }

  setRecord(newRecord) {
    if (newRecord) {
      this.addRecord(newRecord);
    } else if (this.currentState) {
      this.removeRecord(this.currentState);
    }
    this.setHasData(true);
    this.setHasLoaded(true);
  }

  setCanonicalRecord(newRecord) {
    if (newRecord) {
      this.addCanonicalRecord(newRecord);
    } else if (this.canonicalState) {
      this.removeCanonicalRecord(this.canonicalState);
    }
    this.flushCanonicalLater();
  }

  addCanonicalRecord(newRecord) {
    if (this.canonicalState === newRecord) {
      return;
    }

    if (this.canonicalState) {
      this.removeCanonicalRecord(this.canonicalState);
    }

    this.canonicalState = newRecord;

    if (!this.canonicalMembers.has(newRecord)) {
      this.canonicalMembers.add(newRecord);
      if (this.inverseKey) {
        newRecord._relationships.get(this.inverseKey).addCanonicalRecord(this.record);
      } else {
        if (!newRecord._implicitRelationships[this.inverseKeyForImplicit]) {
          newRecord._implicitRelationships[this.inverseKeyForImplicit] = new ImplicitRelationship(this.store, newRecord, this.key,  { options: {} });
        }
        newRecord._implicitRelationships[this.inverseKeyForImplicit].addCanonicalRecord(this.record);
      }
    }

    this.flushCanonicalLater();
    this.setHasData(true);
  }

  inverseDidDematerialize() {
    this.notifyBelongsToChanged();
  }

  flushCanonical() {
    //temporary fix to not remove newly created records if server returned null.
    //TODO remove once we have proper diffing
    if (this.currentState && this.currentState.isNew() && !this.canonicalState) {
      return;
    }
    if (this.currentState !== this.canonicalState) {
      this.currentState = this.canonicalState;
      this.notifyBelongsToChanged();
    }

    let list = this.members.list;
    this.willSync = false;
    //a hack for not removing new records
    //TODO remove once we have proper diffing
    let newRecords = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i].isNew()) {
        newRecords.push(list[i]);
      }
    }

    //TODO(Igor) make this less abysmally slow
    this.members = this.canonicalMembers.copy();
    for (let i = 0; i < newRecords.length; i++) {
      this.members.add(newRecords[i]);
    }
  }

  addRecord(newRecord) {
    if (this.currentState === newRecord) {
      return;
    }

    assertPolymorphicType(this.internalModel, this.relationshipMeta, newRecord);

    if (this.currentState) {
      this.removeRecord(this.currentState);
    }

    this.currentState = newRecord;

    if (!this.members.has(newRecord)) {
      this.members.addWithIndex(newRecord, idx);
      this.notifyRecordRelationshipAdded(newRecord, idx);
      if (this.inverseKey) {
        newRecord._relationships.get(this.inverseKey).addRecord(this.record);
      } else {
        if (!newRecord._implicitRelationships[this.inverseKeyForImplicit]) {
          newRecord._implicitRelationships[this.inverseKeyForImplicit] = new ImplicitRelationship(this.store, newRecord, this.key,  { options: {} });
        }
        newRecord._implicitRelationships[this.inverseKeyForImplicit].addRecord(this.record);
      }
      this.record.updateRecordArrays();
    }
    this.setHasData(true);

    this.notifyBelongsToChanged();
  }

  setRecordPromise(newPromise) {
    let content = newPromise.get && newPromise.get('content');
    assert("You passed in a promise that did not originate from an EmberData relationship. You can only pass promises that come from a belongsTo or hasMany relationship to the get call.", content !== undefined);
    this.setRecord(content ? content._internalModel : content);
  }

  removeRecordFromOwn(record) {
    if (this.currentState !== record) {
      // assert('cannot remove record from belongsTo, record is not the currentState', false);
      return;
    }
    this.currentState = null;

    this.members.delete(record);
    this.notifyRecordRelationshipRemoved(record);
    this.record.updateRecordArrays();

    this.notifyBelongsToChanged();
  }

  notifyBelongsToChanged() {
    this.internalModel.notifyBelongsToChanged(this.key);
  }

  removeCanonicalRecordFromOwn(record) {
    if (this.canonicalState !== record) {
      // assert('Cannot remove canonical record from this belongs-to relationship, the record is not the canonicalState!', false);
      return;
    }
    this.canonicalState = null;

    this.canonicalMembers.delete(record);
    this.flushCanonicalLater();
  }

  findRecord() {
    if (this.currentState) {
      return this.store._findByInternalModel(this.currentState);
    } else {
      return Ember.RSVP.Promise.resolve(null);
    }
  }

  fetchLink() {
    return this.store.findBelongsTo(this.internalModel, this.link, this.relationshipMeta).then((record) => {
      if (record) {
        this.addRecord(record);
      }
      return record;
    });
  }

  getRecord() {
    //TODO(Igor) flushCanonical here once our syncing is not stupid
    if (this.isAsync) {
      let promise;
      if (this.link) {
        if (this.hasLoaded) {
          promise = this.findRecord();
        } else {
          promise = this.findLink().then(() => this.findRecord());
        }
      } else {
        promise = this.findRecord();
      }

      return PromiseObject.create({
        promise: promise,
        content: this.currentState ? this.currentState.getRecord() : null
      });
    } else {
      if (this.currentState === null) {
        return null;
      }
      let toReturn = this.currentState.getRecord();
      assert("You looked up the '" + this.key + "' relationship on a '" + this.internalModel.modelName + "' with id " + this.internalModel.id +  " but some of the associated records were not loaded. Either make sure they are all loaded together with the parent record, or specify that the relationship is async (`DS.belongsTo({ async: true })`)", toReturn === null || !toReturn.get('isEmpty'));
      return toReturn;
    }
  }

  reload() {
    // TODO handle case when reload() is triggered multiple times

    if (this.link) {
      return this.fetchLink();
    }

    // reload record, if it is already loaded
    if (this.currentState && this.currentState.hasRecord) {
      return this.currentState.record.reload();
    }

    return this.findRecord();
  }

  updateData(data) {
    let internalModel = this.store._pushResourceIdentifier(this, data);
    this.setCanonicalRecord(internalModel);
  }
}
