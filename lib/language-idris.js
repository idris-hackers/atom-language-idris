var StatusBarView = require('./statusbar-view')
  , IdrisController = require('./idris-controller')
  , IdrisModel = require('./idris-model')

module.exports = {
  configDefaults: {
    pathToIdris: 'idris'
  },

  activate: function(state) {
    this.statusbar = new StatusBarView()
    this.model = new IdrisModel()
    this.controller = new IdrisController(
                            this.statusbar,
                            this.messages,
                            this.model
                          )
  },

  deactivate: function() {
    this.controller.destroy()
  },

  serialize: function() {
    // languageIdrisViewState: this.languageIdrisView.serialize()
  }
}
