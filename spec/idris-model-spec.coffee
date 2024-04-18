{ IdrisModel } = require "../lib/idris-model"
Rx = require "rx-lite"

describe "Idris model", ->
  it "should use wsl-path to change directory when WSL integration is enabled", ->
    finished = false
    spyOn(atom.config, "get").andReturn true
    idrisModel = new IdrisModel(-> Promise.resolve("/wsl/path"))
    interpretSpy = spyOn(idrisModel, "interpret").andReturn Rx.Observable.of(null)
    runs ->
      idrisModel.changeDirectory("C:\\windows\\path").subscribe ->
        finished = true
    waitsFor (-> finished), "changeDirectory should complete", 500
    runs ->
      expect(interpretSpy).toHaveBeenCalledWith(":cd /wsl/path")

  it "should not use wsl-path to change directory when WSL integration is disabled", ->
    finished = false
    spyOn(atom.config, "get").andReturn false
    wslPathSpy = jasmine.createSpy("windowsToWsl")
    idrisModel = new IdrisModel(wslPathSpy)
    interpretSpy = spyOn(idrisModel, "interpret").andReturn Rx.Observable.of(null)
    runs ->
      idrisModel.changeDirectory("C:\\windows\\path").subscribe ->
        finished = true
    waitsFor (-> finished), "changeDirectory should complete", 500
    runs ->
      expect(interpretSpy).toHaveBeenCalledWith(":cd C:\\windows\\path")
      expect(wslPathSpy).not.toHaveBeenCalled()

  it "should use wsl-path to load file when WSL integration is enabled", ->
    finished = false
    spyOn(atom.config, "get").andReturn true
    idrisModel = new IdrisModel(-> Promise.resolve("/wsl/path"))
    prepareCommandSpy = spyOn(idrisModel, "prepareCommand").andReturn Rx.Observable.of(null)
    runs ->
      idrisModel.load("C:\\windows\\path").subscribe ->
        finished = true
    waitsFor (-> finished), "load should complete", 500
    runs ->
      expect(prepareCommandSpy).toHaveBeenCalledWith({
        type: "load-file"
        fileName: "/wsl/path"
      })

  it "should not use wsl-path to load file when WSL integration is disabled", ->
    finished = false
    spyOn(atom.config, "get").andReturn false
    wslPathSpy = jasmine.createSpy("windowsToWsl")
    idrisModel = new IdrisModel(wslPathSpy)
    prepareCommandSpy = spyOn(idrisModel, "prepareCommand").andReturn Rx.Observable.of(null)
    runs ->
      idrisModel.load("C:\\windows\\path").subscribe ->
        finished = true
    waitsFor (-> finished), "load should complete", 500
    runs ->
      expect(prepareCommandSpy).toHaveBeenCalledWith({
        type: "load-file"
        fileName: "C:\\windows\\path"
      })
      expect(wslPathSpy).not.toHaveBeenCalled()
