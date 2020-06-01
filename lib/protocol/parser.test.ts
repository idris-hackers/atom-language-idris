import { describe, test, expect } from '@jest/globals'
import { boolP, integerP, stringP, symbolP, listP } from './parser'
import {
    BoolAtom,
    IntegerAtom,
    StringAtom,
    SymbolAtom,
    SExpList,
    SExp,
} from './ide-protocol'

const mkBool = (b: boolean): BoolAtom => {
    return { type: 'bool', data: b }
}

const mkInt = (n: number): IntegerAtom => {
    return { type: 'integer', data: n }
}

const mkStr = (s: string): StringAtom => {
    return { type: 'string', data: s }
}

const mkSymb = (s: string): SymbolAtom => {
    return { type: 'symbol', data: s }
}

const mkList = (xs: Array<SExp>): SExpList => {
    return { type: 'list', data: xs }
}

const mkTuple2 = (a: SExp, b: SExp): SExp => mkList([a, b])

const mkAnnotation = (
    line: number,
    row: number,
    annotations: Array<SExp>,
): SExpList => mkList([mkInt(line), mkInt(row), mkList(annotations)])

describe('test sub parsers', () => {
    test('parse booleans', () => {
        expect(boolP.parse(':True').value).toStrictEqual(mkBool(true))
        expect(boolP.parse(':False').value).toStrictEqual(mkBool(false))
    })

    test('parse integers', () => {
        expect(integerP.parse('24234').value).toStrictEqual(mkInt(24234))
    })

    test('parse strings', () => {
        expect(stringP.parse('"Main.a : Nat"').value).toStrictEqual(
            mkStr('Main.a : Nat'),
        )
        expect(stringP.parse('"Main.a"').value).toStrictEqual(mkStr('Main.a'))
        expect(stringP.parse('""').value).toStrictEqual(mkStr(''))
        expect(stringP.parse('"Nat"').value).toStrictEqual(mkStr('Nat'))
        expect(stringP.parse('"\\""').value).toStrictEqual(mkStr('"'))
    })

    test('parse symbols', () => {
        expect(symbolP.parse(':return').value).toStrictEqual(mkSymb('return'))
    })
})

describe('parse lists', () => {
    test('parse protocol version', () => {
        expect(listP.parse('(:protocol-version 1 0)').value).toStrictEqual(
            mkList([mkSymb('protocol-version'), mkInt(1), mkInt(0)]),
        )
    })

    test('parse set prompt', () => {
        expect(
            listP.parse(
                '(:set-prompt "*C:\\Programming\\Idris\\Start\\hello" 1)',
            ).value,
        ).toStrictEqual(
            mkList([
                mkSymb('set-prompt'),
                mkStr('*C:\\Programming\\Idris\\Start\\hello'),
                mkInt(1),
            ]),
        )
    })

    test('parse successful empty result', () => {
        expect(listP.parse('(:return (:ok ()) 5)').value).toStrictEqual(
            mkList([
                mkSymb('return'),
                mkList([mkSymb('ok'), mkList([])]),
                mkInt(5),
            ]),
        )
    })

    test('parse complex successfull result 1', () => {
        expect(
            listP.parse(
                '(:return (:ok "Main.a : Nat" ((0 6 ((:name "Main.a") (:implicit :False) (:decor :function) (:doc-overview "") (:type "Nat"))) (9 3 ((:name "Prelude.Nat.Nat") (:implicit :False) (:decor :type) (:doc-overview "Unary natural numbers") (:type "Type"))) (9 3 ((:tt-term "AAAAAAAAAAAAAwAAAAAACAAAAQyZWx1ZGU="))))) 2)',
            ).value,
        ).toStrictEqual(
            mkList([
                mkSymb('return'),
                mkList([
                    mkSymb('ok'),
                    mkStr('Main.a : Nat'),
                    mkList([
                        mkAnnotation(0, 6, [
                            mkTuple2(mkSymb('name'), mkStr('Main.a')),
                            mkTuple2(mkSymb('implicit'), mkBool(false)),
                            mkTuple2(mkSymb('decor'), mkSymb('function')),
                            mkTuple2(mkSymb('doc-overview'), mkStr('')),
                            mkTuple2(mkSymb('type'), mkStr('Nat')),
                        ]),
                        mkAnnotation(9, 3, [
                            mkTuple2(mkSymb('name'), mkStr('Prelude.Nat.Nat')),
                            mkTuple2(mkSymb('implicit'), mkBool(false)),
                            mkTuple2(mkSymb('decor'), mkSymb('type')),
                            mkTuple2(
                                mkSymb('doc-overview'),
                                mkStr('Unary natural numbers'),
                            ),
                            mkTuple2(mkSymb('type'), mkStr('Type')),
                        ]),
                        mkAnnotation(9, 3, [
                            mkTuple2(
                                mkSymb('tt-term'),
                                mkStr('AAAAAAAAAAAAAwAAAAAACAAAAQyZWx1ZGU='),
                            ),
                        ]),
                    ]),
                ]),
                mkInt(2),
            ]),
        )
    })

    test('parse complex successfull result 2', () => {
        expect(
            listP.parse(
                '(:return (:ok "\\"Z\\" : String" ((0 3 ((:name "\\"Z\\""))))) 5)',
            ).value,
        ).toStrictEqual(
            mkList([
                mkSymb('return'),
                mkList([
                    mkSymb('ok'),
                    mkStr('"Z" : String'),
                    mkList([
                        mkAnnotation(0, 3, [
                            mkTuple2(mkSymb('name'), mkStr('"Z"')),
                        ]),
                    ]),
                ]),
                mkInt(5),
            ]),
        )
    })

    test('parse complex successfull result 3', () => {
        expect(
            listP.parse(
                '(:return (:ok "\\\\__pi_arg => \\\\__pi_arg1 => (__pi_arg1)") 6)',
            ).value,
        ).toStrictEqual(
            mkList([
                mkSymb('return'),
                mkList([
                    mkSymb('ok'),
                    mkStr('\\\\__pi_arg => \\\\__pi_arg1 => (__pi_arg1)'),
                ]),
                mkInt(6),
            ]),
        )
    })

    test('interpret', () => {
        expect(
            listP.parse('(:interpret ":cd C:/Path/to/dir")').value,
        ).toStrictEqual(
            mkTuple2(mkSymb('interpret'), mkStr(':cd C:/Path/to/dir')),
        )
    })
})
