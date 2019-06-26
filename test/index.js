'use strict'

var test = require('tape')
var noop = require('node-noop').noop
var MQTTEmitter = require('../')

test('MQTTEmitter#addListener(): should be able to subscribe to a regular MQTT topic', function (t) {
  var emitter = new MQTTEmitter()
  emitter.addListener('foo/bar/baz', noop)
  t.end()
})

test('MQTTEmitter#addListener(): should be able to subscribe to a regular MQTT topic with options', function (t) {
  var emitter = new MQTTEmitter()
  emitter.addListener('foo/bar/baz', { qos: 0 }, noop)
  t.end()
})

test('MQTTEmitter#addListener(): should be able to subscribe to a MQTT topic with wildcards', function (t) {
  var emitter = new MQTTEmitter()
  emitter.addListener('foo/+/#', noop)
  t.end()
})

test('MQTTEmitter#addListener(): should be able to subscribe to a topic pattern', function (t) {
  var emitter = new MQTTEmitter()
  emitter.addListener('foo/+bar/#baz', noop)
  t.end()
})

test('MQTTEmitter#removeListener(): should be able to unsubscribe from a topic', function (t) {
  var emitter = new MQTTEmitter()
  emitter
    .on('test/remove', fn)
    .removeListener('test/remove', fn)
    .emit('test/remove', 'test')

  t.end()

  function fn () {
    t.end(new Error('Listener was not removed'))
  }
})

test('MQTTEmitter#removeListener(): should only remove one instance of a listener at a time', function (t) {
  var emitter = new MQTTEmitter()
  var topic = 'test/remove/2'
  emitter
    .on(topic, fn)
    .on(topic, fn)
    .removeListener(topic, fn)
    .emit(topic, 'test')

  function fn () {
    t.end()
  }
})

test('MQTTEmitter#removeAllListeners:should remove all listeners for single topic', function (t) {
  var emitter = new MQTTEmitter()
  var topic = 'test/remove/all'
  emitter
    .on(topic, fn)
    .on(topic, fn)
    .removeAllListeners(topic)
    .emit(topic, 'test')

  t.end()

  function fn () {
    t.end(new Error('Listener was not removed'))
  }
})

test('MQTTEmitter#removeAllListeners:should remove all listeners when no topic is specified', function (t) {
  var emitter = new MQTTEmitter()
  var topicPrefix = 'test/remove/all'
  emitter
    .on(topicPrefix + '1', fn)
    .on(topicPrefix + '2', fn)
    .on(topicPrefix + '3', fn)
    .removeAllListeners()

  emitter.emit(topicPrefix + '1', 'test')
  emitter.emit(topicPrefix + '2', 'test')
  emitter.emit(topicPrefix + '3', 'test')

  t.end()

  function fn () {
    t.end(new Error('Listener was not removed'))
  }
})

test('MQTTEmitter#emit(): should call listeners', function (t) {
  var emitter = new MQTTEmitter()
  emitter.on('test/emit/1', function () {
    t.end()
  })
  emitter.emit('test/emit/1', 'test')
})

test('MQTTEmitter#emit(): should return true when listeners got called', function (t) {
  t.plan(1)
  var emitter = new MQTTEmitter()
  var result = emitter
    .on('test/emit/2', noop)
    .emit('test/emit/2', 'test')

  t.equal(result, true, 'result is true')
})

test("MQTTEmitter#emit(): should return false when listeners don't get called", function (t) {
  t.plan(1)
  var emitter = new MQTTEmitter()
  var result = emitter.emit('test/emit/3', 'test')
  t.equal(result, false, 'result is false')
})

test('MQTTEmitter#emit(): should pass in payload as first argument to listener', function (t) {
  t.plan(1)
  var emitter = new MQTTEmitter()
  emitter.on('test/emit/3', function (payload) {
    t.equal(payload, 'test', 'payload is "test"')
  }).emit('test/emit/3', 'test')
})

test('MQTTEmitter#emit(): should trigger listeners with wildcards', function (t) {
  var emitter = new MQTTEmitter()
  emitter.on('test/emit/4/#', function () {
    t.end()
  }).emit('test/emit/4', 'test')
})

test('MQTTEmitter#emit(): should supply parsed params from pattern topics as second arg', function (t) {
  t.plan(1)
  var emitter = new MQTTEmitter()
  emitter.on('test/emit/+number', function (payload, params) {
    t.deepEqual(params, {
      number: '5'
    }, 'params contains `number` which is "5"')
  }).emit('test/emit/5', 'test')
})

