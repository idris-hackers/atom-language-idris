parse = require('bennu').parse
text = require('bennu').text
lang = require('bennu').lang
stream = require('nu-stream').stream

streamToString = (s) -> stream.toArray(s).join ''

# bool
trueP = parse.next text.string(':True'), parse.always(true)
falseP = parse.next text.string(':False'), parse.always(false)
boolP = parse.either trueP, falseP

# integer
integerP =
  parse.many1(text.digit)
    .map streamToString
    .map (s) -> parseInt(s, 10)

# string
quoteP = text.character '"'
stringP =
  lang.between(quoteP, quoteP, parse.many(text.noneOf('"')))
    .map streamToString

# symbol
symbolStartP = text.character ':'
symbolChar = text.noneOf ' )'
symbolP =
  parse.next symbolStartP, parse.many(symbolChar)
    .map streamToString
    .map (symbol) -> ":#{symbol}"

# sexp
openP = text.character '('
closeP = text.character ')'
sexpP = (parse.rec (self) ->
  choices = parse.choice boolP, integerP, stringP, symbolP, self
  lang.between(openP, closeP, lang.sepBy(text.space, choices))
    .map(stream.toArray))

module.exports =
  parse: (input) -> parse.run sexpP, input
