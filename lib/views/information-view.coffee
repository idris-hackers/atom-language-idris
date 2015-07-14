highlighter = require '../utils/highlighter'

class InformationView extends HTMLElement
  initialize: (params) ->
    @obligation = params.obligation
    @highlightingInfo = params.highlightingInfo
    if @highlightingInfo?
      highlighting = highlighter.highlight @obligation, @highlightingInfo
      info = highlighter.highlightToHtml highlighting
      pre = document.createElement 'pre'
      pre.appendChild info
      @appendChild pre
    else
      @text @obligation

  @content: ->
    @pre class: 'idris-mode block'

module.exports = InformationView =
  document.registerElement('idris-informations-view', {prototype: InformationView.prototype})
