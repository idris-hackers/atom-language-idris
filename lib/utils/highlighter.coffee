# Applies the highlighting we get from the idris compiler to our source code.
# http://docs.idris-lang.org/en/latest/reference/ide-protocol.html#output-highlighting

CycleDOM = require '@cycle/dom'

highlightInfoListToOb = (list) ->
  obj = { }
  for x in list
    key = x[0].slice(1)
    value = x[1]
    obj[key] = value
  obj

# Use the right CSS classes, so that we can use the
# syntax highlighting built into atom.
decorToClasses = (decor) ->
  switch decor
    when ':type' then ['storage', 'type']
    when ':function' then ['entity', 'name', 'function']
    when ':data' then ['constant']
    when ':keyword' then ['keyword']
    when ':bound' then ['support', 'function']
    else []

highlightWord = (word, info) ->
  type = info.info.type || ""
  doc = info.info['doc-overview'] || ""

  description =
    if info.info.type?
      "#{type}\n\n#{doc}".trim()
    else
      ""

  classes: decorToClasses(info.info.decor).concat 'idris'
  word: word
  description: description

# Build highlighting information that we can then pass to one
# of our serializers.
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

# Applies the highlighting and returns the result as an html-string.
highlightToString = (highlights) ->
  highlights
    .map ({ classes, word }) ->
      if classes.length == 0
        word
      else
        "<span class=\"#{classes.join(' ')}\">#{word}</span>"
    .join ''

# Applies the highlighting and returns the result as a DOM-objects.
highlightToHtml = (highlights) ->
  spans = highlights
    .map ({ classes, word }) ->
      if classes.length == 0
        document.createTextNode word
      else
        span = document.createElement 'span'
        classes.forEach (c) ->
          span.classList.add c
        span.textContent = word
        span
  container = document.createElement 'span'
  spans.forEach (span) ->
    container.appendChild span
  container

highlightToCycle = (highlights) ->
  highlights.map ({ classes, word, description }) ->
    if classes.length == 0
      word
    else
      CycleDOM.h 'span', { className: classes.join(' '), title: description }, word

module.exports =
  highlight: highlight
  highlightToString: highlightToString
  highlightToHtml: highlightToHtml
  highlightToCycle: highlightToCycle
