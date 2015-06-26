{View} = require 'atom-space-pen-views'
highlighter = require '../utils/highlighter'

class MetavariablesView extends View
  initialize: (metavariables) ->
    html = metavariables
      .map (metavariable) =>
        name = metavariable[0]
        premises = metavariable[1]
        conclusion = metavariable[2]
        @prettyprintMetavariable name, premises, conclusion
      .join "\n\n"

    @html html

  prettyprintMetavariable: (name, premises, conclusion) ->
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

module.exports = MetavariablesView
