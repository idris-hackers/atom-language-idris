StatusBarView = require './statusbar-view'
IdrisController = require './idris-controller'
IdrisModel = require './idris-model'
{CompositeDisposable} = require 'atom'

module.exports =
  config:
    pathToIdris:
      type: 'string'
      default: 'idris'

  activate: ->
    @statusbar = new StatusBarView()
    @model = new IdrisModel()
    @controller =
      new IdrisController @statusbar, @model


    @subscriptions = new CompositeDisposable
    @subscriptions.add atom.commands.add 'atom-workspace', @controller.getCommands()

  consumeStatusBar: ->
    console.log 'STATUSBAR'

  deactivate: ->
    @subscriptions.dispose()
    this.controller.destroy()
