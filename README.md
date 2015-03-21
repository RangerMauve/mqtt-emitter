mqtt-emitter
============

This is a library for easily routing MQTT traffic in JavaScript. The API is the same as EventEmitter, but it automatically routes your topics behind the scenes. The parsing of topic patterns is done by [mqtt-regex](https://github.com/RangerMauve/mqtt-regex). This library can be used in Node, Browserify, or as a drop in JS file for the browser.

A goal of this library is to leave the actual MQTT transport up to the user so that they can use whatever MQTT connection they want for the actual transport, and just relay all incoming messages to this library for routing. Take a look at [MQTT.js](https://github.com/adamvr/MQTT.js) for node and [Mows](https://github.com/mcollina/mows) for the browser.

Example
-------
Here's an example of how you can use the library to handle traffic from a hypothetical chat based on MQTT.
``` javascript
var MQTTEmitter = require("mqtt-emitter");

var events = new MQTTEmitter();

events.on("user/+name/message/#path", function(data, params) {
	var name = params.name;
	var path = params.path;
	console.log(name, "@", "/" + path.join("/"), ":", data);
});

var messages = ["hi", "what's up?", "Hey I'm new.", "How about that weather, eh?", "I know"];
var names = ["Bob", "Angelina", "xX420xNoSc0peXx"];
var count = 10;

function say_something() {
	var event = "user/" + random_from_list(names) + "/message/lobby";
	events.emit(event, random_from_list(messages));
	if (count--) setTimeout(say_something, 1000);
}

say_something();

function random_from_list(list) {
	return list[Math.floor(Math.random() * list.length)];
}
```

Installing & Usage
------------------
In node or browserify install with
  $ npm install --save mqtt-emitter

And then use it with
``` javascript
var MQTTEmitter = require("mqtt-emitter");
var events = new MQTTEmitter();
```
If you aren't using [Browserify](http://browserify.org/) (for some crazy reason), then you can build a bundle with `npm run build` or `npm run build-min`. The bundle is UMD compatible and supports UMD, CommonJS and creates a global called MQTTEmitter if neither of those are present.  Just dump the file in your HTML and you can use it with

``` javascript
var events = new MQTTEmitter();
```

API
---
The API is the same as [EventEmitter](https://nodejs.org/api/events.html) except that  `on()`, and `emit()` have custom functionality.
``` javascript
emitter.on(topic_pattern,callback)
```

`topic_pattern` is a MQTT topic with optional named wildcards which get parsed out. See [mqtt-regex](https://github.com/RangerMauve/mqtt-regex#how-params-work) for how the patterns work.

`callback` takes four arguments:
 - `payload` : The payload that was passed in with `emit()`
 - `params` : The parameters parsed out using the topic pattern from the topic. See [mqtt-regex](https://github.com/RangerMauve/mqtt-regex#how-params-work) for details
 - `topic` : The topic that was emitted with `emit()`
 - `topic_pattern` : The topic pattern that was used when this listener was registered

There are also hooks that you can listen for new and removed topic listeners.

``` javascript
// Override the default behavior with a custom callback for subscribing to topics
emitter.onadd = function (topic) {
	mqtt.subscribe("topic");
}
emitter.onremove = function (topic) {
	mqtt.unsubscribe("topic");
}
```

*Note:* Topic patterns are converted into their regular MQTT counterparts so `foo/+boar/#` is the same as `foo/+baz/#`. They both turn into `foo/+/#`

*Note:* Because of the nature of this library, the `newListener` and `removeListener` events aren't supported. Use the `onadd()` and `onremove()` hooks instead.
