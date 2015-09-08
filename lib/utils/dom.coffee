joinHtmlElements = (containerElem, elems) ->
  div = document.createElement containerElem
  elems.forEach (elem) ->
    div.appendChild elem
  div

createCodeElement = ->
  pre = document.createElement 'pre'
  fontFamily = atom.config.get 'language-idris.panelFontFamily'
  if fontFamily != ''
    pre.style.fontFamily = fontFamily
  fontSize = atom.config.get 'language-idris.panelFontSize'
  pre.style.fontSize = "#{fontSize}px"
  enableLigatures = atom.config.get 'language-idris.panelFontLigatures'
  if enableLigatures
    pre.style.webkitFontFeatureSettings = '"liga"'
  pre

module.exports =
  joinHtmlElements: joinHtmlElements
  createCodeElement: createCodeElement
