{View, ScrollView} = require('atom-space-pen-views')

class REPLView extends View

  @content: ->
    miniEditor = document.createElement('atom-text-editor')

    @div class: "repl", =>
      @subview 'responseView', new ResponseView
      @subview 'inputView', miniEditor

  initialize: (params) ->
    @callback  = params.callback

    @inputView.addEventListener 'keydown', (keyboardEvent) =>
      key = keyboardEvent.which
      shift = keyboardEvent.shiftKey
      if key == 13 and shift
        @sendInput @getInput()
      else if key == 8
        @backspace()

  getInput: ->
    @inputView.model.getText()

  setInput: (code) ->
    @inputView.model.setText code

  backspace: ->
    @inputView.model.backspace()

  sendInput: (code) ->
    @callback code

  addInputLine: (input) ->
    @responseView.append "< #{input}<br>"

  addCodeLine: (code) ->
    @responseView.append "> #{code}<br>"

class ResponseView extends ScrollView
  @content: ->
    @div ''

module.exports = REPLView
