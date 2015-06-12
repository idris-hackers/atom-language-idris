fileLocation = (where) ->
  [[tag1, file], [tag2, startLine, startCol], [tag3, endLine, endCol]] = where
  if tag1 == ':filename' && tag2 == ':start' && tag3 == ':end'
    {file: file, start: [startLine - 1, startCol - 1], end: [endLine - 1 , endCol - 1]}
  else
    throw ("bad location " + where)

assoc = (key, list) ->
  try
    [car, cdr...] = list
    [k, vs...] = car
    if k == key
      vs
    else
      assoc key, cdr
  catch e
    null


decoClass = (props) ->
  decor = assoc ':decor', props
  console.log decor
  decoClass =
    switch decor[0]
      when ':function' then ' function'
      when ':bound'    then ' bound'
      when ':data'     then ' data'
      when ':metavar'  then ' metavar'
      when ':type'     then ' type'
      else ''
  console.log decoClass
  'idris-thing' + decoClass

module.exports =
  fileLocation: fileLocation
  decoClass: decoClass
