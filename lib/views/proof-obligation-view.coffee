{View} = require 'atom-space-pen-views'
highlighter = require '../utils/highlighter'

class ProofObligationView extends View
  initialize: (params) ->
    @obligation = params.obligation
    @highlightingInfo = params.highlightingInfo
    if @highlightingInfo?
      highlighting = highlighter.highlight @obligation, @highlightingInfo
      text = highlighter.highlightToString highlighting
      @html text
    else
      @text @obligation

  @content: ->
    @pre class: 'idris-mode block'

module.exports = ProofObligationView
