import { computed } from '@ember/object';

export default function hasMany(type, options) {
  let meta = {
    type,
    isRelationship: true,
    options,
    kind: 'hasMany',
    key: null
  };

  return computed({
    get(key) {},
    set(key, value) {}
  }).meta(meta);
}
