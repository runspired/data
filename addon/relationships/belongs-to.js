import { computed } from '@ember/object';

export default function belongsTo(type, options) {
  let meta = {
    type,
    isRelationship: true,
    options,
    kind: 'belongsTo',
    key: null
  };

  return computed({
    get(key) {},
    set(key, value) {}
  }).meta(meta);
}
