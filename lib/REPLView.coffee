{View, TextEditorView, ScrollView} = require('atom-space-pen-views')

class REPLView extends View

  @content: ->
    @div class: "repl", =>
     @subview 'responseView', new ResponseView
     @subview 'inputView', new InputView

  initialize: (params) ->
    @callback  = params.callback

    @inputView.element.addEventListener 'keydown', (keyboardEvent) =>
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

  addCodeLine: (code) ->
    @responseView.append "> #{code}<br>"

class ResponseView extends ScrollView
  @content: ->
    @div ''

class InputView extends TextEditorView

module.exports = REPLView
