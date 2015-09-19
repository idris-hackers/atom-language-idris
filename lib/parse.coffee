{ parse, text, lang } = require 'bennu'
{ stream } = require 'nu-stream'

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
escapedP = parse.choice(parse.next(text.character('\\'), parse.always('\\')),
                        parse.next(text.character('"'), parse.always('"')))
stringLetterP = parse.token (c) ->
  c != '"' && c != '\\'
stringEscapeP = parse.attempt parse.next(text.character('\\'), escapedP)
stringBackslashP = text.character '\\'
stringCharP = parse.choice stringLetterP, stringEscapeP, stringBackslashP
stringP =
  lang.between(quoteP, quoteP, parse.many(stringCharP))
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
  trueP: trueP
  falseP: falseP
  integerP: integerP
  stringCharP: stringCharP
  stringP: stringP
  symbolP: symbolP
  parse: (input) -> parse.run sexpP, input
