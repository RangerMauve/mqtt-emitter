/*
 mqtt-emitter by RangerMauve. Version 0.0.2
*/

var RegexEmitter = require("pattern-emitter");
var mqtt_regex = require("mqtt-regex");
var regex_on = RegexEmitter.prototype.on;
var regex_off = RegexEmitter.prototype.removeListener;

module.exports = MQTTEmitter;

function MQTTEmitter() {
	RegexEmitter.call(this);
	this._handler_map = [];
}

MQTTEmitter.prototype = Object.create(RegexEmitter.prototype);

MQTTEmitter.prototype.on = function(topic, handler) {
	var matcher = mqtt_regex(topic);
	handler._handler = _handler;

	return regex_on.call(this, matcher.regex, _handler);

	function _handler(payload) {
		var path = this.event;
		var params = matcher.exec(path);
		handler.call(this, payload, params);
	}
}

MQTTEmitter.prototype.addListener = MQTTEmitter.prototype.on;

MQTTEmitter.prototype.removeListener = function(topic, handler) {
	var _handler = hander._handler;
	return regex_off.call(this, topic, _handler);
}
