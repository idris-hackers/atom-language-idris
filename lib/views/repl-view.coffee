Cycle = require '@cycle/core'
CycleDOM = require '@cycle/dom'
highlighter = require '../utils/highlighter'
Rx = require 'rx-lite'

fontOptions = () ->
  fontSize = atom.config.get 'language-idris.panelFontSize'
  fontSizeAttr = "#{fontSize}px"
  enableLigatures = atom.config.get 'language-idris.panelFontLigatures'
  webkitFontFeatureSettings =
    if enableLigatures
      '"liga"'
    else
      '"inherit"'

  fontFamily = atom.config.get 'language-idris.panelFontFamily'
  if fontFamily != ''
    fontFamily
  else
    '"inherit"'

  'font-size': fontSizeAttr
  '-webkit-font-feature-settings': webkitFontFeatureSettings
  'font-family': fontFamily

styles = fontOptions()

# highlight : forall a.
#   { code : String, highlightInformation : HighlightInformation } ->
#   CycleDOM
highlight = ({ code, highlightInformation }) ->
  if highlightInformation
    highlights = highlighter.highlight code, highlightInformation
    highlighter.highlightToCycle highlights
  else
    code

displaySuccess = (line) ->
  highlightedCode = highlight line

  CycleDOM.h 'pre',
    {
      className: 'idris-repl-output'
      style: styles
    },
    [
      highlightedCode
    ]

displayError = (line) ->
  highlightedCode = highlight line

  CycleDOM.h 'pre', { }, highlightedCode

REPLCycle =
  # view : Observable State -> Observable CycleDOM
  view: (state$) ->
    state$.map (lines) ->
      lines = lines.map (line) ->
        answer =
          if line.type == 'success'
            displaySuccess line
          else
            displayError line

        CycleDOM.h 'div',
          {
            className: 'idris-repl-line'
            style: styles
          },
          [
            CycleDOM.h 'div', { className: 'idris-repl-input' },
              [
                CycleDOM.h 'span', { className: 'idris-repl-input-prompt' }, '> '
                line.input
              ]
            answer
          ]

      CycleDOM.h 'div',
        {
          className: 'idris-panel-view'
        },
        [
          CycleDOM.h 'input', { type: 'text', className: 'native-key-bindings idris-repl-input-field' }, 'toggle'
          CycleDOM.h 'div', lines
        ]

  main: (responses) ->
    input = responses.DOM.select('input').events('keydown')
      .filter (ev) -> ev.keyCode == 13
      .map (ev) -> ev.target.value
      .startWith ''

    DOM: REPLCycle.view responses.CONTENT
    CONTENT: input

  # driver : forall a.
  #   IdrisModel -> Observable String ->
  #   Observable (List { a | code : String, highlightInformation : highlightInformation })
  driver:
    (options) ->
      DOM: CycleDOM.makeDOMDriver options.hostElement
      CONTENT: (inp) ->
        inp
          .filter (line) -> line != ''
          .flatMap (line) ->
            escapedLine = line.replace(/"/g, '\\"')
            # append a space to trick the formatter, so that it wont turn
            # the input into a symbol
            options.model.interpret "#{escapedLine} "
              .map (e) ->
                type: 'success'
                input: line
                code: e.msg[0]
                highlightInformation: e.msg[1]
              .catch (e) ->
                error =
                  input: line
                  type: 'error'
                  code: e.message
                  warnings: e.warnings
                  highlightInformation: e.highlightInformation
                Rx.Observable.just error
          .scan ((acc, x) -> [x].concat acc), []
          .startWith []

class REPLView
  constructor: (params) ->
    hostElement = document.createElement 'div'
    @[0] = hostElement

    model = params.controller.model

    drivers =
      REPLCycle.driver
        hostElement: hostElement
        model: model

    Cycle.run REPLCycle.main, drivers

module.exports = REPLView
