var MQTTEmitter = require('../')

var events = new MQTTEmitter()

var topic = 'user/+name/message/#path'
var messages = ['hi', "what's up?", "Hey I'm new.", 'How about that weather, eh?', 'I know']
var names = ['Bob', 'Angelina', 'xX420xNoSc0peXx']
var count = 10
var delay = 200

events.on(topic, handleMessage)
saySomething()

function handleMessage (data, params, topic, topicPattern) {
  var name = params.name
  var path = params.path
  console.log(name, '@', '/' + path.join('/'), ':', data)
}

function saySomething () {
  var event = 'user/' + randomFromList(names) + '/message/lobby'
  events.emit(event, randomFromList(messages))
  if (count--) setTimeout(saySomething, delay)
  else events.removeListener(topic, handleMessage)
}

function randomFromList (list) {
  return list[Math.floor(Math.random() * list.length)]
}
