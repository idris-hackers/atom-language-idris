export const operatorRegex = new RegExp(`(\
\\?[-!#\\$%&\\*\\+\\.\\/<=>@\\\\\\^\\|~:]+\
|[-!#\\$%&\\*\\+\\.\\/<=>@\\\\\\^\\|~:][-!#\\$%&\\*\\+\\.\\/<=>@\\\\\\^\\|~:\\?]*\
)`)

export const isOperator = (chars: string): boolean =>
    !!chars.match(operatorRegex)

// puts parenthesis around a word if it's an operator
export const serializeWord = (word: string): string => {
    if (isOperator(word)) {
        return `(${word})`
    } else {
        return word
    }
}
