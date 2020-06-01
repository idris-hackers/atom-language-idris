import { string, Parjser, int, noCharOf } from 'parjs'
import {
    mapConst,
    or,
    map,
    stringify,
    between,
    many,
    qthen,
    later,
    manySepBy,
} from 'parjs/combinators'
import {
    BoolAtom,
    IntegerAtom,
    StringAtom,
    SymbolAtom,
    SExpList,
    SExp,
} from './ide-protocol'

//------------------------------------------------------------------------------
// Parsing Booleans
//------------------------------------------------------------------------------

export const trueP: Parjser<BoolAtom> = string(':True').pipe(
    mapConst({ type: 'bool', data: true }),
)
export const falseP: Parjser<BoolAtom> = string(':False').pipe(
    mapConst({ type: 'bool', data: false }),
)
export const boolP = trueP.pipe(or(falseP))

//------------------------------------------------------------------------------
// Parsing Integers
//------------------------------------------------------------------------------

export const integerP: Parjser<IntegerAtom> = int({
    allowSign: false,
    base: 10,
}).pipe(
    map((int) => {
        return {
            type: 'integer',
            data: int,
        }
    }),
)

//------------------------------------------------------------------------------
// Parsing Strings
//------------------------------------------------------------------------------

const quoteP = string('"')
const escapedQuote = string('\\"').pipe(mapConst('"'))
const backspaceP = string('\\')
const escapedP = escapedQuote.pipe(or(backspaceP))
const quotedCharP = escapedP.pipe(or(noCharOf('"')))
export const stringP: Parjser<StringAtom> = quotedCharP.pipe(
    many(),
    stringify(),
    between(quoteP),
    map((str) => {
        return {
            type: 'string',
            data: str,
        }
    }),
)

//------------------------------------------------------------------------------
// Parsing Symbols
//------------------------------------------------------------------------------

const symbolStartP = string(':')
const symbolCharP = noCharOf(' )(')
const symbolCharsP = symbolCharP.pipe(many())
export const symbolP: Parjser<SymbolAtom> = symbolStartP.pipe(
    qthen(symbolCharsP),
    stringify(),
    map((sym) => {
        return { type: 'symbol', data: sym }
    }),
)

//------------------------------------------------------------------------------
// Parsing Lists
//------------------------------------------------------------------------------

const openP = string('(')
const closeP = string(')')
export const listP = later<SExpList>()
export const sexpP: Parjser<SExp> = boolP.pipe(
    or(integerP, stringP, symbolP, listP),
)
listP.init(
    sexpP.pipe(
        manySepBy(' '),
        between(openP, closeP),
        map((list) => {
            return { type: 'list', data: list }
        }),
    ),
)
