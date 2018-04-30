import { computed } from '@ember/object';

export default function attr(type, options) {
  let meta = {
    type: type,
    isAttribute: true,
    options: options
  };

  return computed({
    get(key) {},
    set(key, value) {}
  }).meta(meta);
}
