EventEmitter = require('events').EventEmitter
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

  handleCommand: (id, cmd) =>
    if cmd.length > 0
      op = cmd[0]
      params = cmd.slice 1
      switch op
        when ':return'
          id = params[params.length - 1]
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
          id = params[params.length - 1]
          msg = params[0]
          if @callbacks[id]
            @callbacks[id] undefined, undefined, msg
        when ':warning'
          id = params[params.length - 1]
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

  metavariables: (width, callback) ->
    @prepareCommand [':metavariables', width], callback

  proofSearch: (line, word, callback) ->
    @prepareCommand [':proof-search', line, word, []], callback

module.exports = IdrisModel
