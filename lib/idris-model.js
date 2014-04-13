var spawn = require('child_process').spawn
  , parser = require('./parser')
  , utils = require('./utils')
  , EventEmitter = require('events').EventEmitter

var IdrisModel = function() {
  this.buffer = ''
  this.process = undefined
  this.callbacks = {}
  this.warnings = {}
  EventEmitter.apply(this)
}

utils.inherits(IdrisModel, EventEmitter)

IdrisModel.prototype.process = undefined
IdrisModel.prototype.requestId = 0

IdrisModel.prototype.start = function() {
  this.process = spawn(
    atom.config.get('language-idris.pathToIdris'),
    ['--ideslave']
  )
  this.process.on('exit', this.exited.bind(this))
  this.process.on('error', this.exited.bind(this))
  this.process.stdout.on('data', this.stdout.bind(this))
}

IdrisModel.prototype.stop = function() {
  if (!this.process) return
  this.process.kill()
}

IdrisModel.prototype.stdout = function(data) {
  this.buffer += data;
  while (this.buffer.length > 6) {
    // We have 6 chars, which is the length of the command
    var len = parseInt(this.buffer.substr(0, 6), 16)
    if (this.buffer.length >= 6+len) {
      // We also have the length of the command in the buffer, so
      // let's read in the command
      var cmd = this.buffer.substr(6, len).trim()
      // Remove the length + command from the buffer
      this.buffer = this.buffer.substr(6+len)

      // And then we can try to parse to command..
      try {
        var obj = parser.parse(cmd.trim())
        this.handleCommand(obj)
      } catch (e) {
        console.log(cmd.trim())
        console.log(e.toString())
      }
    } else {
      // We didn't have the entire command, so let's break the
      // while-loop and wait for the next data-event
      break
    }
  }
}

IdrisModel.prototype.handleCommand = function(cmd) {
  switch (cmd.op) {
    case 'return':
      var id = cmd.params[cmd.params.length - 1]
        , ret = cmd.params[0]
      if (!this.callbacks[id]) break
      if (ret.op == 'ok') {
        this.callbacks[id](undefined, ret.params[0])
      } else {
        this.callbacks[id]({
          message: ret.params[0],
          warnings: this.warnings[id]
        })
      }
      delete this.callbacks[id]
      delete this.warnings[id]
      break
    case 'write-string':
      var id = cmd.params[cmd.params.length - 1]
        , msg = cmd.params[0]
      if (!this.callbacks[id]) break
      this.callbacks[id](undefined, undefined, msg)
      break
    case 'warning':
      var id = cmd.params[cmd.params.length - 1]
        , warning = cmd.params[0]
      this.warnings[id].push(warning)
      break
    case 'set-prompt':
      // Ignore
      break
    default:
      console.log(cmd)
      break
  }
}

IdrisModel.prototype.exited = function() {
  console.log('Exited')
  this.process = undefined
}

IdrisModel.prototype.running = function() {
  return !!this.process
}

IdrisModel.prototype.load = function(uri, callback) {
  var id = ++this.requestId
    , cmd = [{op: 'load-file', params: [uri]}, id]

  this.callbacks[id] = callback
  this.warnings[id] = []

  this.process.stdin.write(utils.formatObj(cmd))
}

var cmds = [
  ['docs-for', 'docsFor'],
  ['type-of', 'getType']
]
cmds.forEach(function(info) {
  IdrisModel.prototype[info[1]] = function(word, callback) {
    var id = ++this.requestId
      , cmd = [{op: info[0], params: [word]}, id]

    this.callbacks[id] = callback
    this.warnings[id] = []

    this.process.stdin.write(utils.formatObj(cmd))
  }
})

var cmds = [
  ['case-split',   'caseSplit'],
  ['add-clause',   'addClause'],
]
cmds.forEach(function(info) {
  IdrisModel.prototype[info[1]] = function(line, word, callback) {
    var id = ++this.requestId
      , cmd = [{op: info[0], params: [line, word]}, id]

    this.callbacks[id] = callback
    this.warnings[id] = []

    this.process.stdin.write(utils.formatObj(cmd))
  }
})

IdrisModel.prototype.proofSearch = function(line, word, callback) {
  var id = ++this.requestId
    , cmd = [{op: 'proof-search', params: [line, word, []]}, id]

  this.callbacks[id] = callback
  this.warnings[id] = []

  this.process.stdin.write(utils.formatObj(cmd))
}

module.exports = IdrisModel
