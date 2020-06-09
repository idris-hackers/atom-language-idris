import { SExp } from './ide-protocol'

/*
 * Takes an s-expression and formats it for sending.
 * It serializes it, adds a newline at the end and
 * prepends it with the length of the command.
 */
export const serialize = function (sexp: SExp) {
    const msg = formatSexp(sexp) + '\n'
    return `${hexLength(msg)}${msg}`
}

/**
 * Returns a 0-padded 6-char long hexadecimal
 * for the length of the input `str`
 */
export const hexLength = function (str: string) {
    const hex = str.length.toString(16)
    return Array(7 - hex.length).join('0') + hex
}

/**
 * Serializes an s-expression.
 */
export const formatSexp = (sexp: SExp): string => {
    switch (sexp.type) {
        case 'list': {
            return `(${sexp.data.map(formatSexp).join(' ')})`
        }
        case 'string': {
            return `"${sexp.data.trim()}"`
        }
        case 'bool': {
            return sexp.data ? ':True' : ':False'
        }
        case 'integer': {
            return `${sexp.data}`
        }
        case 'symbol': {
            return `:${sexp.data.trim()}`
        }
    }
}
