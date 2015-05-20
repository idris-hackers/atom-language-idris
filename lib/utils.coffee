# Serializes a command-object.
serialize = (obj) ->
  output = '('
  # The object could actually be a list, so make it an obj
  if obj instanceof Array
    obj = params: obj
  else if obj.id
    return ':' + obj.id
  else
    # The object was a command-obj, so add the name of the command..
    # But first we need to convert true/false into 'True'/'False'
    if typeof obj.op == 'boolean'
      obj.op = if obj.op then 'True' else 'False'
    output += ':' + obj.op + ' '
  output += obj.params.map((param) ->
    switch typeof param
      when 'number'
        # Numbers are represented as base-10 strings
        return param.toString(10)
      when 'string'
        # Strings are quoted-strings with "'s escaped with \
        return '"' + param.replace(/\"/g, '\"') + '"'
      else
        # Recurse if another command-obj was found
        return serialize(param)
    return
  ).join(' ')
  output + ')'

# Returns a 0-padded 6-char long hexadecimal
# for the length of the input `str`
hexLength = (str) ->
  hex = str.length.toString(16)
  Array(7 - (hex.length)).join('0') + hex

# Takes a command-object and formats it for sending.
# So it serializes it, adds a newline at the end at
# prepends it with the length of the command.
formatObj = (obj) ->
  msg = serialize(obj) + '\n'
  hexLength(msg) + msg

module.exports =
  serialize: serialize
  hexLength: hexLength
  formatObj: formatObj
