highlightInfoListToOb = (list) ->
  obj = {}
  for x in list
    key = x[0].slice(1)
    value = x[1]
    obj[key] = value
  obj

decorToClasses = (decor) ->
  switch decor
    when ':type' then ['storage', 'type']
    when ':function' then ['entity', 'name', 'function']
    when ':data' then ['constant']
    when ':keyword' then ['keyword']
    when ':bound' then ['support', 'function']
    else []

highlightWord = (word, info) ->
  classes: decorToClasses(info.info.decor).concat 'idris'
  word: word

highlight = (code, highlightingInfo) ->
  highlighted = highlightingInfo
    .map ([start, length, info]) ->
      start: start
      length: length
      info: highlightInfoListToOb info
    .filter (i) ->
      i.info.decor?
    .reduce (([position, text], info) ->
      newPosition = info.start + info.length
      unhighlightedText =
        classes: []
        word: code.slice(position, info.start)
      highlightedWord = highlightWord code.slice(info.start, newPosition), info
      newText = text.concat unhighlightedText, highlightedWord

      [newPosition, newText]
    ), [0, []]

  [position, text] = highlighted
  rest =
    classes: []
    word: code.slice(position)
  higlightedWords = text.concat rest
  higlightedWords.filter (higlightedWord) ->
    higlightedWord.word != ''

highlightToString = (highlights) ->
  highlights
    .map ({classes, word}) ->
      if classes.length == 0
        word
      else
        "<span class=\"#{classes.join(' ')}\">#{word}</span>"
    .join ''


module.exports =
  highlight: highlight
  highlightToString: highlightToString
