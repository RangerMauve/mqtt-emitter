mqtt-emitter
============

This is a library for easily routing MQTT traffic in JavaScript. The API is the same as EventEmitter, but it automatically routes your topics behind the scenes. This library is based on [pattern-emitter](https://github.com/danielstjules/pattern-emitter) and [mqtt-regex](https://github.com/RangerMauve/mqtt-regex) and can be used in Node, Browserify, or as a drop in JS file for the browser.

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
If you aren't using browserify (for some crazy reason), then you can get a pre-bundled version from the build folder of the repository. The bundle is UMD compatible and supports UMD, CommonJS and creates a global called MQTTEmitter if neither of those are present.  Just dump the file in your HTML and you can use it with
``` javascript
var events = new MQTTEmitter();
```

API
---
The API is the same as EventEmitter (but also has some things from pattern-emitter) except that the `on()` method has custom functionality.
``` javascript
emitter.on(topic_pattern,callback)
```

`topic_pattern` is a MQTT topic with optional named wildcards which get parsed out. See [mqtt-regex](https://github.com/RangerMauve/mqtt-regex#how-params-work) for how the patterns work.

`callback` takes two arguments, one which is the payload of the event, and the second which is an object containing the parsed out parameters from the topic pattern.

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
