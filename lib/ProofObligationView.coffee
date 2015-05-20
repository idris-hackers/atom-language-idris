View = require('atom-space-pen-views').View
utils = require('./utils')

class ProofObligationView extends View
  constructor: (params) ->
    @obligation = params.obligation
    super arguments

  @content: ->
    @pre class: 'idris-mode inline-block'

  initialize: ->
    @text @obligation

module.exports = ProofObligationView
