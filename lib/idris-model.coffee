{EventEmitter} = require 'events'
IdrisIdeMode = require './idris-ide-mode'
{Logger} = require './Logger'

class IdrisModel extends EventEmitter
  requestId: 0
  ideModeRef: null
  callbacks: {}
  warnings: {}

  ideMode: ->
    if !@ideModeRef
      @ideModeRef = new IdrisIdeMode
      @ideModeRef.on 'message', @handleCommand
    @ideModeRef

  stop: ->
    @ideModeRef?.stop()

  handleCommand: (cmd) =>
    if cmd.length > 0
      [op, params..., id] = cmd
      switch op
        when ':return'
          ret = params[0]
          if @callbacks[id]
            if ret[0] == ':ok'
              @callbacks[id] undefined, ret.slice(1)...
            else
              @callbacks[id]
                message: ret[1]
                warnings: @warnings[id]
            delete @callbacks[id]
            delete @warnings[id]
        when ':write-string'
          msg = params[0]
          if @callbacks[id]
            @callbacks[id] undefined, undefined, msg
        when ':warning'
          warning = params[0]
          @warnings[id].push warning
        when ':set-prompt'
          # Ignore
        else
          console.log op, params

  getUID: -> ++@requestId

  prepareCommand: (cmd, callback) ->
    id = @getUID()
    @callbacks[id] = callback
    @warnings[id] = []
    @ideMode().send [cmd, id]

  load: (uri, callback) ->
    @prepareCommand [':load-file', uri], callback

  docsFor: (word, callback) ->
    @prepareCommand [':docs-for', word], callback

  getType: (word, callback) ->
    @prepareCommand [':type-of', word], callback

  caseSplit: (line, word, callback) ->
    @prepareCommand [':case-split', line, word], callback

  addClause: (line, word, callback) ->
    @prepareCommand [':add-clause', line, word], callback

  holes: (width, callback) ->
    @prepareCommand [':metavariables', width], callback

  proofSearch: (line, word, callback) ->
    @prepareCommand [':proof-search', line, word, []], callback

module.exports = IdrisModel
