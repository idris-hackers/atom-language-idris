IdrisController = require './idris-controller'
{CompositeDisposable} = require 'atom'

module.exports =
  config:
    pathToIdris:
      type: 'string'
      default: 'idris'
      description: 'Path to the idris executable'

  activate: ->
    @controller = new IdrisController

    subscription = atom.commands.add 'atom-text-editor[data-grammar~="idris"]', @controller.getCommands()
    @subscriptions = new CompositeDisposable
    @subscriptions.add subscription

  deactivate: ->
    @subscriptions.dispose()
    this.controller.destroy()

  consumeStatusBar: (statusBar) ->
    subscription = atom.workspace.observeActivePaneItem (paneItem) =>
      if paneItem
        grammar = paneItem.getGrammar().name
        if grammar == 'Idris'
          @controller?.attachStatusIndicator statusBar
        else
          @controller?.detachStatusIndicator statusBar
    @subscriptions?.add? subscription
