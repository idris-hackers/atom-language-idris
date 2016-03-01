IdrisController = require './idris-controller'
{ CompositeDisposable } = require 'atom'
url = require 'url'
{ IdrisPanel } = require './views/panel-view'

module.exports =
  config:
    pathToIdris:
      title: 'Idris Location'
      type: 'string'
      default: 'idris'
      description: 'Location of the Idris executable (e.g. /usr/local/bin/idris)'
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
    @controller = new IdrisController

    subscription = atom.commands.add 'atom-text-editor[data-grammar~="idris"]', @controller.getCommands()
    @subscriptions = new CompositeDisposable
    @subscriptions.add subscription

    atom.workspace.addOpener (uriToOpen, options) =>
      try
        { protocol, host, pathname } = url.parse uriToOpen
      catch error
        return

      return unless protocol is 'idris:'

      new IdrisPanel @controller, host

  deactivate: ->
    @subscriptions.dispose()
    this.controller.destroy()

  provide: ->
    console.log "Provider"
    @controller.provideReplCompletions()
