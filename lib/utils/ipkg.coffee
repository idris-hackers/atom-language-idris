path = require 'path'
fs = require 'fs'
Rx = require 'rx-lite'

optionsRegexp = /opts\s*=\s*\"([^\"]*)\"/
sourcedirRegexp = /sourcedir\s*=\s*([a-zA-Z/0-9.]+)/
pkgsRegexp = /pkgs\s*=\s*([a-zA-Z/0-9., ]+)/

# Find all ipkg-files in a directory and returns
# an observable of an array of files
findIpkgFile = (project) ->
  directory = project.getDirectories()[0].path
  readDir = Rx.Observable.fromNodeCallback fs.readdir

  r = readDir directory
  r
    .map (files) ->
      files
        .map (file) ->
          file: file
          directory: directory
          path: path.join directory, file
          ext: path.extname file
        .filter (file) ->
          file.ext == '.ipkg'

parseIpkgFile = (fileInfo) ->
  (fileContents) ->
    optionsMatches = fileContents.match optionsRegexp
    sourcedirMatches = fileContents.match sourcedirRegexp
    pkgsMatches = fileContents.match pkgsRegexp

    compilerOptions = { }
    if optionsMatches
      compilerOptions.options = optionsMatches[1]

    compilerOptions.pkgs =
      if pkgsMatches
        pkgsMatches[1].split(',').map (s) -> s.trim()
      else
        []

    compilerOptions.src =
      if sourcedirMatches
        path.join fileInfo.directory, sourcedirMatches[1]
      else
        fileInfo.directory

    compilerOptions

readIpkgFile = (ipkgFile) ->
  readFile = Rx.Observable.fromNodeCallback fs.readFile
  readFile ipkgFile.path,
    encoding: 'utf8'

# Find the ipkg file in the top directory of the project and return
# the compiler options in it.
compilerOptions = (project) ->
  ipkgFilesObserver = findIpkgFile project
  ipkgFilesObserver.flatMap (ipkgFiles) ->
    if ipkgFiles.length
      ipkgFile = ipkgFiles[0]
      readIpkgFile(ipkgFile)
        .map parseIpkgFile(ipkgFile)
    else
      Rx.Observable.return { }

module.exports =
  findIpkgFile: findIpkgFile
  readIpkgFile: readIpkgFile
  compilerOptions: compilerOptions
