highlighter = require '../utils/highlighter'
dom = require '../utils/dom'

class InformationView extends HTMLElement
  initialize: (params) ->
    @classList.add 'idris-panel'
    @obligation = params.obligation
    @highlightingInfo = params.highlightingInfo
    if @highlightingInfo?
      highlighting = highlighter.highlight @obligation, @highlightingInfo
      info = highlighter.highlightToHtml highlighting
      pre = dom.createCodeElement()
      pre.appendChild info
      @appendChild pre
    else
      @text @obligation

module.exports = InformationView =
  document.registerElement 'idris-informations-view',
    prototype: InformationView.prototype
