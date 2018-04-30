import { mapBy, not } from '@ember/object/computed';
import ArrayProxy from '@ember/array/proxy';
import { computed } from '@ember/object';

export default ArrayProxy.extend({
  _registerHandlers(target, becameInvalid, becameValid) {},

  errorsByAttributeName: computed(function() {}),

  errorsFor(attribute) {},

  messages: mapBy('content', 'message'),

  content: computed(function() {}),

  unknownProperty(attribute) {},

  isEmpty: not('length').readOnly(),

  add(attribute, messages) {},

  remove(attribute) {},

  clear() {},
  has(attribute) {}
});
