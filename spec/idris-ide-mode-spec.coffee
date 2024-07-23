{ IdrisIdeMode } = require "../lib/idris-ide-mode"
child_process = require "child_process"
{ EventEmitter } = require "events"

describe "Idris IDE mode", ->
  it "should not crash after ending the Idris process", ->
    mockProcess = new EventEmitter()
    mockProcess.stdout = new EventEmitter()
    mockProcess.stdout.setEncoding = -> mockProcess.stdout
    mockProcess.kill = ->
      # Idris prints this when it's killed
      # .emit calls the listeners synchronously
      mockProcess.stdout.emit('data', 'Alas the file is done, aborting')
    mockedSpawn = spyOn(child_process, 'spawn').andReturn mockProcess
    ideMode = new IdrisIdeMode()
    ideMode.start({ pkgs: [] })
    ideMode.stop()
