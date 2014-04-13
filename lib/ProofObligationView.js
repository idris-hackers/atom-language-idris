var View = require('atom').View
  , utils = require('./utils')

var ProofObligationView = function(params) {
  this.obligation = params.obligation

  View.apply(this, arguments)
}

utils.inherits(ProofObligationView, View)

ProofObligationView.content = function() {
  return this.pre({class: 'idris-mode inline-block'})
}


ProofObligationView.prototype.initialize = function() {
  this.text(this.obligation)
}

module.exports = ProofObligationView
