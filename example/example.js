var MQTTEmitter = require("../");

var events = new MQTTEmitter();

var topic = "user/+name/message/#path";
var messages = ["hi", "what's up?", "Hey I'm new.", "How about that weather, eh?", "I know"];
var names = ["Bob", "Angelina", "xX420xNoSc0peXx"];
var count = 10;
var delay = 200;

events.on(topic, handle_message);
say_something();

function handle_message(data, params, topic, topic_pattern) {
	var name = params.name;
	var path = params.path;
	console.log(name, "@", "/" + path.join("/"), ":", data);
}

function say_something() {
	var event = "user/" + random_from_list(names) + "/message/lobby";
	events.emit(event, random_from_list(messages));
	if (count--) setTimeout(say_something, delay);
	else events.removeListener(topic, handle_message);
}

function random_from_list(list) {
	return list[Math.floor(Math.random() * list.length)];
}
