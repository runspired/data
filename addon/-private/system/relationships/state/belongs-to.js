import Ember from 'ember';
import {
  assertPolymorphicType,
  assert
} from 'ember-data/-private/debug';
import {
  PromiseObject
} from '../../promise-proxies';
import ImplicitRelationship from './implicit';
import Relationship from './relationship';

export default class BelongsToRelationship extends Relationship {
  constructor(store, internalModel, inverseKey, relationshipMeta) {
    super(store, internalModel, inverseKey, relationshipMeta);
    this.kind = 'belongs-to';
  }
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

  setCanonicalRecord(newInternalModel) {
    if (newInternalModel) {
      this.addCanonicalRecord(newInternalModel);
    } else if (this.canonicalState) {
      this.removeCanonicalRecord(this.canonicalState);
    }
    this.flushCanonicalLater();
  }

  // TODO @runspired is this still a win now that relationships are cheap and less noisy?
  setInitialCanonicalRecord(internalModel) {
    if (!internalModel) { return; }

    // When we initialize a belongsTo relationship, we want to avoid work like
    // notifying our internalModel that we've "changed" and excessive thrash on
    // setting up inverse relationships
    this.currentState = this.canonicalState = internalModel;
    this.setupInverseRelationship(internalModel);

    // this.flushCanonicalLater();
    // this.setHasData(true);
  }

  setupInverseRelationship(internalModel) {
    if (this.inverseKey) {
      let relationships = internalModel._relationships;
      let relationshipExisted = relationships.has(this.inverseKey);
      let relationship = relationships.get(this.inverseKey);
      if (relationshipExisted || this.isPolymorphic) {
        // if we have only just initialized the inverse relationship, then it
        // already has this.internalModel in its canonicalMembers, so skip the
        // unnecessary work.  The exception to this is polymorphic
        // relationships whose members are determined by their inverse, as those
        // relationships cannot efficiently find their inverse payloads.
        relationship.addCanonicalRecord(this.internalModel);
      }
    } else {
      let relationships = internalModel._implicitRelationships;
      let relationship = relationships[this.inverseKeyForImplicit];
      if (!relationship) {
        relationship = relationships[this.inverseKeyForImplicit] =
          new ImplicitRelationship(this.store, internalModel, this.key,  { options: {} });
      }
      relationship.addCanonicalRecord(this.internalModel);
    }
  }

  addCanonicalRecord(newInternalModel) {
    if (this.canonicalState === newInternalModel) {
      return;
    }

    if (this.canonicalState) {
      this.removeCanonicalRecord(this.canonicalState);
    }

    this.canonicalState = newInternalModel;
    this.setupInverseRelationship(newInternalModel);

    this.flushCanonicalLater();
    this.setHasData(true);
  }

  inverseDidDematerialize() {
    this.notifyBelongsToChanged();
  }

  flushCanonical() {
    this.willSync = false;

    // don't remove newly created records if server returned null.
    if (this.currentState && this.currentState.isNew() && !this.canonicalState) {
      return;
    }

    if (this.currentState !== this.canonicalState) {
      this.currentState = this.canonicalState;
      this.notifyBelongsToChanged();
    }
  }

  addRecord(newInternalModel) {
    if (this.currentState === newInternalModel) {
      return;
    }

    assertPolymorphicType(this.internalModel, this.relationshipMeta, newInternalModel);

    if (this.currentState) {
      this.removeRecord(this.currentState);
    }

    this.currentState = newInternalModel;

    // TODO implicit-legacy @runspired is this needed?
    this.notifyRecordRelationshipAdded(newInternalModel, 0);

    if (this.inverseKey) {
      newInternalModel._relationships.get(this.inverseKey).addRecord(this.internalModel);
    } else {
      let relationships = newInternalModel._implicitRelationships;
      let relationship = relationships[this.inverseKeyForImplicit];

      if (!relationship) {
        relationship = relationships[this.inverseKeyForImplicit] =
          new ImplicitRelationship(this.store, newInternalModel, this.key,  { options: {} });
      }
      relationship.addRecord(this.internalModel);
    }

    this.internalModel.updateRecordArrays();
    this.setHasData(true);

    this.notifyBelongsToChanged();
  }

  setRecordPromise(newPromise) {
    let content = newPromise.get && newPromise.get('content');
    assert("You passed in a promise that did not originate from an EmberData relationship. You can only pass promises that come from a belongsTo or hasMany relationship to the get call.", content !== undefined);
    this.setRecord(content ? content._internalModel : content);
  }

  removeRecord(internalModel) {
    if (this.currentState === internalModel) {
      this.removeRecordFromOwn(internalModel);

      if (this.inverseKey) {
        this.removeRecordFromInverse(internalModel);
      } else {
        if (internalModel._implicitRelationships[this.inverseKeyForImplicit]) {
          internalModel._implicitRelationships[this.inverseKeyForImplicit].removeRecord(this.internalModel);
        }
      }
    }
  }

  removeRecordFromOwn(internalModel) {
    if (this.currentState !== internalModel) {
      // assert('cannot remove record from belongsTo, record is not the currentState', false);
      return;
    }
    this.currentState = null;

    // TODO implicit-legacy @runspired is this needed?
    this.notifyRecordRelationshipRemoved(internalModel);
    this.internalModel.updateRecordArrays();

    this.notifyBelongsToChanged();
  }

  notifyBelongsToChanged() {
    this.internalModel.notifyBelongsToChanged(this.key);
  }

  removeCanonicalRecord(internalModel) {
    if (this.canonicalState === internalModel) {
      this.removeCanonicalRecordFromOwn(internalModel);

      if (this.inverseKey) {
        this.removeCanonicalRecordFromInverse(internalModel);
      } else {
        if (internalModel._implicitRelationships[this.inverseKeyForImplicit]) {
          internalModel._implicitRelationships[this.inverseKeyForImplicit].removeCanonicalRecord(this.internalModel);
        }
      }
    }

    this.flushCanonicalLater();
  }

  removeCanonicalRecordFromOwn(internalModel) {
    if (this.canonicalState !== internalModel) {
      // assert('Cannot remove canonical record from this belongs-to relationship, the record is not the canonicalState!', false);
      return;
    }
    this.canonicalState = null;

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
    return this.store.findBelongsTo(this.internalModel, this.link, this.relationshipMeta)
      .then((internalModel) => {
        if (internalModel) {
          this.addRecord(internalModel);
        }
        return internalModel;
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

  updateData(data, initial) {
    let internalModel = this.store._pushResourceIdentifier(this, data);
    if (initial) {
      this.setInitialCanonicalRecord(internalModel);
    } else {
      this.setCanonicalRecord(internalModel);
    }
  }

  clear() {
    if (this.currentState) {
      this.removeRecord(this.currentState);
    }

    if (this.canonicalState) {
      this.removeCanonicalRecord(this.canonicalState);
    }
  }

  destroy() {
    if (!this.inverseKey) { return; }

    if (this.currentState) {
      let relationship = this.currentState._relationships.get(this.inverseKey);
      // TODO: there is always a relationship in this case; this guard exists
      // because there are tests that fail in teardown after putting things in
      // invalid state
      if (relationship) {
        relationship.inverseDidDematerialize();
      }
    }

    if (this.canonicalState && this.canonicalState !== this.currentState) {
      let relationship = this.canonicalState._relationships.get(this.inverseKey);
      // TODO: there is always a relationship in this case; this guard exists
      // because there are tests that fail in teardown after putting things in
      // invalid state
      // TODO: can we remove this with the decomplection?
      if (relationship) {
        relationship.inverseDidDematerialize();
      }
    }
  }
}
