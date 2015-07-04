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

}

/**
 * Removes all listeners for this type of topic.
 * @param  {String}      topic Topic pattern to unsubscribe from
 * @return {MQTTEmitter}       Returns self for use in chaining
 */
function removeAllListeners(topic) {

}

/**
 * Returns an array of listeners that match this topic
 * @param  {String} topic The topic pattern to get listeners for
 * @return {Array}        Array of handler functions
 */
function listeners(topic) {

}

/**
 * Process a new MQTT event and dispatch it to relevant listeners
 * @param  {String}  topic   The raw MQTT topic string recieved from a connection
 * @param  {Any}     payload This is the payload from the MQTT topic event
 * @return {Boolean}         Returns true if there were any listeners called for this topic
 */
function emit(topic, payload) {

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
