import Ember from 'ember';
import { module, test } from 'qunit';
import DS from 'ember-data';

let App, store, debugAdapter;

const {
  A,
  Application,
  get,
  run
} = Ember;

module("DS.DebugAdapter", {
  beforeEach() {
    run(function() {
      App = Application.create();

      App.StoreService = DS.Store.extend({});

      App.ApplicationAdapter = DS.Adapter.extend({
        shouldBackgroundReloadRecord: () => false
      });

      App.Post = DS.Model.extend({
        title: DS.attr('string')
      });

      // TODO: Remove this when Ember is upgraded to >= 1.13
      App.Post.reopenClass({
        _debugContainerKey: 'model:post'
      });

    });

    store = App.__container__.lookup('service:store');
    debugAdapter = App.__container__.lookup('data-adapter:main');

    let klass;

    if (App.__container__.factoryFor) {
      klass = App.__container__.factoryFor('model:post').class;
    } else {
      klass = App.__container__.lookupFactory('model:post');
    }

    debugAdapter.reopen({
      getModelTypes() {
        return new A([{ klass, name: 'post' }]);
      }
    });
  },
  afterEach() {
    run(App, App.destroy);
  }
});

test("Watching Model Types", function(assert) {
  assert.expect(5);

  var added = function(types) {
    assert.equal(types.length, 1);
    assert.equal(types[0].name, 'post');
    assert.equal(types[0].count, 0);
    assert.strictEqual(types[0].object, store.modelFor('post'));
  };

  var updated = function(types) {
    assert.equal(types[0].count, 1);
  };

  debugAdapter.watchModelTypes(added, updated);

  run(function() {
    store.push({
      data: {
        type: 'post',
        id: '1',
        attributes: {
          title: 'Post Title'
        }
      }
    });
  });
});

test("Watching Records", function(assert) {
  let post, record, addedRecords, updatedRecords, removedIndex, removedCount;

  function recordsAdded(wrappedRecords) {
    console.log('records added', wrappedRecords);
    addedRecords = wrappedRecords;
  }

  function recordsUpdated(wrappedRecords) {
    console.log('records updated', wrappedRecords);
    updatedRecords = wrappedRecords;
  }

  function recordsRemoved(index, count) {
    console.log('records removed', index, count);
    removedIndex = index;
    removedCount = count;
  }

  let modelClassOrName;
  if (debugAdapter.get('acceptsModelName')) {
    modelClassOrName = 'post';
  } else {
    modelClassOrName = App.__container__.lookupFactory('model:post');
  }
  debugAdapter.watchRecords(modelClassOrName, recordsAdded, recordsUpdated, recordsRemoved);

  run(function() {
    store.push({
      data: {
        type: 'post',
        id: '1',
        attributes: {
          title: 'Clean Post'
        }
      }
    });
  });

  assert.equal(get(addedRecords, 'length'), 1, 'We observed one record being added via push');
  record = addedRecords[0];
  assert.deepEqual(record.columnValues, { id: '1', title: 'Clean Post' });
  assert.deepEqual(record.filterValues, { isNew: false, isModified: false, isClean: true });
  assert.deepEqual(record.searchKeywords, ['1', 'Clean Post']);
  assert.deepEqual(record.color, 'black');

  run(function() {
    post = store.findRecord('post', 1);
  });

  run(function() {
    post.set('title', 'Modified Post');
  });

  assert.equal(get(updatedRecords, 'length'), 1, 'We observed one record being updated');
  record = updatedRecords[0];
  assert.deepEqual(record.columnValues, { id: '1', title: 'Modified Post' });
  assert.deepEqual(record.filterValues, { isNew: false, isModified: true, isClean: false });
  assert.deepEqual(record.searchKeywords, ['1', 'Modified Post']);
  assert.deepEqual(record.color, 'blue');

  run(function() {
    post = store.createRecord('post', { id: '2', title: 'New Post' });
  });

  assert.equal(get(addedRecords, 'length'), 1, 'We observed one record being add on create');
  record = addedRecords[0];
  assert.deepEqual(record.columnValues, { id: '2', title: 'New Post' });
  assert.deepEqual(record.filterValues, { isNew: true, isModified: false, isClean: false });
  assert.deepEqual(record.searchKeywords, ['2', 'New Post']);
  assert.deepEqual(record.color, 'green');

  run(post, 'unloadRecord');

  assert.equal(removedIndex, 1, 'We observed a record being removed at index 1');
  assert.equal(removedCount, 1, 'We observed one record being removed');
});
