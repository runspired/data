
export default class SnapshotRecordArray {
  constructor(recordArray, meta, options = {}) {
    this.length = recordArray.get('length');
    this.meta = meta;
    this.adapterOptions = options.adapterOptions;
    this.include = options.include;
  }

  get type() {}

  snapshots() {}
}
