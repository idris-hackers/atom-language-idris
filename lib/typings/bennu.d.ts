declare module 'bennu' {
    export type Parser<T> = {
        map: any
    }

    export type Parse = {
        always: <T>(t: T) => Parser<T>
        attempt: any
        between: any
        choice: <T>(...choices: Array<Parser<T>>) => Parser<T>
        either: <T>(l: Parser<T>, r: Parser<T>) => Parser<T>
        many: any
        many1: any
        next: <T, U>(p1: Parser<T>, p2: Parser<U>) => Parser<U>
        rec: any
        run: any
        token: (test: (c: string) => boolean) => any
    }

    export const parse: Parse

    export type Text = {
        character: (c: string) => Parser<string>
        digit: Parser<string>
        noneOf: any
        run: any
        space: Parser<never>
        string: (s: string) => Parser<string>
    }

    export const text: Text

    export type Lang = {
        between: any
        sepBy: any
    }

    export const lang: Lang
}
