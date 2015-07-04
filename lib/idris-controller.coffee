{MessagePanelView, PlainMessageView, LineMessageView} =
  require 'atom-message-panel'
ProofObligationView = require './views/proof-obligation-view'
HolesView = require './views/holes-view'
StatusIndicator = require './views/status-indicator-view'
Logger = require './Logger'
IdrisModel = require './idris-model'

class IdrisController

  constructor: ->
    @messages = new MessagePanelView
      title: 'Idris Messages'
      closeMethod: 'hide'
    @messages.attach()
    @messages.hide()
    @model = new IdrisModel()

  getCommands: ->
    'language-idris:type-of': @getTypeForWord
    'language-idris:docs-for': @getDocsForWord
    'language-idris:case-split': @doCaseSplit
    'language-idris:add-clause': @doAddClause
    'language-idris:holes': @showHoles
    'language-idris:proof-search': @doProofSearch
    'language-idris:typecheck': @typecheckFile

  isIdrisFile: (uri) ->
    uri?.match? /\.idr$/

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
    target.model.save()
    uri = target.model.getURI()

    successHandler = ({responseType, msg}) =>
      @statusIndicator.setStatusLoaded()

    @model
      .load uri
      .filter ({responseType}) -> responseType == 'return'
      .subscribe successHandler, @displayErrors

  getDocsForWord: ({target}) =>
    word = @getWordUnderCursor target

    successHandler = ({responseType, msg}) =>
      [type, highlightingInfo] = msg
      @messages.show()
      @messages.clear()
      @messages.setTitle 'Idris: Type of <tt>' + word + '</tt>', true
      @messages.add new ProofObligationView
        obligation: type
        highlightingInfo: highlightingInfo

    @model
      .docsFor word
      .subscribe successHandler, @displayErrors

  getTypeForWord: ({target}) =>
    word = @getWordUnderCursor target

    successHandler = ({responseType, msg}) =>
      [type, highlightingInfo] = msg
      @messages.show()
      @messages.clear()
      @messages.setTitle 'Idris: Type of <tt>' + word + '</tt>', true
      @messages.add new ProofObligationView
        obligation: type
        highlightingInfo: highlightingInfo

    @model
      .getType word
      .subscribe successHandler, @displayErrors

  doCaseSplit: ({target}) =>
    editor = target.model
    uri = editor.getURI()
    cursor = editor.getLastCursor()
    line = cursor.getBufferRow()
    word = @getWordUnderCursor target

    successHandler = ({responseType, msg}) ->
      [split] = msg
      lineRange = cursor.getCurrentLineBufferRange(includeNewline: true)
      editor.setTextInBufferRange lineRange, split

    @model
      .load uri
      .filter ({responseType}) -> responseType == 'return'
      .flatMap => @model.caseSplit line + 1, word
      .subscribe successHandler, @displayErrors

  doAddClause: ({target}) =>
    editor = target.model
    uri = editor.getURI()
    line = editor.getLastCursor().getBufferRow()
    word = @getWordUnderCursor target

    successHandler = ({responseType, msg}) ->
      [clause] = msg
      editor.transact ->
        # Insert a newline and the new clause
        editor.insertNewlineBelow()
        editor.insertText clause
        # And move the cursor to the beginning of
        # the new line
        editor.moveToBeginningOfLine()

    @model
      .load uri
      .filter ({responseType}) -> responseType == 'return'
      .flatMap => @model.addClause line + 1, word
      .subscribe successHandler, @displayErrors

  showHoles: ({target}) =>
    successHandler = ({responseType, msg}) =>
      [holes] = msg
      @messages.show()
      @messages.clear()
      @messages.setTitle 'Idris: Holes'
      holesView = new HolesView
      holesView.initialize holes
      @messages.add holesView

    @model
      .holes 80
      .subscribe successHandler, @displayErrors

  doProofSearch: ({target}) =>
    editor = target.model
    uri = editor.getURI()
    line = editor.getLastCursor().getBufferRow()
    word = @getWordUnderCursor target

    successHandler = ({responseType, msg}) ->
      [res] = msg
      editor.transact ->
        # Move the cursor to the beginning of the word
        editor.moveToBeginningOfWord()
        # Because the ? in the Holes isn't part of
        # the word, we move left once, and then select two
        # words
        editor.moveLeft()
        editor.selectToEndOfWord()
        editor.selectToEndOfWord()
        # And then replace the replacement with the guess..
        editor.insertText res

    @model
      .load uri
      .filter ({responseType}) -> responseType == 'return'
      .flatMap => @model.proofSearch line + 1, word
      .subscribe successHandler, @displayErrors

  displayErrors: (err) =>
    @messages.show()
    @messages.clear()
    @messages.setTitle '<i class="icon-bug"></i> Idris Errors', true

    @messages.add new PlainMessageView
      message: err.message
      className: 'idris-error'

    for warning in err.warnings
      @messages.add new LineMessageView
        line: warning[1][0]
        character: warning[1][1]
        message: warning[3]

  attachStatusIndicator: (statusBar) ->
    @statusIndicator = new StatusIndicator
    @statusIndicator.initialize()
    statusBar.addLeftTile
      item: @statusIndicator


module.exports = IdrisController
