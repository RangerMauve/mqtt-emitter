var assert = require("chai").assert;
var noop = require("node-noop").noop;
var MQTTEmitter = require("../");

describe("MQTTEmitter", function() {
	var emitter = new MQTTEmitter();

	beforeEach(function() {
		emitter = new MQTTEmitter();
	})

	describe("#addListener()", function() {
		it("should be able to subscribe to a regular MQTT topic", function() {
			emitter.addListener("foo/bar/baz", noop)
		});

		it("should be able to subscribe to a MQTT topic with wildcards", function() {
			emitter.addListener("foo/+/#", noop);
		});

		it("should be able to subscribe to a topic pattern", function() {
			emitter.addListener("foo/+bar/#baz", noop);
		});
	});

	describe("#removeListener()", function() {
		it("should be able to unsubscribe from a topic", function() {
			emitter
				.on("test/remove", fn)
				.removeListener("test/remove", fn)
				.emit("test/remove", "test");

			function fn() {
				throw new Error("Listener was not removed");
			}
		});

		it("should only remove one instance of a listener at a time", function(done) {
			var topic = "test/remove/2";
			emitter
				.on(topic, fn)
				.on(topic, fn)
				.removeListener(topic, fn)
				.emit(topic, "test");

			function fn() {
				done();
			}
		})
	});

	describe("#removeAllListeners", function() {
		it("should remove all listeners for single topic", function() {
			var topic = "test/remove/all";
			emitter
				.on(topic, fn)
				.on(topic, fn)
				.removeAllListeners(topic)
				.emit(topic, "test");

			function fn() {
				throw new Error("Listener was not removed");
			}
		});

		it("should remove all listeners when no topic is specified", function() {
			var topic_prefix = "test/remove/all";
			emitter
				.on(topic_prefix + "1", fn)
				.on(topic_prefix + "2", fn)
				.on(topic_prefix + "3", fn)
				.removeAllListeners();

			emitter.emit(topic_prefix + "1", "test");
			emitter.emit(topic_prefix + "2", "test");
			emitter.emit(topic_prefix + "3", "test");

			function fn() {
				throw new Error("Listener was not removed");
			}
		})
	});

	describe("#emit()", function() {
		it("should call listeners", function(done) {
			emitter.on("test/emit/1", function() {
				done();
			});
			emitter.emit("test/emit/1", "test");
		});

		it("should return true when listeners got called", function() {
			var result = emitter
				.on("test/emit/2", noop)
				.emit("test/emit/2", "test");
			assert.equal(result, true, "result is true");
		});

		it("should return false when listeners don't get called", function() {
			var result = emitter.emit("test/emit/3", "test");

			assert.equal(result, false, "result is false");
		});

		it("should pass in payload as first argument to listener", function(done) {
			emitter.on("test/emit/3", function(payload) {
				assert.equal(payload, "test", "payload is \"test\"");
				done();
			}).emit("test/emit/3", "test");
		});

		it("should trigger listeners with wildcards", function(done) {
			emitter.on("test/emit/4/#", function() {
				done();
			}).emit("test/emit/4", "test");
		});

		it("should supply parsed params from pattern topics as second arg", function() {
			emitter.removeAllListeners();
			emitter.on("test/emit/+number", function(payload, params) {
				assert.isObject(params, "params are an object");
				assert.propertyVal(params, "number", "5", "params contains `number` which is \"5\"");
			}).emit("test/emit/5", "test");
		});

		it("should supply mqtt topic that was emitted as third argument", function() {
			emitter.removeAllListeners();
			emitter.on("test/emit/#", function(payload, params, topic) {
				assert.equal(topic, "test/emit/6", "third argument was the emitted topic");
			}).emit("test/emit/6", "test");
		});

		it("should suppy original topic pattern as fourth argument", function() {
			emitter.removeAllListeners();
			emitter.on("test/emit/+number", function(payload, params, topic, pattern) {
				assert.equal(pattern, "test/emit/+number", "fourth argument is the pattern");
			});
		});
	});


	describe("#once", function() {
		it("should only invoke callback once", function() {
			var hasCalled = 0;
			emitter.once("test/once/1", function() {
				hasCalled += 1;
			});

			emitter.emit("test/once/1", "test");
			emitter.emit("test/once/1", "test");

			assert.equal(hasCalled, 1, "Callback called once");
		});
	});


	describe("#listeners()", function() {
		it("should return empty arrays for topics without listeners", function() {
			var list = emitter.listeners("test/listeners/1");
			assert.isArray(list, "return is a list");
			assert.lengthOf(list, 0, "list is empty");
		});

		it("should return array of all listeners for a topic", function() {
			var topic = "test/listners/2";
			emitter
				.on(topic, noop)
				.on(topic, noop)
				.on(topic, noop)

			var list = emitter.listeners(topic);
			assert.isArray(list, "return is a list");
			assert.lengthOf(list, 3, "list contains all the listeners");
		});

		it("should return empty array when listeners are cleared", function() {
			var topic = "test/listners/3";
			emitter
				.on(topic, noop)
				.on(topic, noop)
				.on(topic, noop)

			emitter.removeAllListeners(topic);

			var list = emitter.listeners(topic);
			assert.isArray(list, "return is a list");
			assert.lengthOf(list, 0, "list is empty");
		});
	});

	describe("#onadd()", function() {
		it("should be called on new topics", function(done) {
			emitter.onadd = function() {
				done();
				emitter.onadd = noop;
			}
			emitter.on("test/add/1", noop);
		});

		it("should only be called once per topic", function(done) {
			emitter.onadd = function() {
				done();
			}
			emitter.on("test/add/2", noop);
			emitter.on("test/add/2", noop);
		});

		it("should be called with the topic string", function() {
			emitter.onadd = function(topic) {
				assert.equal(topic, "test/add/+", "argument is topic");
				emitter.onadd = noop;
			}
			emitter.on("test/add/+number", noop);
		});
	});

	describe("#onremove()", function() {
		it("should be called when all listeners are removed", function(done) {
			emitter.onremove = function() {
				done();
			}
			emitter
				.on("test/remove/1", noop)
				.removeListener("test/remove/1", noop);
		});
	});
});
