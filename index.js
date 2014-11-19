/*
 mqtt-emitter by RangerMauve. Version 0.0.2
*/

var PatternEmitter = require("pattern-emitter");
var mqtt_regex = require("mqtt-regex");
var regex_on = PatternEmitter.prototype.on;
var regex_off = PatternEmitter.prototype.removeListener;

module.exports = MQTTEmitter;

/**
 * Creates a new MQTTEmitter instance
 */
function MQTTEmitter() {
	PatternEmitter.call(this);
	this._handler_map = [];
}

// Inherit the PatternEmitter methods and stuff
MQTTEmitter.prototype = new PatternEmitter();

/**
 * Listen for MQTT messages that match a given pattern.
 * @see {@link https://github.com/RangerMauve/mqtt-regex|mqtt-regex}
 * @param  {String}      topic   MQTT topic pattern with optional placeholders
 * @param  {Function}    handler Callback which takes the MQTT payload and topic params
 * @return {MQTTEmitter}         Returns self for use in chaining
 */
MQTTEmitter.prototype.on = function(topic, handler) {
	// Create the matcher with mqtt-regex
	var matcher = mqtt_regex(topic);

	// Save a reference to the wrapper handler under the provided handler
	handler._handler = _handler;

	// Use default pattern-emitter#on method to listen on events
	regex_on.call(this, matcher.regex, _handler);

	// Provide a hook for reacting to new topics
	this.onadd(matcher.topic);

	return this;

	// Hanlder that gets passed to pattern-emitter
	function _handler(payload) {
		// Fetch params from topic
		var path = this.event;
		var params = matcher.exec(path);

		// Call original handler with the payload and the params
		handler.call(this, payload, params);
	}
}

/**
 * Alias for MQTTEmitter#on
 */
MQTTEmitter.prototype.addListener = MQTTEmitter.prototype.on;

/**
 * Removes an existing listener
 * @param  {String}      topic   Topic pattern to unsubscribe from
 * @param  {Function}    handler Handler that was used originally
 * @return {MQTTEmitter}         Returns self for use in chaining
 */
MQTTEmitter.prototype.removeListener = function(topic, handler) {
	// Hack because pattern-emitter would call this function with random values
	// TODO: Understand this better
	if ((typeof handler) !== "function")
		return this;
	var _handler = handler._handler;

	var matcher = mqtt_regex(topic);

	regex_off.call(this, matcher.regex, _handler);

	this.onremove(matcher.topic);

	return this;
}

/**
 * Hook for reacting to new MQTT topics
 * @param {String} topic MQTT topic that is being subscribed to
 */
MQTTEmitter.prototype.onadd = function(topic) {
	// Detect when new topics are added, maybe
	// Can be useful for auto-subscribing on actual MQTT connection
}

/**
 * Hook for reacting to removed MQTT topics
 * @param  {String} topic MQTT topiuc that is being unsubscribed from
 */
MQTTEmitter.prototype.onremove = function(topic) {
	// Detect when topics are no longer listened to here
	// Can be useful for auto-unsubscribing on an actual MQTT connection
}
