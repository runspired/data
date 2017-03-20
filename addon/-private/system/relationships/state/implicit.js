/* global heimdall */
import OrderedSet from '../../ordered-set';
import Relationship from './relationship';

const {
  addCanonicalRecord,
  addCanonicalRecords,
  addRecord,
  addInternalModels,
  clear,
  flushCanonical,
  newRelationship,
  removeCanonicalRecord,
  removeCanonicalRecordFromOwn,
  removeCanonicalRecords,
  removeRecord,
  removeRecordFromOwn,
  removeInternalModels,
  updateRecordsFromAdapter
} = heimdall.registerMonitor('system.relationships.state.relationship',
  'addCanonicalRecord',
  'addCanonicalRecords',
  'addRecord',
  'addInternalModels',
  'clear',
  'flushCanonical',
  'newRelationship',
  'removeCanonicalRecord',
  'removeCanonicalRecordFromOwn',
  'removeCanonicalRecords',
  'removeRecord',
  'removeRecordFromOwn',
  'removeInternalModels',
  'updateRecordsFromAdapter'
);

export default class ImplicitRelationship extends Relationship {
  constructor(store, internalModel, inverseKey, relationshipMeta) {
    super(store, internalModel, inverseKey, relationshipMeta);
    this.kind = 'implicit';
    heimdall.increment(newRelationship);

    this.members = new OrderedSet();
    this.canonicalMembers = new OrderedSet();
  }

  destroy() {
    if (!this.inverseKey) { return; }

    let allMembers =
      // we actually want a union of members and canonicalMembers
      // they should be disjoint but currently are not due to a bug
      this.members.toArray().concat(this.canonicalMembers.toArray());

    allMembers.forEach(inverseInternalModel => {
      let relationship = inverseInternalModel._relationships.get(this.inverseKey);
      // TODO: there is always a relationship in this case; this guard exists
      // because there are tests that fail in teardown after putting things in
      // invalid state
      if (relationship) {
        relationship.inverseDidDematerialize();
      }
    });
  }

  inverseDidDematerialize() {}

  clear() {
    heimdall.increment(clear);

    let members = this.members.list;
    while (members.length > 0) {
      let member = members[0];
      this.removeRecord(member);
    }

    let canonicalMembers = this.canonicalMembers.list;
    while (canonicalMembers.length > 0) {
      let member = canonicalMembers[0];
      this.removeCanonicalRecord(member);
    }
  }

  removeInternalModels(internalModels) {
    heimdall.increment(removeInternalModels);
    internalModels.forEach((internalModel) => this.removeRecord(internalModel));
  }

  addInternalModels(internalModels, idx) {
    heimdall.increment(addInternalModels);
    internalModels.forEach(internalModel => {
      this.addRecord(internalModel, idx);
      if (idx !== undefined) {
        idx++;
      }
    });
  }

  addCanonicalRecords(records, idx) {
    heimdall.increment(addCanonicalRecords);
    for (let i=0; i<records.length; i++) {
      if (idx !== undefined) {
        this.addCanonicalRecord(records[i], i+idx);
      } else {
        this.addCanonicalRecord(records[i]);
      }
    }
  }

  addCanonicalRecord(record) {
    heimdall.increment(addCanonicalRecord);
    if (!this.canonicalMembers.has(record)) {
      this.canonicalMembers.add(record);
    }
    this.flushCanonicalLater();
    this.setHasData(true);
  }

  removeCanonicalRecords(records, idx) {
    heimdall.increment(removeCanonicalRecords);
    for (let i=0; i<records.length; i++) {
      if (idx !== undefined) {
        this.removeCanonicalRecord(records[i], i+idx);
      } else {
        this.removeCanonicalRecord(records[i]);
      }
    }
  }

  removeCanonicalRecord(record, idx) {
    heimdall.increment(removeCanonicalRecord);
    if (this.canonicalMembers.has(record)) {
      this.removeCanonicalRecordFromOwn(record);
      if (this.inverseKey) {
        this.removeCanonicalRecordFromInverse(record);
      }
    }
    this.flushCanonicalLater();
  }

  addRecord(record, idx) {
    heimdall.increment(addRecord);
    if (!this.members.has(record)) {
      this.members.addWithIndex(record, idx);
      this.notifyRecordRelationshipAdded(record, idx);
      this.internalModel.updateRecordArrays();
    }
    this.setHasData(true);
  }

  removeRecord(record) {
    heimdall.increment(removeRecord);
    if (this.members.has(record)) {
      this.removeRecordFromOwn(record);
      if (this.inverseKey) {
        this.removeRecordFromInverse(record);
      }
    }
  }

  removeRecordFromOwn(record) {
    heimdall.increment(removeRecordFromOwn);
    this.members.delete(record);
    this.notifyRecordRelationshipRemoved(record);
    this.internalModel.updateRecordArrays();
  }

  removeCanonicalRecordFromOwn(record) {
    heimdall.increment(removeCanonicalRecordFromOwn);
    this.canonicalMembers.delete(record);
    this.flushCanonicalLater();
  }

  flushCanonical() {
    heimdall.increment(flushCanonical);
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

  updateRecordsFromAdapter(records) {
    heimdall.increment(updateRecordsFromAdapter);
    //TODO(Igor) move this to a proper place
    //TODO Once we have adapter support, we need to handle updated and canonical changes
    this.computeChanges(records);
  }
}
