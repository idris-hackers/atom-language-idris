REPLView = require './repl-view'

class IdrisPanel
  constructor: (@controller, @panel) ->

  getTitle: ->
    switch @panel
      when "repl" then "Idris Repl"
      else "Idris ?"

  getViewClass: ->
    switch @panel
      when "repl" then REPLView

  getURI: ->
    switch @panel
      when "repl" then "idris://repl"

module.exports =
  IdrisPanel: IdrisPanel
