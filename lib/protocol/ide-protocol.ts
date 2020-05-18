export type SExpList = { type: 'list'; data: Array<SExp> }
export type StringAtom = { type: 'string'; data: string }
export type BoolAtom = { type: 'bool'; data: boolean }
export type IntegerAtom = { type: 'integer'; data: number }
export type SymbolAtom = { type: 'symbol'; data: string }
export type SExp = SExpList | StringAtom | BoolAtom | IntegerAtom | SymbolAtom

/**
 * Interpret `code` at the Idris REPL, returning a highlighted result.
 */
export type InterpretCommand = { type: 'interpret'; code: string }

/**
 * Load the named file.
 * If `lineNumber` is provided, the file is only loaded up to that line. Otherwise, the entire file is loaded.
 */
export type LoadFileCommand = {
    type: 'load-file'
    fileName: string
    lineNumber?: number
}

/**
 * Return the type of the name, written with Idris syntax in the `code`.
 * The reply may contain highlighting information.
 */
export type TypeOfCommand = { type: 'type-of'; code: string }

type DocsForMode = 'overview' | 'full'
/** Look up the documentation for NAME, and return it as a highlighted string.
 * If `mode` is `"overview"`, only the first paragraph of documentation is provided for `symbolName`.
 * If `mode` is `"full"`, or omitted, the full documentation is returned for `symbolName`.
 */
export type DocsForComand = {
    type: 'docs-for'
    symbolName: string
    mode: DocsForMode
}

/**
 * Generate a case-split for the pattern variable `symbolName` on program line `line`.
 * The pattern-match cases to be substituted are returned as a string with no highlighting.
 */
export type CaseSplitCommand = {
    type: 'case-split'
    line: number
    symbolName: string
}

/**
 * Generate an initial pattern-match clause for the function declared as `symbolName` on program line `line`.
 * The initial clause is returned as a string with no highlighting.
 */
export type AddClauseCommand = {
    type: 'add-clause'
    line: number
    symbolName: string
}

/**
 * Add a clause driven by the <== syntax.
 */
export type AddProofClauseCommand = {
    type: 'add-proof-clause'
    line: number
    symbolName: string
}

/**
 * Create a with-rule pattern match template for the clause of function `symbolName` on line `line`.
 * The new code is returned with no highlighting.
 */
export type MakeWithCommand = {
    type: 'make-with'
    line: number
    symbolName: string
}

/**
 * Create a top level function with a type which solves the hole named `symbolName` on line `line`.
 */
export type MakeLemmaCommand = {
    type: 'make-lemma'
    line: number
    symbolName: string
}

/**
 * Create a case pattern match template for the clause of function `symbolName` on line `line`.
 * The new code is returned with no highlighting.
 */
export type MakeCaseCommand = {
    type: 'make-case'
    line: number
    symbolName: string
}

/**
 * List the currently-active holes, with their types pretty-printed with `width` columns.
 */
export type MetavariablesComand = {
    type: 'metavariables'
    width: number
}

/**
 * Attempt to fill out the holes on `line` named `symbolName` by proof search.
 */
export type ProofSearchCommand = {
    type: 'proof-search'
    line: number
    symbolName: string
}

/**
 * Return the definition of `symbolName` as a highlighted string.
 */
export type PrintDefinitionCommand = {
    type: 'print-definition'
    symbolName: string
}

/**
 * Return the contents of `namespace`, like :browse at the command-line REPL.
 */
export type BrowseNamespaceCommand = {
    type: 'browse-namespace'
    namespace: string
}

/**
 * Search the documentation for mentions of `code`, and return any found as a list of highlighted strings.
 */
export type AproposCommand = {
    type: 'apropos'
    code: string
}

/**
 * Search names, types and documentations which contain `name`.
 * Return the result of tab-completing NAME as a REPL command.
 */
export type ReplCompletionsCommand = {
    type: 'repl-completions'
    name: string
}

/**
 * IDE commands we can send to Idris
 */
export type IDECommand =
    | InterpretCommand
    | LoadFileCommand
    | TypeOfCommand
    | DocsForComand
    | CaseSplitCommand
    | AddClauseCommand
    | AddProofClauseCommand
    | MakeWithCommand
    | MakeLemmaCommand
    | MakeCaseCommand
    | MetavariablesComand
    | ProofSearchCommand
    | PrintDefinitionCommand
    | BrowseNamespaceCommand
    | AproposCommand
    | ReplCompletionsCommand
