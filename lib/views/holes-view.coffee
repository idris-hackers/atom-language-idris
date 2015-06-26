{View} = require 'atom-space-pen-views'
highlighter = require '../utils/highlighter'

class HolesView extends View
  initialize: (holes) ->
    html = holes
      .map (hole) =>
        name = hole[0]
        premises = hole[1]
        conclusion = hole[2]
        @prettyprintHoles name, premises, conclusion
      .join "\n\n"

    @html html

  prettyprintHoles: (name, premises, conclusion) ->
    prettyPremises = @prettyprintPremises premises
    prettyConclusion = @prettyprintConclusion name, conclusion

    """#{name}
    #{prettyPremises}
    #{prettyConclusion}\n
    """

  prettyprintPremises: (premises) ->
    premises
      .map (premise) ->
        name = premise[0]
        type = highlighter.highlight premise[1], premise[2]
        "    #{name} : #{type}"
      .join "\n"

  prettyprintConclusion: (name, conclusion) ->
    highlightedConclusion = highlighter.highlight conclusion[0], conclusion[1]
    dividerLength = "#{name} : #{conclusion[0]}".length
    divider = ('-' for _ in [0...dividerLength]).join ''
    "#{divider}\n#{name} : #{highlightedConclusion}"

  @content: ->
    @pre class: 'idris-mode block'

module.exports = HolesView
