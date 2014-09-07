var MQTTEmitter = require("../");

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
