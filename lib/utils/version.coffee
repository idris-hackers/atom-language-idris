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

module.exports =
  parseVersion: parseVersion
  versionGreaterEq: versionGreaterEq
