Logger = require './Logger'
sexpFormatter = require './utils/sexp-formatter'
parse = require './parse'
{EventEmitter} = require 'events'
{spawn} = require 'child_process'

class IdrisIdeMode extends EventEmitter
  process: null
  buffer: ''
  idrisBuffers: 0

  constructor: ->
    pathToIdris = atom.config.get("language-idris.pathToIdris")
    @process = spawn pathToIdris, ['--ide-mode']
    @process.on 'error', @error
    @process.on 'exit', @exited
    @process.on 'close', @exited
    @process.on 'disconnect', @exited

    @process.stdout.setEncoding('utf8').on 'data', @stdout

  send: (cmd) ->
    Logger.logOutgoingCommand cmd
    @process.stdin.write sexpFormatter.serialize(cmd)

  stop: ->
    @process?.kill()

  error: (error) ->
    e =
      if error.code == 'ENOENT'
        short: "Couldn't find idris executable"
        long: "Couldn't find idris executable at \"#{error.path}\""
      else
        short: error.code
        long: error.message

    atom.notifications.addError e.short, detail: e.long

  exited: (code, signal) ->
    short = "The idris compiler was closed or crashed"
    long =
      if signal
        "It was closed with the signal: #{signal}"
      else
        "It (probably) crashed with the error code: #{code}"
    atom.notifications.addError short, detail: long

  running: ->
    !!@process

  stdout: (data) =>
    @buffer += data
    while @buffer.length > 6
      @buffer = @buffer.trimLeft().replace /\r\n/g, "\n"
      # We have 6 chars, which is the length of the command
      len = parseInt(@buffer.substr(0, 6), 16)
      if @buffer.length >= 6 + len
        # We also have the length of the command in the buffer, so
        # let's read in the command
        cmd = @buffer.substr(6, len).trim()
        Logger.logIncomingCommand cmd
        # Remove the length + command from the buffer
        @buffer = @buffer.substr(6 + len)
        # And then we can try to parse to command..
        obj = parse.parse(cmd.trim())
        @emit 'message', obj
      else
        # We didn't have the entire command, so let's break the
        # while-loop and wait for the next data-event
        break

module.exports = IdrisIdeMode
