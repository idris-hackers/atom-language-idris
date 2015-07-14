IdrisController = require './idris-controller'
{CompositeDisposable} = require 'atom'

module.exports =
  active: false
  statusbar: null

  config:
    pathToIdris:
      type: 'string'
      default: 'idris'
      description: 'Path to the idris executable'

  activate: ->
    @disposables = new CompositeDisposable

    @active = @initIdris()
    if not @isActive()
      @disposables.add myself=atom.workspace.onDidOpen (event) =>
        item = event.item
        @active = @initIdris()
        if @isActive()
          myself.dispose()

  initIdris: () ->
    if @isActive()
      true
    else
      idrisFileOpened = atom.workspace.getTextEditors().some @isIdrisFile
      if idrisFileOpened
        @controller = new IdrisController @statusbar
        if @statusbar
          @controller.attachStatusIndicator @statusbar
        subscription = atom.commands.add 'atom-text-editor[data-grammar~="idris"]', @controller.getCommands()
        @subscriptions = new CompositeDisposable
        @subscriptions.add subscription
        true
      else
        false

  isActive: ->
    @active

  isIdrisFile: (editor) ->
    editor.getGrammar?()?.scopeName == 'source.idris'

  deactivate: ->
    @subscriptions.dispose()
    this.controller.destroy()

  consumeStatusBar: (statusBar) ->
    @statusbar = statusbar
    @controller?.attachStatusIndicator statusBar
