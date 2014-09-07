!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.MQTTEmitter=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"mqtt-regex":7,"pattern-emitter":8}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],5:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],6:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":5,"_process":4,"inherits":3}],7:[function(require,module,exports){
/*
	The MIT License (MIT)

	Copyright (c) 2014 RangerMauve

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

module.exports = parse;

/**
 * Parses topic string with parameters
 * @param topic Topic string with optional params
 @ @returns {Object} Compiles a regex for matching topics, getParams for getting params, and exec for doing both
 */
function parse(topic) {
	var tokens = tokenize(topic).map(process_token);
	var result = {
		regex: make_regex(tokens),
		getParams: make_pram_getter(tokens),
	};
	result.exec = exec.bind(result);
	return result;
};

/**
 * Matches regex against topic, returns params if successful
 * @param topic Topic to match
 */
function exec(topic) {
	var regex = this.regex;
	var getParams = this.getParams;
	var match = regex.exec(topic);
	if (match) return getParams(match);
}

// Split the topic into consumable tokens
function tokenize(topic) {
	return topic.split("/");
}

// Processes token and determines if it's a `single`, `multi` or `raw` token
// Each token contains the type, an optional parameter name, and a piece of the regex
// The piece can have a different syntax for when it is last
function process_token(token, index, tokens) {
	var last = (index === (tokens.length - 1));
	if (token[0] === "+") return process_single(token, last);
	else if (token[0] === "#") return process_multi(token, last);
	else return process_raw(token, last);
}

// Processes a token for single paths (prefixed with a +)
function process_single(token) {
	var name = token.slice(1);
	return {
		type: "single",
		name: name,
		piece: "([\\d\\w]+/)",
		last: "([\\d\\w]+/?)"
	};
}

// Processes a token for multiple paths (prefixed with a #)
function process_multi(token, last) {
	if (!last) throw new Error("# wildcard must be at the end of the pattern");
	var name = token.slice(1);
	return {
		type: "multi",
		name: name,
		piece: "((?:[\\d\\w]+/)*)",
		last: "((?:[\\d\\w]+/?)*)"
	}
}

// Processes a raw string for the path, no special logic is expected
function process_raw(token) {
	return {
		type: "raw",
		piece: token + "/",
		last: token + "/?"
	};
}

// Generates the RegExp object from the tokens
function make_regex(tokens) {
	var str = tokens.reduce(function(res, token, index) {
			var is_last = (index == (tokens.length - 1));
			var before_multi = (index === (tokens.length - 2)) && (last(tokens).type == "multi");
			return res + ((is_last || before_multi) ? token.last : token.piece);
		},
		"");
	return new RegExp("^" + str + "$");
}

// Generates the function for getting the params object from the regex results
function make_pram_getter(tokens) {
	return function(results) {
		// Get only the capturing tokens
		var capture_tokens = remove_raw(tokens);
		var res = {};

		// If the regex didn't actually match, just return an empty object
		if (!results) return res;

		// Remove the first item and iterate through the capture groups
		results.slice(1).forEach(function(capture, index) {
			// Retreive the token description for the capture group
			var token = capture_tokens[index];
			var param = capture;
			// If the token doesn't have a name, continue to next group
			if (!token.name) return;

			// If the token is `multi`, split the capture along `/`, remove empty items
			if (token.type === "multi") {
				param = capture.split("/");
				if (!last(param))
					param = remove_last(param);
				// Otherwise, remove any trailing `/`
			} else if (last(capture) === "/")
				param = remove_last(capture);
			// Set the param on the result object
			res[token.name] = param;
		});
		return res;
	}
}

// Removes any tokens of type `raw`
function remove_raw(tokens) {
	return tokens.filter(function(token) {
		return (token.type !== "raw");
	})
}

// Gets the last item or character
function last(items) {
	return items[items.length - 1];
}

