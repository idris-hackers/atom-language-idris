fs = require 'fs'
sexpFormatter = require './utils/sexp-formatter'

class Logger
  logFile: "log.log"
  loggerActive: false

  logText: (str) ->
    if @loggerActive
      fs.appendFile @logFile, str, (err) ->
        if err
          throw err

  formatCommand: (cmd) ->
    sexpFormatter.serialize(cmd)

  logIncomingCommand: (str) ->
    @logText "< #{str}\n"

  logOutgoingCommand: (cmd) ->
    str = @formatCommand cmd
    @logText "> #{str}"

exports.Logger = new Logger
