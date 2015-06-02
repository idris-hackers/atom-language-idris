highlightInfoListToOb = (list) ->
  obj = {}
  for x in list
    key = x[0].slice(1)
    value = x[1]
    obj[key] = value
  obj

decorToClasses = (decor) ->
  switch decor
    when ':type' then 'storage type'
    when ':function' then 'entity name function'
    when ':data' then 'constant'
    when ':keyword' then 'keyword'
    when ':bound' then 'support function'
    else ''

highlightWord = (word, info) ->
  "<span class=\"#{decorToClasses info.info.decor} idris\">#{word}</span>"

highlight = (code, highlightingInfo) ->
  highlighted = highlightingInfo
    .map (i) ->
      start: i[0]
      length: i[1]
      info: highlightInfoListToOb i[2]
    .filter (i) ->
      i.info.decor?
    .reduce (([position, text], info) ->
      newPosition = info.start + info.length
      unhighlightedText = code.slice(position, info.start)
      highlightedWord = highlightWord code.slice(info.start, newPosition), info
      newText = text + unhighlightedText + highlightedWord

      [newPosition, newText]
    ), [0, '']
  [position, text] = highlighted
  text + code.slice(position)

module.exports =
  highlight: highlight
