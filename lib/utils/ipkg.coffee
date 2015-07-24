path = require 'path'
fs = require 'fs'
Rx = require 'rx-lite'

readIpkgFile = (project) ->
  directory = project.getDirectories()[0].path
  dir = Rx.Observable.fromNodeCallback fs.readdir

  success = (files) ->
    console.log "success"

  r = dir directory
  r
    .flatMap (files) ->
      ipkgs = files
        .map (file) ->
          file: file
          ext: path.extname file
        .filter (file) ->
          file.ext == '.ipkg'
      if ipkgs.lenght > 0
        Rx.Observable.return ipkgs[0]
      else
        Rx.Observable.throw new Error 'no ipkg files'

    .subscribe success, ((a) -> console.log(a))

module.exports =
  readIpkgFile: readIpkgFile
