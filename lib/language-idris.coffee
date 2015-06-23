IdrisController = require './idris-controller'
{CompositeDisposable} = require 'atom'

module.exports =
  config:
    pathToIdris:
      type: 'string'
      default: 'idris'

  activate: ->
    @controller = new IdrisController

    subscription = atom.commands.add 'atom-text-editor[data-grammar~="idris"]', @controller.getCommands()
    @subscriptions = new CompositeDisposable
    @subscriptions.add subscription

  deactivate: ->
    @subscriptions.dispose()
    this.controller.destroy()

  consumeStatusBar: (statusBar) ->
    @controller.attachStatusIndicator statusBar
