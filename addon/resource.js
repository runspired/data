import { DEBUG } from '@glimmer/env';

export default class Resource {
  static get isResource() {}
  static get type() {}

  static get relationships() {}
  static get attributes() {}

  get id() {}

  // ideally could go away
  //  in favor of adapter returning a state object /
  //  dirty state being tracked by a separate instance
  //  e.g. un-combine current and canonical and in-flight state
  get currentState() {}

  deleteRecord() {}
  unloadRecord() {}

  // use to access attribute info for "snapshotting"
  //   or "dirty state" inspection
  resourceData() {}

  save(options) {}

  // also used for reload
  fetch(options) {}
}

if (DEBUG) {
  // Ember Inspector support
  Model.prototype._debugInfo = function inspectorDebugInfo() {}
}