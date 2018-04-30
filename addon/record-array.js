import ArrayProxy from '@ember/array/proxy';
import { computed } from '@ember/object';

export default ArrayProxy.extend({
  isLoaded: false,
  isUpdating: false,


  type: computed('modelName', function() {}).readOnly(),

  objectAtContent(index) {},

  // TL;DR "reload"
  update() {},

  save() {},

  _createSnapshot(options) {},
});
