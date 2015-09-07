joinHtmlElements = (containerElem, elems) ->
  div = document.createElement containerElem
  elems.forEach (elem) ->
    div.appendChild elem
  div

module.exports =
  joinHtmlElements: joinHtmlElements
