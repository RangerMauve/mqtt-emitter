/*
 mqtt-emitter by RangerMauve. Version 0.0.2
*/

var mqtt_regex = require("mqtt-regex");

module.exports = MQTTEmitter;

/**
 * Creates a new MQTTEmitter instance
 */
function MQTTEmitter() {
	this._listeners = {};
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
	// Create the matcher with mqtt-regex
	var matcher = mqtt_regex(topic);

	var topic_string = matcher.topic;

	var listeners = this._listeners[topic_string];

	var is_new = !listeners;

	if (is_new) {
		listeners = this._listeners[topic_string] = [];
		this._regexes.push({
			regex: matcher.regex,
			topic: topic_string
		});
	}

	listeners.push({
		handler: handler,
		getParams: matcher.getParams,
		topic: topic
	});

	if (is_new)
		this.onadd(topic_string);

	return this;
}

/**
 * Adds a one time listener for the event
 * @param  {String}      topic   Topic pattern to listen on
 * @param  {Function}    handler Function to call the next time this topic appears
 * @return {MQTTEmitter}         Returns self for use in chaining
 */
function once(topic, handler) {
	once_handler.handler = handler;
	this.on(topic, once_handler);

	return this;

	function once_handler(data, params) {
		handler.call(this, data, params);
		this.removeListener(topic, once_handler);
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

	var listeners = this._listeners[topic_string];

	if (!listeners)
		return this;

	var has_filtered = false;

	var filtered = listeners.filter(function(listener) {
		if (has_filtered) return true;

		var current_handler = listener.handler;

		var matches = (current_handler === handler) || (current_handler.handler === handler);

		if (!matches) return true;

		has_filtered = true;
		return false;
	});

	this._listeners[topic_string] = filtered;

	if (!filtered.length) {
		this._listeners[topic_string] = undefined;
		this._regexes.filter(function(regex) {
			return (regex.topic !== topic_string);
		})
		this.onremove(topic_string);
	}

	return this;
}

/**
 * Removes all listeners for this type of topic.
 * @param  {String}      topic Topic pattern to unsubscribe from
 * @return {MQTTEmitter}       Returns self for use in chaining
 */
function removeAllListeners(topic) {
	var matcher = mqtt_regex(topic);

	var topic_string = matcher.topic;

	var listeners = this._listeners[topic_string];

	if (!listeners)
		return this;

	this._listeners = undefined;
	this._regexes.filter(function(regex) {
		return (regex.topic !== topic_string);
	});
	this.onremove(topic_string);

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

	var listeners = this._listeners[topic_string] || [];

	return listeners.map(function(listener) {
		var handler = listener.handler;
		var sub_handler = handler.handler;
		return sub_handler || handler;
	});
}

/**
 * Process a new MQTT event and dispatch it to relevant listeners
 * @param  {String}  topic   The raw MQTT topic string recieved from a connection
 * @param  {Any}     payload This is the payload from the MQTT topic event
 * @return {Boolean}         Returns true if there were any listeners called for this topic
 */
function emit(topic, payload) {
	var _listeners = this._listeners;
	var has_matched = false;

	this._regexes.forEach(process_regex);

	return has_matched;

	function process_regex(regex) {
		var matches = topic.match(regex.regex);
		if (!matches) return;
		has_matched = true;
		var topic_string = regex.topic;
		var listeners = _listeners[topic_string] || [];
		listeners.forEach(handle_listener.bind(null, matches));
	}

	function handle_listener(matches, listener) {
		var params = listener.getParams(matches);
		listener.handler(payload, params, topic, listener.topic);
	}
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
