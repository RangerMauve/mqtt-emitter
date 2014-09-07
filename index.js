/*
 mqtt-emitter by RangerMauve. Version 0.0.0
*/

var RegexEmitter = require("pattern-emitter");
var mqtt_regex = require("mqtt-regex");
var regex_on = RegexEmitter.prototype.on;
var regex_off = RegexEmitter.prototype.removeListener;

exports.MQTTEmitter = MQTTEmitter;

function MQTTEmitter() {
	RegexEmitter.call(this);
	this._handler_map = [];
}

MQTTEmitter.prototype = Object.create(RegexEmitter.prototype);

MQTTEmitter.prototype.on = function(topic, handler) {
	var matcher = mqtt_regex(topic);
	this._handler_map.push([_handler, handler, topic]);
	return regex_on.call(this, matcher.regex, _handler);

	function _handler(payload) {
		var path = this.event;
		var params = matcher.exec(path);
		handler.call(this, payload, params);
	}
}

MQTTEmitter.prototype.addListener = MQTTEmitter.prototype.on;

MQTTEmitter.prototype.removeListener = function(topic, handler) {
	var handler_index = -1;
	if (!this._handler_map.some(function(pair, index) {
		if (pair[1] == handler) return (handler_index = index);
	})) return;
	var _handler = this._handler_map.splice(handler_index, 1)[0][0];
	return regex_off.call(this, topic, _handler);
}
