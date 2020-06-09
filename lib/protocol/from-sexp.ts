import {
    ProtocolVersion,
    Result,
    Output,
    UnknownAnswer,
    Answer,
} from './answers'
import { SExpList, SExp, SExpType, ExtractSExpDataType } from './ide-protocol'
import { sexpP } from './parser'

type Succ<T> = { type: 'succ'; data: T }
type Err<T> = { type: 'err'; data: T }
type ErrOrSucc<T, E> = Succ<T> | Err<E>

const protocolVersionFromSExp = (
    list: Array<SExp>,
): ProtocolVersion | UnknownAnswer => {
    if (list.length == 2) {
        const major = list[0].type === 'integer' ? list[0].data : undefined
        const minor = list[1].type === 'integer' ? list[1].data : undefined
        if (major !== undefined && minor !== undefined) {
            return { type: 'protocol-version', major, minor }
        }
    }
    return {
        type: 'unknown',
        msg: 'unkown protocol version',
        expr: { type: 'list', data: list },
    }
}

const resultFromSExp = (
    id: number,
    list: Array<SExp>,
): ErrOrSucc<Result, { id: number; msg: string }> => {
    if (list.length === 2) {
        const head = list[0].type === 'symbol' ? list[0].data : undefined
        const data = list[1].type === 'list' ? list[0].data : undefined
    } else {
        return { type: 'err', data: { id, msg: 'invalid result type length' } }
    }
}

const outputFromSExp = (list: Array<SExp>): Output | UnknownAnswer => {
    if (list.length == 2) {
        const result = list[0].type === 'list' ? list[0].data : undefined
        const id = list[1].type === 'integer' ? list[1].data : undefined
        if (result !== undefined && id !== undefined) {
            const resultOrErr = resultFromSExp(id, result)
            if (resultOrErr.type === 'succ') {
                return { type: 'output', id, result: resultOrErr.data }
            } else {
                return {
                    type: 'unknown',
                    msg: `invalid output at id: ${id}: ${resultOrErr.data.msg}`,
                    expr: { type: 'list', data: result },
                }
            }
        }
    }

    return {
        type: 'unknown',
        msg: 'invalid output',
        expr: { type: 'list', data: list },
    }
}

const returnFromSExp = (list: Array<SExp>): Answer => {
    return {
        type: 'unknown',
        msg: 'invalid return',
        expr: { type: 'list', data: list },
    }
}

const setPromptFromSExp = (list: Array<SExp>): Answer => {
    if (list.length == 2) {
        const prompt = list[0].type === 'string' ? list[0].data : undefined
        const id = list[1].type === 'integer' ? list[1].data : undefined
        if (prompt !== undefined && id !== undefined) {
            return { type: 'set-prompt', prompt, id }
        }
    }
    return {
        type: 'unknown',
        msg: 'invalid prompt',
        expr: { type: 'list', data: list },
    }
}

export const fromSExp = (sexp: SExp): Answer => {
    if (sexp.type === 'list' && sexp.data.length > 0) {
        const head = sexp.data[0]
        const tail = sexp.data.slice(1)
        if (head.type === 'symbol') {
            console.log(tail)
            switch (head.data) {
                case 'protocol-version': {
                    return protocolVersionFromSExp(tail)
                }
                case 'output': {
                    return outputFromSExp(tail)
                }
                case 'return': {
                    return returnFromSExp(tail)
                }
                case 'set-prompt': {
                    return setPromptFromSExp(tail)
                }
                default: {
                    return {
                        type: 'unknown',
                        msg: 'unkown head symbol',
                        expr: sexp,
                    }
                }
            }
        } else {
            return {
                type: 'unknown',
                msg: 'first element should be a symbol',
                expr: sexp,
            }
        }
    } else {
        return { type: 'unknown', msg: 'should be a list', expr: sexp }
    }
}
