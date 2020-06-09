import { parse, text, lang } from 'bennu'
import { stream } from 'nu-stream'

// this module defines the parse required to deal with S-Expressions
// as used for the communication with the Idris IDE

const streamToString = (s: any): string => stream.toArray(s).join('')

// bool
export const trueP = parse.next(text.string(':True'), parse.always(true))
export const falseP = parse.next(text.string(':False'), parse.always(false))
const boolP = parse.either(trueP, falseP)

// integer
export const integerP = parse
    .many1(text.digit)
    .map(streamToString)
    .map((s: string) => parseInt(s, 10))

// string
const quoteP = text.character('"')
const escapedP = parse.choice(
    parse.next(text.character('\\'), parse.always('\\')),
    parse.next(text.character('"'), parse.always('"')),
)
const stringLetterP = parse.token((c: string) => c !== '"' && c !== '\\')
const stringEscapeP = parse.attempt(parse.next(text.character('\\'), escapedP))
const stringBackslashP = text.character('\\')
export const stringCharP = parse.choice(
    stringLetterP,
    stringEscapeP,
    stringBackslashP,
)
export const stringP = lang
    .between(quoteP, quoteP, parse.many(stringCharP))
    .map(streamToString)

// symbol
const symbolStartP = text.character(':')
const symbolChar = text.noneOf(' )')
export const symbolP = parse
    .next(symbolStartP, parse.many(symbolChar))
    .map(streamToString)
    .map((symbol: string) => `:${symbol}`)

// sexp
const openP = text.character('(')
const closeP = text.character(')')
const sexpP = parse.rec((self: any) => {
    const choices = parse.choice(boolP, integerP, stringP, symbolP, self)
    return lang
        .between(openP, closeP, lang.sepBy(text.space, choices))
        .map(stream.toArray)
})

export const parseCommand = (input: string) => parse.run(sexpP, input)
