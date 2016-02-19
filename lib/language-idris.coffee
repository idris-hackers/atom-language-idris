{ CompositeDisposable } = require 'atom'
url = require 'url'
IdrisPanel = undefined

module.exports =
  config:
    pathToIdris:
      title: 'Idris Location'
      type: 'string'
      default: 'idris'
      description: 'Location of the Idris executable'
    panelFontFamily:
      type: 'string'
      default: ''
      description: 'The font family to use in the various idris panels'
    panelFontSize:
      type: 'number'
      default: 13
      description: 'The font size to use in the various idris panels'
    panelFontLigatures:
      type: 'boolean'
      default: false
      description: 'Enable ligatures in the various idris panels'

  activate: ->
    subscription = atom.commands.add 'atom-text-editor[data-grammar~="idris"]', @getCommands()
    @subscriptions = new CompositeDisposable
    @subscriptions.add subscription

    atom.workspace.addOpener (uriToOpen, options) =>
      try
        { protocol, host, pathname } = url.parse uriToOpen
      catch error
        return

      return unless protocol is 'idris:'

      if !IdrisPanel
        { IdrisPanel } = require './views/panel-view'

      @loadController()
      new IdrisPanel @controller, host

  loadController: ->
    if !@controller
      IdrisController = require './idris-controller'
      @controller = new IdrisController

  runCommand: (command) ->
    that = this

    (args) ->
      if !that.controller
        that.loadController()

      if command == 'stopCompiler'
        that.controller.stopCompiler()
      else
        that.controller.runCommand(that.controller[command])(args)

  getCommands: () ->
    'language-idris:type-of': @runCommand 'getTypeForWord'
    'language-idris:docs-for': @runCommand 'getDocsForWord'
    'language-idris:case-split': @runCommand 'doCaseSplit'
    'language-idris:add-clause': @runCommand 'doAddClause'
    'language-idris:make-with': @runCommand 'doMakeWith'
    'language-idris:make-lemma': @runCommand 'doMakeLemma'
    'language-idris:make-case': @runCommand 'doMakeCase'
    'language-idris:holes': @runCommand 'showHoles'
    'language-idris:proof-search': @runCommand 'doProofSearch'
    'language-idris:typecheck': @runCommand 'typecheckFile'
    'language-idris:print-definition': @runCommand 'printDefinition'
    'language-idris:stop-compiler': @runCommand 'stopCompiler'
    'language-idris:open-repl': @runCommand 'openREPL'
    'language-idris:apropos': @runCommand 'apropos'

  deactivate: ->
    @subscriptions.dispose()
    this.controller.destroy()
