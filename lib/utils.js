var __hasProp = {}.hasOwnProperty;
var inherits = function(child, parent) {
  // from CS :(
  for (var key in parent) {
    if (__hasProp.call(parent, key)) child[key] = parent[key];
  }
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  return child;
};

/**
 * Serializes a command-object.
 */
var serialize = function serialize(obj) {
  var output = '('
  // The object could actually be a list, so make it an obj
  if (obj instanceof Array) obj = {params: obj}
  // If we are a special id-object, just give back the name of the id..
  else if (obj.id) return ':' + obj.id
  else {
    // The object was a command-obj, so add the name of the command..
    // But first we need to convert true/false into 'True'/'False'
    if (typeof(obj.op) == 'boolean')
      obj.op = obj.op ? 'True' : 'False'
    output += ':' + obj.op + ' '
  }

  output += obj.params.map(function(param) {
    switch(typeof(param)) {
      case 'number':
        // Numbers are represented as base-10 strings
        return param.toString(10)
      case 'string':
        // Strings are quoted-strings with "'s escaped with \
        return '"' + param.replace(/\"/g, '\\"') + '"'
      default:
        // Recurse if another command-obj was found
        return serialize(param)
    }
  }).join(' ')

  return output + ')'
}

/**
 * Returns a 0-padded 6-char long hexadecimal
 * for the length of the input `str`
 */
var hexLength = function(str) {
  var hex = str.length.toString(16)
  return (Array(7-hex.length).join("0")) + hex
}

/**
 * Takes a command-object and formats it for sending.
 * So it serializes it, adds a newline at the end at
 * prepends it with the length of the command.
 */
var formatObj = function(obj) {
  var msg = serialize(obj) + "\n";
  return hexLength(msg) + msg
}

module.exports = {
  inherits: inherits,
  serialize: serialize,
  hexLength: hexLength,
  formatObj: formatObj
}
