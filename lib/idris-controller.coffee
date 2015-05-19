MessagePanelView = require('atom-message-panel').MessagePanelView
PlainMessageView = require('atom-message-panel').PlainMessageView
LineMessageView = require('atom-message-panel').LineMessageView
ProofObligationView = require('./ProofObligationView')

class IdrisController
  idrisBuffers: 0
  localChanges: undefined

  constructor: (@statusbar, @model) ->
    @idrisBuffers = 0

    atom.workspace.getTextEditors().forEach (editor) =>
      uri = editor.getURI()
      if @isIdrisFile(uri)
        console.log editor
        @idrisFileOpened editor

    @statusbar.initialize()
    @messages = new MessagePanelView
      title: 'Idris Messages'
      closeMethod: 'hide'
    @messages.attach()
    @messages.hide()

    atom.workspace.observeActivePaneItem @paneChanged

    if activeItem = atom.workspace.getActivePaneItem()
      if activeItem.isModified()
        @idrisFileChanged activeItem
    return

  getCommands: ->
    'language-idris:type-of': @getTypeForWord
    'language-idris:docs-for': @getDocsForWord
    'language-idris:case-split': @doCaseSplit
    'language-idris:add-clause': @doAddClause
    'language-idris:proof-search': @doProofSearch

  isIdrisFile: (uri) ->
    if uri? && uri.match?
      uri.match /\.idr$/
    else
      false

  idrisFileOpened: (editor) ->
    @idrisBuffers += 1
    if !@model.running()
      console.log 'Starting Idris IDESlave'
      @model.start()
    editor.buffer.onDidDestroy @idrisFileClosed.bind(this, editor)
    editor.buffer.onDidSave @idrisFileSaved.bind(this, editor)
    editor.buffer.onDidChange @idrisFileChanged.bind(this, editor)

  idrisFileSaved: (editor) ->
    @messages.clear()
    @messages.hide()
    @localChanges = false
    if @isIdrisFile(editor.getUri())
      @loadFile editor.getUri()
    return

  idrisFileChanged: (editor) ->
    @localChanges = editor.isModified()
    if @localChanges
      @statusbar.setStatus 'Idris: local modifications'
    else if @isIdrisFile(editor.getUri())
      @loadFile editor.getUri()
    return

  idrisFileClosed: (editor) ->
    @idrisBuffers -= 1
    if @idrisBuffers == 0
      console.log 'Shut down Idris IDESlave'
      @model.stop()
    return

  paneChanged: =>
    @messages.clear()
    @messages.hide()
    editor = atom.workspace.getActiveTextEditor()
    if !editor
      return
    uri = editor.getPath()
    if @isIdrisFile(uri)
      @statusbar.show()
      @loadFile uri
    else
      @statusbar.hide()
    return

  destroy: ->
    if @idrisModel
      console.log 'Idris: Shutting down!'
      @model.stop()
    @statusbar.destroy()
    return

  getWordUnderCursor: ->
    editor = atom.workspace.getActiveEditor()
    cursorPosition = editor.getCursor(0).getCurrentWordBufferRange()
    editor.getTextInBufferRange cursorPosition

  loadFile: (uri) ->
    console.log 'Loading ' + uri
    @messages.clear()
    @model.load uri, ((err, message, progress) ->
      if err
        @statusbar.setStatus 'Idris: ' + err.message
        @messages.show()
        @messages.clear()
        @messages.setTitle '<i class="icon-bug"></i> Idris Errors', true
        i = 0
        while i < err.warnings.length
          warning = err.warnings[i]
          @messages.add new LineMessageView(
            line: warning[1]
            character: warning[2]
            message: warning[3])
          i++
      else if progress
        console.log '... ' + progress
        @statusbar.setStatus 'Idris: ' + progress
      else
        @statusbar.setStatus 'Idris: ' + JSON.stringify(message)
      return
    ).bind(this)
    return

  getDocsForWord: ->
    word = @getWordUnderCursor()
    @model.docsFor word
    return

  getTypeForWord: =>
    word = @getWordUnderCursor()
    @model.getType word, ((err, type) ->
      if err
        @statusbar.setStatus 'Idris: ' + err.message
      else
        @messages.show()
        @messages.clear()
        @messages.setTitle 'Idris: Type of <tt>' + word + '</tt>', true
        @messages.add new ProofObligationView(obligation: type)
      return
    ).bind(this)
    return

  doCaseSplit: =>
    editor = atom.workspace.getActiveEditor()
    line = editor.getLastCursor().getBufferRow()
    word = @getWordUnderCursor()
    @model.caseSplit line + 1, word, ((err, split) ->
      if err
        @statusbar.setStatus 'Idris: ' + err.message
      else
        lineRange = editor.getCursor(0).getCurrentLineBufferRange(includeNewline: true)
        editor.setTextInBufferRange lineRange, split
      return
    ).bind(this)
    return

  doAddClause: ->
    editor = atom.workspace.getActiveEditor()
    line = editor.getCursor(0).getBufferRow()
    word = @getWordUnderCursor()
    @model.addClause line + 1, word, ((err, clause) ->
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
          return
      return
    ).bind(this)
    return

  doProofSearch: ->
    editor = atom.workspace.getActiveEditor()
    line = editor.getCursor(0).getBufferRow()
    word = @getWordUnderCursor()
    @model.proofSearch line + 1, word, ((err, res) ->
      if err
        @statusbar.setStatus 'Idris: ' + err.message
      else
        editor.transact ->
          # Move the cursor to the beginning of the word
          editor.moveCursorToBeginningOfWord()
          # Because the ? in the metavariable isn't part of
          # the word, we move left once, and then select two
          # words
          editor.moveCursorLeft()
          editor.selectToEndOfWord()
          editor.selectToEndOfWord()
          # And then replace the replacement with the guess..
          editor.insertText res
          return
      return
    ).bind(this)
    return

module.exports = IdrisController
