/*
 mqtt-emitter by RangerMauve. Version 0.0.2
*/

var mqtt_regex = require("mqtt-regex");
var MQTTStore = require("mqtt-store");

module.exports = MQTTEmitter;

/**
 * Creates a new MQTTEmitter instance
 */
function MQTTEmitter() {
	this._listeners = new MQTTStore();
	this._regexes = [];
}

// Inherit the PatternEmitter methods and stuff
MQTTEmitter.prototype = Object.create({
	addListener: addListener,
	on: addListener,
	once: once,
	removeListener: removeListener,
	removeAllListeners: removeAllListeners,
	listeners: listeners,
	emit: emit,
	onadd: onadd,
	onremove: onremove,
});

/**
 * Listen for MQTT messages that match a given pattern.
 * @see {@link https://github.com/RangerMauve/mqtt-regex|mqtt-regex}
 * @param  {String}      topic   MQTT topic pattern with optional placeholders
 * @param  {Function}    handler Callback which takes the MQTT payload and topic params
 * @return {MQTTEmitter}         Returns self for use in chaining
 */
function addListener(topic, handler) {
	var matcher = mqtt_regex(topic);
	var topic_string = matcher.topic;
	var is_new = false;

	var listeners = this._listeners.get(topic_string);
	if (!listeners) {
		listeners = this._listeners.set(topic_string, []);
		is_new = true;
	}

	listeners.push({
		fn: handler,
		params: matcher.exec
	});

	if (is_new) this.onadd(topic_string);

	return this;
}

/**
 * Adds a one time listener for the event
 * @param  {String}      topic   Topic pattern to listen on
 * @param  {Function}    handler Function to call the next time this topic appears
 * @return {MQTTEmitter}         Returns self for use in chaining
 */
function once(topic, handler) {
	var self = this;
	once_handler.handler = handler;
	this.on(topic, once_handler);

	return this;

	function once_handler(data, params) {
		handler.call(self, data, params);
		self.removeListener(topic, once_handler);
	}
}

/**
 * Removes an existing listener
 * @param  {String}      topic   Topic pattern to unsubscribe from
 * @param  {Function}    handler Handler that was used originally
 * @return {MQTTEmitter}         Returns self for use in chaining
 */
function removeListener(topic, handler) {
	var matcher = mqtt_regex(topic);
	var topic_string = matcher.topic;
	var listeners = this._listeners.get(topic_string);

	if (!listeners || !listeners.length) return this;

	var has_filtered = false;
	filtered_listeners = listeners.filter(function (listener) {
		if (has_filtered) return true;

		var matches = (listener.fn === handler);
		if (!matches) return true;

		has_filtered = true;
		return false;
	});

	if (!filtered_listeners.length) this.onremove(topic_string);

	if (has_filtered)
		this._listeners.set(topic_string, filtered_listeners);

	return this;
}

/**
 * Removes all listeners for this type of topic.
 * @param  {String}      topic Topic pattern to unsubscribe from
 * @return {MQTTEmitter}       Returns self for use in chaining
 */
function removeAllListeners(topic) {
	this._listeners = new MQTTStore();

	return this;
}

/**
 * Returns an array of listeners that match this topic
 * @param  {String} topic The topic pattern to get listeners for
 * @return {Array}        Array of handler functions
 */
function listeners(topic) {
	var matcher = mqtt_regex(topic);
	var topic_string = matcher.topic;

	return (this._listeners.get(topic_string) || []).map(function (listener) {
		return listener.fn;
	});
}

/**
 * Process a new MQTT event and dispatch it to relevant listeners
 * @param  {String}  topic   The raw MQTT topic string recieved from a connection
 * @param  {Any}     payload This is the payload from the MQTT topic event
 * @return {Boolean}         Returns true if there were any listeners called for this topic
 */
function emit(topic, payload) {
	var matcher = mqtt_regex(topic);
	var topic_string = matcher.topic;
	var matching = this._listeners.match(topic_string);
	if (!matching.length) return false;

	matching.forEach(function (listeners) {
		listeners.forEach(function (listener) {
			var params = listener.params(topic);
			listener.fn(payload, params, topic);
		});
	});

	return true;
}

/**
 * Hook for reacting to new MQTT topics
 * @param {String} topic MQTT topic that is being subscribed to
 */
function onadd(topic) {
	// Detect when new topics are added, maybe
	// Can be useful for auto-subscribing on actual MQTT connection
}

/**
 * Hook for reacting to removed MQTT topics
 * @param  {String} topic MQTT topiuc that is being unsubscribed from
 */
function onremove(topic) {
	// Detect when topics are no longer listened to here
	// Can be useful for auto-unsubscribing on an actual MQTT connection
}
