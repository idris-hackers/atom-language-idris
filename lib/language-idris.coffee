StatusBarView = require './statusbar-view'
IdrisController = require './idris-controller'
IdrisModel = require './idris-model'
{CompositeDisposable} = require 'atom'
utils = require './utils'
exec = require('child_process').exec

module.exports =
  config:
    pathToIdris:
      type: 'string'
      default: 'idris'

  activate: ->
    pathToIdris = atom.config.get "language-idris.pathToIdris"

    # check for the verion of idris. this has two purposes:
    # 1. see if there is an idris set in your path or the package config
    # 2. see if the version of idris is new enough for the ide mode
    #    and switch to ideslave for older ones
    process = exec "#{pathToIdris} --version --nobanner"
    process.stdout.on 'data', @startIdrisProcesses
    process.stderr.on 'data', @showWarnings
    process.on 'error', @showWarnings

  showWarnings: (error) ->
    warningNoIdris = 'Please put idris into your path or set the right path in the settings of this package.'
    atom.notifications.addWarning warningNoIdris

  startIdrisProcesses: (v) =>
    version = utils.parseVersion v
    @statusbar = new StatusBarView()
    @model = new IdrisModel(version)
    @controller =
      new IdrisController @statusbar, @model

    @subscriptions = new CompositeDisposable
    @subscriptions.add atom.commands.add 'atom-text-editor[data-grammar~="idris"]', @controller.getCommands()

  consumeStatusBar: ->
    console.log 'STATUSBAR'

  deactivate: ->
    @subscriptions.dispose()
    this.controller.destroy()
