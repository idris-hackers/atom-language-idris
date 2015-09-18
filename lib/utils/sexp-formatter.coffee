isString = (s) ->
  typeof(s) == 'string' || s instanceof String

isSymbol = (s) ->
  isString(s) and s.length > 0 and s[0] == ':' and s.indexOf(' ') == -1

isBoolean = (s) ->
  typeof(s) == 'boolean' || s instanceof Boolean

# Takes a command-object and formats it for sending.
# So it serializes it, adds a newline at the end at
# prepends it with the length of the command.
serialize = (obj) ->
  msg = formatSexp(obj) + '\n'
  hexLength(msg) + msg

# Returns a 0-padded 6-char long hexadecimal
# for the length of the input `str`
hexLength = (str) ->
  hex = str.length.toString(16)
  Array(7 - (hex.length)).join('0') + hex

# Serializes a command-object.
formatSexp = (sexp) ->
  if sexp instanceof Array
    '(' + sexp.map(formatSexp).join(' ') + ')'
  else if isSymbol sexp
    sexp
  else if isString sexp
    '"' + sexp + '"'
  else if isBoolean sexp
    if sexp
      ':True'
    else
      ':False'
  else
    sexp

module.exports =
  serialize: serialize
  hexLength: hexLength
  formatSexp: formatSexp
