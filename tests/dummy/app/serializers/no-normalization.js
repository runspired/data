import Ember from 'ember';

export default Ember.Object.extend({
  normalizeResponse(_, __, payload) {
    return payload;
  }
});
