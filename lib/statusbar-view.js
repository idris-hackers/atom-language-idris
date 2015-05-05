var View = require('atom-space-pen-views').View
  , utils = require('./utils')

var StatusBarView = function() {
  View.apply(this, arguments)
}

utils.inherits(StatusBarView, View)

StatusBarView.content = function() {
  return this.div({class: 'idris-mode inline-block'})
}


StatusBarView.prototype.initialize = function() {
  if(atom.workspaceView.statusBar) {
    this.attach()
  } else {
    atom.packages.once('activated', function() {
      setTimeout(function() {
        this.attach()
      }.bind(this))
    }.bind(this))
  }
}

StatusBarView.prototype.attach = function() {
  atom.workspaceView.statusBar.appendLeft(this)
}

StatusBarView.prototype.destroy = function() {
  this.destroy()
}

StatusBarView.prototype.setStatus = function(text) {
  return this.show().text(text)
}

StatusBarView.prototype.attached = function() {
  this.hide()
}

module.exports = StatusBarView
