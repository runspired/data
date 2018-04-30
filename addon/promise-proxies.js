import ObjectProxy from '@ember/object/proxy';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import ArrayProxy from '@ember/array/proxy';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export const PromiseArray = ArrayProxy.extend(PromiseProxyMixin, {
  meta: reads('content.meta')
});

export const PromiseRecord = ObjectProxy.extend(PromiseProxyMixin);

export const PromiseBelongsTo = PromiseRecord.extend({
  meta: computed(function() {}),

  reload() {}
});

export const PromiseManyArray = PromiseArray.extend({
  reload() {},

  createRecord() {},
});
