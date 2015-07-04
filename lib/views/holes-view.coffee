highlighter = require '../utils/highlighter'
dom = require '../utils/dom'

textNode = (text) ->
  document.createTextNode text

class HolesView extends HTMLElement
  initialize: (holes) ->
    @holesContainer = document.createElement 'pre'
    @holesContainer.classList.add 'idris-mode'
    @holesContainer.classList.add 'block'
    @holesContainer.classList.add 'idris-holes-view'

    @appendChild @holesContainer
    @showHoles holes

  showHoles: (holes) ->
    @holesContainer.appendChild @prettyprintHoles(holes)

  prettyprintHoles: (holes) ->
    html = holes
      .map ([name, premises, conclusion]) =>
        @prettyprintHole name, premises, conclusion
    dom.joinHtmlElements 'div', html

  prettyprintHole: (name, premises, conclusion) ->
    prettyPremises = @prettyprintPremises premises
    prettyConclusion = @prettyprintConclusion name, conclusion

    hole = dom.joinHtmlElements 'div', [textNode "#{name}"].concat(prettyPremises, prettyConclusion)
    hole.classList.add 'idris'
    hole.classList.add  'idris-hole'
    hole

  prettyprintPremises: (premises) ->
    html = premises
      .map ([name, type, highlightInformation]) ->
        highlight = highlighter.highlight type, highlightInformation
        type = highlighter.highlightToHtml highlight
        dom.joinHtmlElements 'div', [textNode "    #{name} : "].concat(type)
    dom.joinHtmlElements 'div', html

  prettyprintConclusion: (name, [type, highlightInformation]) ->
    highlight = highlighter.highlight(type, highlightInformation)
    highlightedConclusion = highlighter.highlightToHtml highlight
    dividerLength = "#{name} : #{type}".length
    divider = textNode ('-' for _ in [0...dividerLength]).join('')

    [
      divider
      document.createElement 'br'
      textNode "#{name} : "
      highlightedConclusion
    ]

module.exports = HolesView =
  document.registerElement('idris-holes-view', {prototype: HolesView.prototype})
