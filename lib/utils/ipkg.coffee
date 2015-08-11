path = require 'path'
fs = require 'fs'
Rx = require 'rx-lite'

findIpkgFile = (project) ->
  directory = project.getDirectories()[0].path
  readDir = Rx.Observable.fromNodeCallback fs.readdir

  r = readDir directory
  r
    .map (files) ->
      files
        .map (file) ->
          file: file
          path: path.join directory, file
          ext: path.extname file
        .filter (file) ->
          file.ext == '.ipkg'

parseIpkgFile = (ipkgFile) ->
  []

readIpkgFile = (ipkgFile) ->
  readFile = Rx.Observable.fromNodeCallback fs.readFile
  file = readFile ipkgFile.path,
    encoding: 'utf8'
  file.map parseIpkgFile

compilerOptions = (project) ->
  ipkgFilesObserver = findIpkgFile project
  ipkgFilesObserver.flatMap (ipkgFiles) ->
    if ipkgFiles.length
      readIpkgFile ipkgFiles[0]
    else
      Rx.Observable.return []

module.exports =
  findIpkgFile: findIpkgFile
  readIpkgFile: readIpkgFile
  compilerOptions: compilerOptions