// Returns everything but the last item or character
function remove_last(items) {
	return items.slice(0, items.length - 1);
}

},{}],8:[function(require,module,exports){
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var domain;

/**
 * Creates a new PatternEmitter, which extends EventEmitter. In addition to
 * EventEmitter's prototype, it allows listeners to register to events matching
 * a RegExp.
 *
 * @constructor
 * @extends EventEmitter
 *
 * @property {*} event The type of the last emitted event
 */
function PatternEmitter() {
  EventEmitter.call(this);

  this.event = '';
  this._regexesCount = 0;

  this._events = this._events || {};
  this._patternEvents = this._patternEvents || {};
  this._regexes = this._regexes || {};
}

util.inherits(PatternEmitter, EventEmitter);
module.exports = PatternEmitter;

// Store overridden EventEmitter methods as private

PatternEmitter.prototype._emit = PatternEmitter.prototype.emit;

PatternEmitter.prototype._addListener = PatternEmitter.prototype.addListener;

PatternEmitter.prototype._removeListener = PatternEmitter.prototype.removeListener;

PatternEmitter.prototype._removeAllListeners = PatternEmitter.prototype.removeAllListeners;

/**
 * Emits an event to all listeners for the specified type. In addition, if type
 * is a string, emits the event to all listeners whose patterns match. Returns
 * true if any listeners existed, false otherwise.
 *
 * @param {*}    type   The type of event to emit
 * @param {...*} [args] Arguments to apply when invoking the listeners
 *
 * @returns {PatternEmitter} This instance
 * @throws  {Error}          If an error occurs and no error listener exists
 */
PatternEmitter.prototype.emit = function(type) {
  var listeners, result, error;

  // Optimize for the case where no pattern listeners exit
  if (!this._regexesCount) {
    return this._emit.apply(this, arguments);
  }

  this.event = type;

  listeners = this._events[type];
  this._events[type] = this._getMatching(type);

  try {
    result = this._emit.apply(this, arguments);
  } catch (err) {
    error = err;
  }

  this._events[type] = listeners;

  if (error) throw error;

  return result;
};

/**
 * Given a RegExp event type, stores the regular expression and registers the
 * listener to any events matching the pattern. Otherwise, it behaves exactly
 * as EventEmitter. As with EventEmitter.prototype.addListener, it emits a
 * 'newListener' event on success. Returns an instance of itself.
 *
 * @param {*}        type     The event type to match, including a RegExp to
 *                            match using a pattern
 * @param {function} listener The listener to invoke
 *
 * @returns {PatternEmitter} This instance
 * @throws  {TypeError}      If listener is not a function
 */
PatternEmitter.prototype.addListener = function(type, listener) {
  if (!(type instanceof RegExp)) {
    return this._addListener(type, listener);
  }

  var pattern = String(type);
  this.event = 'newListener';
  this._regexesCount++;

  PatternEmitter._apply(this, this._addListener, pattern, [pattern, listener]);

  if (!this._regexes[pattern]) {
    this._regexes[pattern] = type;
  }

  return this;
};

/**
 * An alias for addListener.
 *
 * @see addListener
 */
PatternEmitter.prototype.on = PatternEmitter.prototype.addListener;

/**
 * Removes the listener from the specified event type. If given an instance of
 * RegExp, it matches any RegExp object with the same expression. Emits a
 * 'removeListener' event on success. Returns an instance of itself.
 *
 * @param {*}        type     The event type, including a RegExp, to remove
 * @param {function} listener The listener to remove
 *
 * @returns {PatternEmitter} This instance
 * @throws  {TypeError}      If listener is not a function
 */
PatternEmitter.prototype.removeListener = function(type, listener) {
  if (!(type instanceof RegExp)) {
    return this._removeListener(type, listener);
  }

  var pattern = String(type);
  this.event = 'removeListener';
  this._regexesCount--;

  PatternEmitter._apply(this, this.removeListener, pattern,
    [pattern, listener]);

  if (!this._patternEvents[pattern] || !this._patternEvents[pattern].length) {
    delete this._patternEvents[pattern];
  }

  if (!this._patternEvents[pattern] && this._regexes[pattern]) {
    delete this._regexes[pattern];
  }

  return this;
};

/**
 * Removes all listeners for the specified event type. If given an instance of
 * RegExp, it matches the RegExp object with the same expression. Emits a
 * 'removeListener' event for each removed listener. Returns an instance of
 * itself.
 *
 * @param {*} type The event type, including a RegExp, to remove
 *
 * @returns {PatternEmitter} This instance
 */
PatternEmitter.prototype.removeAllListeners = function(type) {
  if (!(type instanceof RegExp)) {
    return this._removeAllListeners(type);
  }

  var pattern = String(type);
  this.event = 'removeListener';

  PatternEmitter._apply(this, this.removeAllListeners, pattern, [pattern]);

  delete this._patternEvents[pattern];

  if (this._regexes[pattern]) {
    delete this._regexes[pattern];
  }

  return this;
};

/**
 * Returns an array of pattern listeners for the specified RegExp.
 *
 * @param {RegExp} pattern A RegExp
 *
 * @returns {function[]} An array of listeners
 * @throws  {TypeError}  If pattern is not a RegExp
 */
PatternEmitter.prototype.patternListeners = function(pattern) {
  if (!(pattern instanceof RegExp)) {
    throw TypeError('pattern must be an instance of RegExp');
  }

  return PatternEmitter._apply(this, this.listeners, pattern, [pattern]);
};

/**
 * Returns an array of listeners for the supplied event type, and whose
 * patterns match the event if given a string.
 *
 * @param {*} type The type of event
 *
 * @returns {function[]} An array of listeners
 */
PatternEmitter.prototype.matchingListeners = function(type) {
  var matching = this._getMatching(type);

  if (!matching) {
    matching = [];
  } else if (!(matching instanceof Array)) {
    matching = [matching];
  }

  return matching;
};

/**
 * Returns the number of listeners for a given event. An alias for
 * EventEmitter.listenerCount.
 *
 * @see EventEmitter.listenerCount
 *
 * @param {PatternEmitter} emitter The emitter for which to count listeners
 * @param {*}              type    The event type
 *
 * @returns {int} The number of listeners
 */
PatternEmitter.listenerCount = function(emitter, type) {
  return EventEmitter.listenerCount(emitter, type);
};

/**
 * Returns the number of listeners registered to the emitter for the specified
 * pattern.
 *
 * @param {PatternEmitter} emitter The emitter for which to count listeners
 * @param {RegExp}         pattern A RegExp
 *
 * @returns {int}       The number of listeners
 * @throws  {TypeError} If pattern is not a string
 */
PatternEmitter.patternListenerCount = function(emitter, pattern) {
  if (!(pattern instanceof RegExp)) {
    throw TypeError('pattern must be an instance of RegExp');
  }

  return PatternEmitter._apply(emitter, EventEmitter.listenerCount, pattern,
    [emitter, pattern]);
};

/**
 * Returns the number of listeners and pattern listeners registered to the
 * emitter for the event type or a matching pattern.
 *
 * @param {PatternEmitter} emitter The emitter for which to count listeners
 * @param {*}              type    The event type
 *
 * @returns {int} The number of listeners
 */
PatternEmitter.matchingListenerCount = function(emitter, type) {
  return emitter.matchingListeners(type).length;
};

/**
 * Returns all listeners for the given type, and if type is a string, matching
 * pattern listeners.
 *
 * @param {*} type The event type
 *
 * @returns {function|function[]} All relevant listeners
 */
PatternEmitter.prototype._getMatching = function(type) {
  var matching, listeners;

  // Get any regular listeners
  matching = this._events[type];

  if (typeof type !== 'string') {
    return matching;
  }

  // Retrieve all pattern listeners
  for (var pattern in this._regexes) {
    var regex = this._regexes[pattern];
    if (!regex || !(regex instanceof RegExp)) {
      continue;
    }

    if (!regex.test(type)) continue;

    if (!matching) {
      matching = this._patternEvents[pattern];
    } else {
      listeners = this._patternEvents[pattern];
      if (!(listeners instanceof Array)) {
        listeners = [listeners];
      }

      if (!(matching instanceof Array)) {
        matching = [matching];
      }
      matching = matching.concat(listeners);
    }
  }

  return matching;
};

/**
 * A helper function to invoke an EventEmitter action in the context of
 * pattern listeners. This allows us to re-use EventEmitter's logic and API.
 *
 * @param {PatternEmitter} emitter The emitter on which to invoke the function
 * @param {function}       fn      The function to invoke
 * @param {pattern}        pattern The string pattern to which this applies
 * @param {*[]}            args    An array of arguments to apply to fn
 *
 * @returns {*} The function's return value
 */
PatternEmitter._apply = function(emitter, fn, pattern, args) {
  // Swap patternEvents and events before running, allowing us to piggyback
  // off EventEmitter
  var typeListeners, error, result;

  typeListeners = emitter._events[pattern];
  emitter._events[pattern] = emitter._patternEvents[pattern];

  try {
    result = fn.apply(emitter, args);
  } catch (err) {
    error = err;
  }

  emitter._patternEvents[pattern] = emitter._events[pattern];
  emitter._events[pattern] = typeListeners;

  if (error) throw error;

  return result;
};

},{"events":2,"util":6}]},{},[1])(1)
});