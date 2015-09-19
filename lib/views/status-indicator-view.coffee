class StatusIndicator extends HTMLElement
  initialize: ->
    @classList.add 'idris-mode'
    @classList.add 'inline-block'

    @iconSpan = document.createElement 'span'
    @iconSpan.classList.add 'icon'
    @appendChild @iconSpan
    @setStatusDirty()

  setStatusLoaded: ->
    @setText 'Idris (Loaded)'

  setStatusDirty: ->
    @setText 'Idris (Not loaded)'

  setText: (text) ->
    @iconSpan.textContent = text

module.exports = StatusIndicator =
  document.registerElement 'idris-status-indicator',
    prototype: StatusIndicator.prototype