test('MQTTEmitter#emit(): should supply mqtt topic that was emitted as third argument', function (t) {
  t.plan(1)
  var emitter = new MQTTEmitter()
  emitter.removeAllListeners()
  emitter.on('test/emit/#', function (payload, params, topic) {
    t.equal(topic, 'test/emit/6', 'third argument was the emitted topic')
  }).emit('test/emit/6', 'test')
})

test('MQTTEmitter#emit(): should supply original topic pattern as fourth argument', function (t) {
  t.plan(1)
  var emitter = new MQTTEmitter()
  emitter.removeAllListeners()
  emitter.on('test/emit/+number', function (payload, params, topic, pattern) {
    t.equal(pattern, 'test/emit/+number', 'fourth argument is the pattern')
  })
  emitter.emit('test/emit/4')
})

test('MQTTEmitter#once:should only invoke callback once', function (t) {
  t.plan(1)
  var emitter = new MQTTEmitter()
  var hasCalled = 0
  emitter.once('test/once/1', function () {
    hasCalled += 1
  })

  emitter.emit('test/once/1', 'test')
  emitter.emit('test/once/1', 'test')

  t.equal(hasCalled, 1, 'Callback called once')
})

test('MQTTEmitter#listeners(): should return empty arrays for topics without listeners', function (t) {
  t.plan(1)
  var emitter = new MQTTEmitter()
  var list = emitter.listeners('test/listeners/1')
  t.deepEqual(list, [], 'return is an empty list')
})

test('MQTTEmitter#listeners(): should return array of all listeners for a topic', function (t) {
  t.plan(1)
  var emitter = new MQTTEmitter()
  var topic = 'test/listners/2'
  emitter
    .on(topic, noop)
    .on(topic, noop)
    .on(topic, noop)

  var list = emitter.listeners(topic)
  t.deepEqual(list, [noop, noop, noop], 'list contains all the listeners')
})

test('MQTTEmitter#listeners(): should return empty array when listeners are cleared', function (t) {
  t.plan(1)
  var emitter = new MQTTEmitter()
  var topic = 'test/listners/3'
  emitter
    .on(topic, noop)
    .on(topic, noop)
    .on(topic, noop)

  emitter.removeAllListeners(topic)

  var list = emitter.listeners(topic)
  t.deepEqual(list, [], 'return is an empty list')
})

test('MQTTEmitter#onadd(): should be called on new topics', function (t) {
  var emitter = new MQTTEmitter()
  emitter.onadd = function () {
    t.end()
  }
  emitter.on('test/add/1', noop)
})

test('MQTTEmitter#onadd(): should only be called once per topic', function (t) {
  var emitter = new MQTTEmitter()
  emitter.onadd = function () {
    t.end()
  }
  emitter.on('test/add/2', noop)
  emitter.on('test/add/2', noop)
})

test('MQTTEmitter#onadd(): should be called with the topic string', function (t) {
  t.plan(1)
  var emitter = new MQTTEmitter()
  emitter.onadd = function (topic) {
    t.equal(topic, 'test/add/+', 'argument is topic')
  }
  emitter.on('test/add/+number', noop)
})

test('MQTTEmitter#onadd(): should be called again if a topic was previously removed', function (t) {
  var emitter = new MQTTEmitter()
  emitter.on('test/add/4', noop).removeListener('test/add/4', noop)
  emitter.onadd = function () {
    t.end()
  }
  emitter.on('test/add/4', noop)
})

test('MQTTEmitter#onremove(): should be called when all listeners are removed', function (t) {
  var emitter = new MQTTEmitter()
  emitter.onremove = function () {
    t.end()
  }
  emitter
    .on('test/remove/1', noop)
    .removeListener('test/remove/1', noop)
})

test('MQTTEmitter#onremove(): should be called when all listeners are removed at once', function (t) {
  t.plan(1)
  var emitter = new MQTTEmitter()
  var removedTopics = []
  emitter.onremove = function (topic) {
    removedTopics.push(topic)
  }

  emitter
    .on('test/remove/1', noop)
    .on('test/remove/1', noop)
    .on('test/remove/2', noop)
    .on('test/remove/+id/test', noop)
    .on('test/#', noop)
    .removeAllListeners()

  t.deepEqual(removedTopics, ['test/remove/1', 'test/remove/2', 'test/remove/+/test', 'test/#'])
})
