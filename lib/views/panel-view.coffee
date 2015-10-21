REPLView = require './repl-view'
AproposView = require './apropos-view'

class IdrisPanel
  constructor: (@controller, @panel) ->

  getTitle: ->
    switch @panel
      when "repl" then "Idris: REPL"
      when "apropos" then "Idris: Apropos"
      else "Idris ?"

  getViewClass: ->
    switch @panel
      when "repl" then REPLView
      when "apropos" then AproposView

  getURI: ->
    switch @panel
      when "repl" then "idris://repl"
      when "apropos" then "idris://apropos"

module.exports =
  IdrisPanel: IdrisPanel
