IdrisController = require './idris-controller'
IdrisModel = require './idris-model'
{CompositeDisposable} = require 'atom'
exec = require('child_process').exec

module.exports =
  config:
    pathToIdris:
      type: 'string'
      default: 'idris'

  activate: ->
    @model = new IdrisModel()
    @controller =
      new IdrisController @model

    subscription = atom.commands.add 'atom-text-editor[data-grammar~="idris"]', @controller.getCommands()
    @subscriptions = new CompositeDisposable
    @subscriptions.add subscription

  showWarnings: (error) ->
    warningNoIdris = 'Please put idris into your path or set the right path in the settings of this package.'
    atom.notifications.addWarning warningNoIdris


  deactivate: ->
    @subscriptions.dispose()
    this.controller.destroy()
