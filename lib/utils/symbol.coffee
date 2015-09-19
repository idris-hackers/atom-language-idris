operatorRegex = ///(
  \?[-!#\$%&\*\+\.\/<=>@\\\^\|~:]+  # starts with ?, has at least one more opchar
   | [-!#\$%&\*\+\.\/<=>@\\\^\|~:][-!#\$%&\*\+\.\/<=>@\\\^\|~:\?]* # doesn't start with ?
) ///

isOperator = (chars) ->
  !! chars.match(operatorRegex)

# puts parenthesis around a word if it's an operator
serializeWord = (word) ->
  if isOperator word
    "(#{word})"
  else
    word

module.exports =
  operatorRegex: operatorRegex
  isOperator: isOperator
  serializeWord: serializeWord
