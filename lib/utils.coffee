exec = require('child_process').exec

parseVersion = (vers) ->
  vers.trim().replace('-', '').split('.').map (n) ->
    parseInt n, 10

versionGreaterEq = (a, b) ->

  padArray = (length, ary) ->
    if ary.length < length
      ary.concat (0 for _ in [0...length-ary.length])
    else
      ary

  zip2 = (a, b) ->
    for i in [0...a.length]
      [a[i], b[i]]

  maxLength = Math.max a.length, b.length
  a = padArray maxLength, a
  b = padArray maxLength, b
  zip2(a, b)
    .map ([a, b]) -> a >= b
    .reduce ((acc, xs) -> if !acc then acc else xs), true

execPromise = (command, args) ->
  promise = new Promise (resolve, reject) ->
    process = exec command, args
    process.stdout.on 'data', resolve
    process.stderr.on 'data', reject
    process.on 'error', reject
    process.on 'close', reject

isString = (s) ->
  typeof(s) == 'string' || s instanceof String

isSymbol = (s) ->
  isString(s) and s.length > 0 and s[0] == ':'

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
  parseVersion: parseVersion
  versionGreaterEq: versionGreaterEq
  execPromise: execPromise
  serialize: serialize
  hexLength: hexLength
  formatSexp: formatSexp
