{View} = require 'atom-space-pen-views'

class StatusBarView extends View
  @content: ->
    @div class: 'idris-mode inline-block'

  initialize: ->
    global.dd = this
    atom.packages.onDidActivateInitialPackages =>
      setTimeout =>
        @attach()
    this

  attach: ->
    document.querySelector('status-bar').addLeftTile item: this

  destroy: ->
    @destroy()

  setStatus: (text) ->
    @show().text text

  show: ->
    @css
      display: 'inline-block'

  hide: ->
    super()

module.exports = StatusBarView
