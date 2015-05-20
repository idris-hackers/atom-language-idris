var MessagePanelView    = require('atom-message-panel').MessagePanelView
  , PlainMessageView    = require('atom-message-panel').PlainMessageView
  , LineMessageView     = require('atom-message-panel').LineMessageView
  , ProofObligationView = require('./ProofObligationView')

function IdrisController(statusbar, messages, model) {
  this.statusbar = statusbar
  this.messages = messages
  this.model = model
  this.init()
}

IdrisController.prototype.idrisBuffers = 0
IdrisController.prototype.localChanges = undefined

IdrisController.prototype.init = function() {
  this.idrisBuffers = 0

  atom.workspace.eachEditor((function(editor) {
    var uri = editor.getUri()
    if (this.isIdrisFile(uri)) {
      this.idrisFileOpened(editor)
    }
  }).bind(this))

  atom.workspace.subscribe(
    atom.workspaceView,
    'pane-container:active-pane-item-changed',
    this.paneChanged.bind(this)
  )

  var events = [
    ['language-idris:type-of'     , this.getTypeForWord],
    ['language-idris:docs-for'    , this.getDocsForWord],
    ['language-idris:case-split'  , this.doCaseSplit],
    ['language-idris:add-clause'  , this.doAddClause],
    ['language-idris:proof-search', this.doProofSearch]
  ]
  events.forEach(function(ev) {
    atom.workspace.subscribe(
      atom.workspaceView,
      ev[0],
      ev[1].bind(this)
    )
  }.bind(this));

  this.statusbar.initialize()

  this.messages = new MessagePanelView({
    title: 'Idris Messages',
    closeMethod: 'hide'
  })
  this.messages.attach()
  this.messages.hide()

  if(activeItem = atom.workspace.getActiveEditor()) {
    if (activeItem.isModified()) {
      this.idrisFileChanged(activeItem)
    }
  }
}

IdrisController.prototype.isIdrisFile = function(uri) {
  if (uri === undefined) return false
  else return uri.match(/\.idr$/)
}

IdrisController.prototype.idrisFileOpened = function(editor) {
  this.idrisBuffers += 1

  if (!this.model.running()) {
    console.log('Starting Idris IDESlave')
    this.model.start()
  }

  editor.buffer.on('destroyed', this.idrisFileClosed.bind(this, editor))
  editor.buffer.on('saved', this.idrisFileSaved.bind(this, editor))
  editor.buffer.on('changed', this.idrisFileChanged.bind(this, editor))
}

IdrisController.prototype.idrisFileSaved = function(editor) {
  this.messages.clear()
  this.messages.hide()

  this.localChanges = false
  if (this.isIdrisFile(editor.getUri())) {
    this.loadFile(editor.getUri())
  }
}

IdrisController.prototype.idrisFileChanged = function(editor) {
  this.localChanges = editor.isModified()
  if (this.localChanges) {
    this.statusbar.setStatus('Idris: local modifications')
  } else if (this.isIdrisFile(editor.getUri())) {
    this.loadFile(editor.getUri())
  }
}

IdrisController.prototype.idrisFileClosed = function(editor) {
  this.idrisBuffers -= 1;

  if (this.idrisBuffers == 0) {
    console.log('Shut down Idris IDESlave')
    this.model.stop()
  }
}

IdrisController.prototype.paneChanged = function() {
  this.messages.clear()
  this.messages.hide()

  var editor = atom.workspace.getActivePaneItem()
  if (!editor) return

  var uri = editor.uri
  if (this.isIdrisFile(uri)) {
    this.statusbar.show()
    this.loadFile(uri)
  } else {
    this.statusbar.hide()
  }
}

IdrisController.prototype.destroy = function() {
  if (this.idrisModel) {
    console.log('Idris: Shutting down!')
    this.model.stop()
  }
  this.statusbar.destroy()
}

IdrisController.prototype.getWordUnderCursor = function() {
  var editor = atom.workspace.getActiveEditor()
    , cursorPosition = editor.getCursor(0).getCurrentWordBufferRange()
  return editor.getTextInBufferRange(cursorPosition)
}

IdrisController.prototype.loadFile = function(uri) {
  console.log('Loading ' + uri)
  this.messages.clear()
  this.model.load(uri, function(err, message, progress) {
    if (err) {
      this.statusbar.setStatus('Idris: ' + err.message)

      this.messages.show()
      this.messages.clear()
      this.messages.setTitle('<i class="icon-bug"></i> Idris Errors', true)
      for (var i=0; i < err.warnings.length; i++) {
        var warning = err.warnings[i]
        this.messages.add(new LineMessageView({line: warning[1], character: warning[2], message: warning[3]}))
      }
    } else if (progress) {
      console.log('... ' + progress)
      this.statusbar.setStatus('Idris: ' + progress)
    } else {
      this.statusbar.setStatus('Idris: ' + message)
    }
  }.bind(this))
}

IdrisController.prototype.getDocsForWord = function() {
  var word = this.getWordUnderCursor()
  this.model.docsFor(word)
}

IdrisController.prototype.getTypeForWord = function() {
  var word = this.getWordUnderCursor()
  this.model.getType(word, function(err, type) {
    if (err) {
      this.statusbar.setStatus('Idris: ' + err.message)
    } else {
      this.messages.show()
      this.messages.clear()
      this.messages.setTitle('Idris: Type of <tt>' + word + '</tt>', true)
      this.messages.add(new ProofObligationView({obligation: type}))
    }
  }.bind(this))
}


IdrisController.prototype.doCaseSplit = function() {
  var editor = atom.workspace.getActiveEditor()
    , line = editor.getCursor(0).getBufferRow()
    , word = this.getWordUnderCursor()
  this.model.caseSplit(line + 1, word, function(err, split) {
    if (err) {
      this.statusbar.setStatus('Idris: ' + err.message)
    } else {
      var lineRange = editor.getCursor(0).getCurrentLineBufferRange({
        includeNewline: true
      })
      editor.setTextInBufferRange(lineRange, split)
    }
  }.bind(this))
}

IdrisController.prototype.doAddClause = function() {
  var editor = atom.workspace.getActiveEditor()
    , line = editor.getCursor(0).getBufferRow()
    , word = this.getWordUnderCursor()
  this.model.addClause(line + 1, word, function(err, clause) {
    if (err) {
      this.statusbar.setStatus('Idris: ' + err.message)
    } else {
      editor.transact(function() {
        // Insert a newline and the new clause
        editor.insertNewlineBelow()
        editor.insertText(clause)
        // And move the cursor to the beginning of
        // the new line
        editor.moveCursorToBeginningOfLine()
      })
    }
  }.bind(this))
}

IdrisController.prototype.doProofSearch = function() {
  var editor = atom.workspace.getActiveEditor()
    , line = editor.getCursor(0).getBufferRow()
    , word = this.getWordUnderCursor()
  this.model.proofSearch(line + 1, word, function(err, res) {
    if (err) {
      this.statusbar.setStatus('Idris: ' + err.message)
    } else {
      editor.transact(function() {
        // Move the cursor to the beginning of the word
        editor.moveCursorToBeginningOfWord()
        // Because the ? in the metavariable isn't part of
        // the word, we move left once, and then select two
        // words
        editor.moveCursorLeft()
        editor.selectToEndOfWord()
        editor.selectToEndOfWord()
        // And then replace the replacement with the guess..
        editor.insertText(res)
      })
    }
  }.bind(this))
}

module.exports = IdrisController
