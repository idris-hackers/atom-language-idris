View = require('atom-space-pen-views').View
utils = require('./utils')
highlighter = require './utils/highlighter'

class ProofObligationView extends View
  constructor: (params) ->
    @obligation = params.obligation
    @highlightingInfo = params.highlightingInfo
    super arguments

  @content: ->
    @pre class: 'idris-mode inline-block'

  initialize: ->
    if @highlightingInfo?
      text = highlighter.highlight @obligation, @highlightingInfo
      @html text
    else
      @text @obligation

module.exports = ProofObligationView
