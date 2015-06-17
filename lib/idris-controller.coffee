{MessagePanelView, PlainMessageView, LineMessageView} =
  require('atom-message-panel')
ProofObligationView = require('./proof-obligation-view')
MetavariablesView = require './metavariables-view'
StatusBarView = require './statusbar-view'
{Logger} = require './Logger'

class IdrisController

  constructor: (@model) ->
    @statusbar = new StatusBarView()
    @statusbar.initialize()
    @messages = new MessagePanelView
      title: 'Idris Messages'
      closeMethod: 'hide'
    @messages.attach()
    @messages.hide()

  getCommands: ->
    'language-idris:type-of': @getTypeForWord
    'language-idris:docs-for': @getDocsForWord
    'language-idris:case-split': @doCaseSplit
    'language-idris:add-clause': @doAddClause
    'language-idris:metavariables': @showMetavariables
    'language-idris:proof-search': @doProofSearch
    'language-idris:typecheck': @typecheckFile

  isIdrisFile: (uri) ->
    uri? && uri.match? && uri.match /\.idr$/

  destroy: ->
    if @model
      Logger.logText 'Idris: Shutting down!'
      @model.stop()
    @statusbar.destroy()

  getWordUnderCursor: (editorView) ->
    editor = editorView.model
    cursorPosition = editor.getLastCursor().getCurrentWordBufferRange()
    editor.getTextInBufferRange cursorPosition

  dispatchCommand: (packg, command) ->
    textEditorElement = atom.views.getView(atom.workspace.getActiveTextEditor())
    atom.commands.dispatch(textEditorElement, "#{packg}:#{command}")

  dispatchIdrisCommand: (command) ->
    @dispatchCommand 'language-idris', command

  typecheckFile: ({target}) =>
    # the file needs to be saved for typechecking
    @dispatchCommand "core", "save"
    uri = target.model.getURI()
    @model.load uri, (err, message, progress) =>
      if err
        @statusbar.setStatus 'Idris: ' + err.message
        @messages.show()
        @messages.clear()
        @messages.setTitle '<i class="icon-bug"></i> Idris Errors', true
        for warning in err.warnings
          @messages.add new LineMessageView
            line: warning[1][0]
            character: warning[1][1]
            message: warning[3]
      else if progress
        console.log '... ' + progress
        @statusbar.setStatus 'Idris: ' + progress
      else
        @statusbar.setStatus 'Idris: ' + JSON.stringify(message)

  getDocsForWord: ({target}) =>
    @dispatchIdrisCommand 'typecheck'
    word = @getWordUnderCursor target
    @model.docsFor word, (err, type, highlightingInfo) =>
      if err
        @statusbar.setStatus 'Idris: ' + err.message
      else
        @messages.show()
        @messages.clear()
        @messages.setTitle 'Idris: Type of <tt>' + word + '</tt>', true
        @messages.add new ProofObligationView
          obligation: type
          highlightingInfo: highlightingInfo

  getTypeForWord: ({target}) =>
    @dispatchIdrisCommand 'typecheck'
    word = @getWordUnderCursor target
    @model.getType word, (err, type, highlightingInfo) =>
      if err
        @statusbar.setStatus 'Idris: ' + err.message
      else
        @messages.show()
        @messages.clear()
        @messages.setTitle 'Idris: Type of <tt>' + word + '</tt>', true
        @messages.add new ProofObligationView
          obligation: type
          highlightingInfo: highlightingInfo

  doCaseSplit: ({target}) =>
    @dispatchIdrisCommand 'typecheck'
    editor = target.model
    cursor = editor.getLastCursor()
    line = cursor.getBufferRow()
    word = @getWordUnderCursor target
    @model.caseSplit line + 1, word, (err, split) =>
      if err
        @statusbar.setStatus 'Idris: ' + err.message
      else
        lineRange = cursor.getCurrentLineBufferRange(includeNewline: true)
        editor.setTextInBufferRange lineRange, split

  doAddClause: ({target}) =>
    @dispatchIdrisCommand 'typecheck'
    editor = atom.workspace.getActiveTextEditor()
    line = editor.getLastCursor().getBufferRow()
    word = @getWordUnderCursor target
    @model.addClause line + 1, word, (err, clause) =>
      if err
        @statusbar.setStatus 'Idris: ' + err.message
      else
        editor.transact ->
          # Insert a newline and the new clause
          editor.insertNewlineBelow()
          editor.insertText clause
          # And move the cursor to the beginning of
          # the new line
          editor.moveCursorToBeginningOfLine()

  showMetavariables: ({target}) =>
    @dispatchIdrisCommand 'typecheck'
    @model.metavariables 80, (err, metavariables) =>
      if err
        @statusbar.setStatus 'Idris: ' + err.message
      else
        @messages.show()
        @messages.clear()
        @messages.setTitle 'Idris: Metavariables'
        @messages.add new MetavariablesView metavariables

  doProofSearch: ({target}) =>
    @dispatchIdrisCommand 'typecheck'
    editor = atom.workspace.getActiveTextEditor()
    line = editor.getLastCursor().getBufferRow()
    word = @getWordUnderCursor target
    @model.proofSearch line + 1, word, (err, res) =>
      if err
        @statusbar.setStatus 'Idris: ' + err.message
      else
        editor.transact ->
          # Move the cursor to the beginning of the word
          editor.moveToBeginningOfWord()
          # Because the ? in the metavariable isn't part of
          # the word, we move left once, and then select two
          # words
          editor.moveLeft()
          editor.selectToEndOfWord()
          editor.selectToEndOfWord()
          # And then replace the replacement with the guess..
          editor.insertText res

module.exports = IdrisController
