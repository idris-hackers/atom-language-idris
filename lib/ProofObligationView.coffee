View = require('atom-space-pen-views').View
highlighter = require './utils/highlighter'

class ProofObligationView extends View
  initialize: (params) ->
    @obligation = params.obligation
    @highlightingInfo = params.highlightingInfo
    if @highlightingInfo?
      text = highlighter.highlight @obligation, @highlightingInfo
      @html text
    else
      @text @obligation

  @content: ->
    @pre class: 'idris-mode block'

module.exports = ProofObligationView
