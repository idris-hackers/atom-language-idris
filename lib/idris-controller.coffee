{ MessagePanelView, PlainMessageView, LineMessageView } =
  require 'atom-message-panel'
InformationView = require './views/information-view'
HolesView = require './views/holes-view'
Logger = require './Logger'
IdrisModel = require './idris-model'
Ipkg = require './utils/ipkg'
Symbol = require './utils/symbol'
editorHelper = require './utils/editor'
highlighter = require './utils/highlighter'

class IdrisController
  errorMarkers: []

  getCommands: ->
    'language-idris:type-of': @runCommand @getTypeForWord
    'language-idris:docs-for': @runCommand @getDocsForWord
    'language-idris:case-split': @runCommand @doCaseSplit
    'language-idris:add-clause': @runCommand @doAddClause
    'language-idris:make-with': @runCommand @doMakeWith
    'language-idris:make-lemma': @runCommand @doMakeLemma
    'language-idris:make-case': @runCommand @doMakeCase
    'language-idris:holes': @runCommand @showHoles
    'language-idris:proof-search': @runCommand @doProofSearch
    'language-idris:typecheck': @runCommand @typecheckFile
    'language-idris:print-definition': @runCommand @printDefinition
    'language-idris:stop-compiler': @stopCompiler
    'language-idris:open-repl': @runCommand @openREPL
    'language-idris:apropos': @runCommand @apropos
    'language-idris:add-proof-clause': @runCommand @doAddProofClause
    'language-idris:browse-namespace': @runCommand @doBrowseNamespace

  isIdrisFile: (uri) ->
    uri?.match? /\.idr$/

  # check if this is a literate idris file
  isLiterateGrammar: () ->
    @getEditor().getGrammar().scopeName == "source.idris.literate"

  # prefix code lines with "> "  if we are in the literate grammar
  prefixLiterateClause: (clause) =>
    birdPattern = ///^ # beginning of line
      >     # the bird
      (\s)+ # some whitespace
      ///

    if (@isLiterateGrammar())
      for line in clause
        if line.match birdPattern
           line
         else "> " + line
    else
      clause

  createMarker: (editor, range, type) ->
    marker = editor.markBufferRange(range, invalidate: 'never')
    editor.decorateMarker marker,
      type: type
      class: 'highlight-idris-error'
    marker

  destroyMarkers: () ->
    for marker in @errorMarkers
      marker.destroy()

  destroy: ->
    if @model
      Logger.logText 'Idris: Shutting down!'
      @model.stop()
    @statusbar.destroy()

  # clear the message panel and optionally display a new title
  clearMessagePanel: (title) ->
    @messages.attach()
    @messages.show()
    @messages.clear()
    @messages.setTitle title, true if title?

  # hide the message panel
  hideAndClearMessagePanel: () ->
    @clearMessagePanel()
    @messages.hide()

  # add raw information to the message panel
  rawMessage: (text) ->
    @messages.add new PlainMessageView
      raw: true
      message: '<pre>' + text + '</pre>'
      className: 'preview'

  initialize: (compilerOptions) ->
    @destroyMarkers()
    if !@model
      @model = new IdrisModel
      @messages = new MessagePanelView
        title: 'Idris Messages'
      @messages.attach()
      @messages.hide()
    @model.setCompilerOptions compilerOptions

  # get the currently active text editor
  getEditor: () ->
    atom.workspace.getActiveTextEditor()

  stopCompiler: =>
    @model?.stop()

  runCommand:
    (command) =>
      (args) =>
        compilerOptions = Ipkg.compilerOptions atom.project
        compilerOptions.subscribe (options) =>
          console.log "Compiler Options:", options
          @initialize options
          command args

  # see https://github.com/atom/autocomplete-plus/wiki/Provider-API
  provideReplCompletions: =>
    selector: '.source.idris'

    inclusionPriority: 1
    excludeLowerPriority: false

    # Get suggestions from the Idris REPL. You can always ask for suggestions <Ctrl+Space>
    # or type at least 3 characters to get suggestions based on your autocomplete-plus
    # settings.
    getSuggestions: ({ editor, bufferPosition, scopeDescriptor, prefix, activatedManually }) =>
      trimmedPrefix = prefix.trim()
      if trimmedPrefix.length > 2 or activatedManually
        Ipkg.compilerOptions atom.project
          .flatMap (options) =>
            @initialize options
            @model
              .replCompletions trimmedPrefix
          .toPromise()
          .then ({ responseType, msg }) ->
            for sug in msg[0][0]
              type: "function"
              text: sug
      else
        null

  saveFile: (editor) ->
    if editor.getURI()
      editor.save()
    else
      atom.workspace.saveActivePaneItemAs()

  typecheckFile: (event) =>
    editor = @getEditor()
    @saveFile editor
    uri = editor.getURI()
    @clearMessagePanel 'Idris: Typechecking ...'

    successHandler = ({ responseType, msg }) =>
      @clearMessagePanel 'Idris: File loaded successfully'

    @model
      .load uri
      .filter ({ responseType }) -> responseType == 'return'
      .subscribe successHandler, @displayErrors

  getDocsForWord: ({ target }) =>
    editor = @getEditor()
    @saveFile editor
    uri = editor.getURI()
    word = Symbol.serializeWord editorHelper.getWordUnderCursor(editor)
    @clearMessagePanel 'Idris: Searching docs for <tt>' + word + '</tt> ...'

    successHandler = ({ responseType, msg }) =>
      [type, highlightingInfo] = msg
      @clearMessagePanel 'Idris: Docs for <tt>' + word + '</tt>'

      informationView = new InformationView
      informationView.initialize
        obligation: type
        highlightingInfo: highlightingInfo
      @messages.add informationView

    @model
      .load uri
      .filter ({ responseType }) -> responseType == 'return'
      .flatMap => @model.docsFor word
      .catch (e) => @model.docsFor word
      .subscribe successHandler, @displayErrors

  getTypeForWord: ({ target }) =>
    editor = @getEditor()
    @saveFile editor
    uri = editor.getURI()
    word = Symbol.serializeWord editorHelper.getWordUnderCursor(editor)
    @clearMessagePanel 'Idris: Searching type of <tt>' + word + '</tt> ...'

    successHandler = ({ responseType, msg }) =>
      [type, highlightingInfo] = msg
      @clearMessagePanel 'Idris: Type of <tt>' + word + '</tt>'

      informationView = new InformationView
      informationView.initialize
        obligation: type
        highlightingInfo: highlightingInfo
      @messages.add informationView

    @model
      .load uri
      .filter ({ responseType }) -> responseType == 'return'
      .flatMap => @model.getType word
      .subscribe successHandler, @displayErrors

  doCaseSplit: ({ target }) =>
    editor = @getEditor()
    @saveFile editor
    uri = editor.getURI()
    cursor = editor.getLastCursor()
    line = cursor.getBufferRow()
    word = editorHelper.getWordUnderCursor editor

    @clearMessagePanel 'Idris: Do case split ...'

    successHandler = ({ responseType, msg }) =>
      [split] = msg

      @hideAndClearMessagePanel()

      lineRange = cursor.getCurrentLineBufferRange(includeNewline: true)
      editor.setTextInBufferRange lineRange, split

    @model
      .load uri
      .filter ({ responseType }) -> responseType == 'return'
      .flatMap => @model.caseSplit line + 1, word
      .subscribe successHandler, @displayErrors

  # add a new clause to a function
  doAddClause: ({ target }) =>
    editor = @getEditor()
    @saveFile editor
    uri = editor.getURI()
    line = editor.getLastCursor().getBufferRow()
    word = editorHelper.getWordUnderCursor editor

    @clearMessagePanel 'Idris: Add clause ...'

    successHandler = ({ responseType, msg }) =>
      [clause] = @prefixLiterateClause msg

      @hideAndClearMessagePanel()

      editor.transact ->
        editorHelper.moveToNextEmptyLine editor

        # Insert the new clause
        editor.insertText clause

        # And move the cursor to the beginning of
        # the new line and add an empty line below it
        editor.insertNewlineBelow()
        editor.moveUp()
        editor.moveToBeginningOfLine()

    @model
      .load uri
      .filter ({ responseType }) -> responseType == 'return'
      .flatMap => @model.addClause line + 1, word
      .subscribe successHandler, @displayErrors

  # use special syntax for proof obligation clauses
  doAddProofClause: ({ target }) =>
    editor = @getEditor()
    @saveFile editor
    uri = editor.getURI()
    line = editor.getLastCursor().getBufferRow()
    word = editorHelper.getWordUnderCursor editor
    @clearMessagePanel 'Idris: Add proof clause ...'

    successHandler = ({ responseType, msg }) =>
      [clause] = @prefixLiterateClause msg

      @hideAndClearMessagePanel()

      editor.transact ->
        editorHelper.moveToNextEmptyLine editor

        # Insert the new clause
        editor.insertText clause

        # And move the cursor to the beginning of
        # the new line and add an empty line below it
        editor.insertNewlineBelow()
        editor.moveUp()
        editor.moveToBeginningOfLine()

    @model
      .load uri
      .filter ({ responseType }) -> responseType == 'return'
      .flatMap => @model.addProofClause line + 1, word
      .subscribe successHandler, @displayErrors

  # add a with view
  doMakeWith: ({ target }) =>
    editor = @getEditor()
    @saveFile editor
    uri = editor.getURI()
    line = editor.getLastCursor().getBufferRow()
    word = editorHelper.getWordUnderCursor editor

    @clearMessagePanel 'Idris: Make with view ...'

    successHandler = ({ responseType, msg }) =>
      [clause] = @prefixLiterateClause msg

      @hideAndClearMessagePanel()

      editor.transact ->
        # Delete old line, insert the new with block
        editor.deleteLine()
        editor.insertText clause
        # And move the cursor to the beginning of
        # the new line
        editor.moveToBeginningOfLine()
        editor.moveUp()


    @model
      .load uri
      .filter ({ responseType }) -> responseType == 'return'
      .flatMap => @model.makeWith line + 1, word
      .subscribe successHandler, @displayErrors

  # construct a lemma from a hole
  doMakeLemma: ({ target }) =>
    editor = @getEditor()
    @saveFile editor
    uri = editor.getURI()
    line = editor.getLastCursor().getBufferRow()
    word = editorHelper.getWordUnderCursor editor
    @clearMessagePanel 'Idris: Make lemma ...'

    successHandler = ({ responseType, msg }) =>
      # param1 contains the code which replaces the hole
      # param2 contains the code for the lemma function
      [lemty, param1, param2] = msg
      param2 = @prefixLiterateClause param2

      @hideAndClearMessagePanel()

      editor.transact ->
        if lemty == ':metavariable-lemma'
          # Move the cursor to the beginning of the word
          editor.moveToBeginningOfWord()
          # Because the ? in the Holes isn't part of
          # the word, we move left once, and then select two
          # words
          editor.moveLeft()
          editor.selectToEndOfWord()
          editor.selectToEndOfWord()
          # And then replace the replacement with the lemma call..
          editor.insertText param1[1]

          # Now move to the previous blank line and insert the type
          # of the lemma
          editor.moveToBeginningOfLine()
          line = editor.getLastCursor().getBufferRow()

          # I tried to make this a function but failed to find out how
          # to call it and gave up...
          while(line > 0)
            editor.moveToBeginningOfLine()
            editor.selectToEndOfLine()
            contents = editor.getSelectedText()
            if contents == ''
              break
            editor.moveUp()
            line--

          editor.insertNewlineBelow()
          editor.insertText param2[1]
          editor.insertNewlineBelow()

    @model
      .load uri
      .filter ({ responseType }) -> responseType == 'return'
      .flatMap => @model.makeLemma line + 1, word
      .subscribe successHandler, @displayErrors

  # create a case statement
  doMakeCase: ({ target }) =>
    editor = @getEditor()
    @saveFile editor
    uri = editor.getURI()
    line = editor.getLastCursor().getBufferRow()
    word = editorHelper.getWordUnderCursor editor
    @clearMessagePanel 'Idris: Make case ...'

    successHandler = ({ responseType, msg }) =>
      [clause] = @prefixLiterateClause msg

      @hideAndClearMessagePanel()

      editor.transact ->
        # Delete old line, insert the new case block
        editor.deleteLine()
        editor.insertText clause
        # And move the cursor to the beginning of
        # the new line
        editor.moveToBeginningOfLine()
        editor.moveUp()

    @model
      .load uri
      .filter ({ responseType }) -> responseType == 'return'
      .flatMap => @model.makeCase line + 1, word
      .subscribe successHandler, @displayErrors

  # show all holes in the current file
  showHoles: ({ target }) =>
    editor = @getEditor()
    @saveFile editor
    uri = editor.getURI()
    @clearMessagePanel 'Idris: Searching holes ...'

    successHandler = ({ responseType, msg }) =>
      [holes] = msg
      @clearMessagePanel 'Idris: Holes'
      holesView = new HolesView
      holesView.initialize holes
      @messages.add holesView

    @model
      .load uri
      .filter ({ responseType }) -> responseType == 'return'
      .flatMap => @model.holes 80
      .subscribe successHandler, @displayErrors

  # replace a hole with a proof
  doProofSearch: ({ target }) =>
    editor = @getEditor()
    @saveFile editor
    uri = editor.getURI()
    line = editor.getLastCursor().getBufferRow()
    word = editorHelper.getWordUnderCursor editor
    @clearMessagePanel 'Idris: Searching proof ...'

    successHandler = ({ responseType, msg }) =>
      [res] = msg

      @hideAndClearMessagePanel()

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
      .filter ({ responseType }) -> responseType == 'return'
      .flatMap => @model.proofSearch line + 1, word
      .subscribe successHandler, @displayErrors

  doBrowseNamespace: ({target}) =>
    editor = @getEditor()
    @saveFile editor
    uri = editor.getURI()
    nameSpace = editor.getSelectedText()
    console.log nameSpace

    @clearMessagePanel 'Idris: Browsing namespace <tt>' + nameSpace + '</tt>'

    successHandler = ({ responseType, msg }) =>
      # the information is in a two dimensional array
      # one array contains the namespaces contained in the namespace
      # and the seconds all the methods
      namesSpaceInformation = msg[0][0]
      for nameSpace in namesSpaceInformation
          @rawMessage nameSpace

      methodInformation = msg[0][1]
      for [line, highlightInformation] in methodInformation
          highlighted = highlighter.highlight line, highlightInformation
          highlighting = highlighter.highlight line, highlightInformation
          info = highlighter.highlightToString highlighting
          @rawMessage info

    @model
      .load uri
      .filter ({ responseType }) -> responseType == 'return'
      .flatMap => @model.browseNamespace nameSpace
      .subscribe successHandler, @displayErrors

  # get the definition of a function or type
  printDefinition: ({ target }) =>
    editor = @getEditor()
    @saveFile editor
    uri = editor.getURI()
    word = Symbol.serializeWord editorHelper.getWordUnderCursor(editor)
    @clearMessagePanel 'Idris: Searching definition of <tt>' + word + '</tt> ...'

    successHandler = ({ responseType, msg }) =>
      [type, highlightingInfo] = msg
      @clearMessagePanel 'Idris: Definition of <tt>' + word + '</tt>'
      informationView = new InformationView
      informationView.initialize
        obligation: type
        highlightingInfo: highlightingInfo
      @messages.add informationView

    @model
      .load uri
      .filter ({ responseType }) -> responseType == 'return'
      .flatMap => @model.printDefinition word
      .catch (e) => @model.printDefinition word
      .subscribe successHandler, @displayErrors

  # open the repl window
  openREPL: ({ target }) =>
    uri = @getEditor().getURI()
    @clearMessagePanel 'Idris: opening REPL ...'

    successHandler = ({ responseType, msg }) =>
      @hideAndClearMessagePanel()

      options =
        split: 'right'
        searchAllPanes: true

      atom.workspace.open "idris://repl", options

    @model
      .load uri
      .filter ({ responseType }) -> responseType == 'return'
      .subscribe successHandler, @displayErrors

  # open the apropos window
  apropos: ({ target }) =>
    uri = @getEditor().getURI()
    @clearMessagePanel 'Idris: opening apropos view ...'

    successHandler = ({ responseType, msg }) =>
      @hideAndClearMessagePanel()

      options =
        split: 'right'
        searchAllPanes: true

      atom.workspace.open "idris://apropos", options

    @model
      .load uri
      .filter ({ responseType }) -> responseType == 'return'
      .subscribe successHandler, @displayErrors

  # generic function to display errors in the status bar
  displayErrors: (err) =>
    @clearMessagePanel '<i class="icon-bug"></i> Idris Errors'

    # display the general error message
    if err.message?
      @rawMessage err.message

    for warning in err.warnings
      type = warning[3]
      highlightingInfo = warning[4]
      highlighting = highlighter.highlight type, highlightingInfo
      info = highlighter.highlightToString highlighting

      line = warning[1][0]
      character = warning[1][1]
      uri = warning[0].replace("./", err.cwd + "/")

      # this provides information about the line and column of the error
      @messages.add new LineMessageView
        line: line
        character: character
        file: uri

      # this provides a highlighted version of the error message
      # returned by idris
      @rawMessage info

      editor = atom.workspace.getActiveTextEditor()
      if line > 0 && uri == editor.getURI()
        startPoint = warning[1]
        startPoint[0] = startPoint[0] - 1
        endPoint = warning[2]
        endPoint[0] = endPoint[0] - 1
        gutterMarker = @createMarker editor, [startPoint, endPoint], 'line-number'
        lineMarker = @createMarker editor, [[line - 1, character - 1], [line, 0]], 'line'
        @errorMarkers.push gutterMarker
        @errorMarkers.push lineMarker

module.exports = IdrisController
