import {
    InterpretCommand,
    TypeOfCommand,
    SExp,
    IDECommand,
    LoadFileCommand,
    DocsForComand,
    SymbolAtom,
    StringAtom,
    CaseSplitCommand,
    AddClauseCommand,
    AddProofClauseCommand,
    MakeWithCommand,
    MakeLemmaCommand,
    MakeCaseCommand,
    MetavariablesComand,
    ProofSearchCommand,
    PrintDefinitionCommand,
    BrowseNamespaceCommand,
    AproposCommand,
    ReplCompletionsCommand,
} from './ide-protocol'

// See: https://github.com/edwinb/Idris2-boot/blob/master/src/Idris/IDEMode/Commands.idr

const interpretCommandToSExp = (cmd: InterpretCommand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'interpret' },
            { type: 'string', data: cmd.code },
        ],
    }
}

const loadFileCommandToSExp = (cmd: LoadFileCommand): SExp => {
    const commandSymbol: SymbolAtom = { type: 'symbol', data: 'load-file' }
    const fileName: StringAtom = { type: 'string', data: cmd.fileName }
    return {
        type: 'list',
        data: cmd.lineNumber
            ? [
                  commandSymbol,
                  fileName,
                  { type: 'integer', data: cmd.lineNumber },
              ]
            : [commandSymbol, fileName],
    }
}

const typeOfCommandToSExp = (cmd: TypeOfCommand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'type-of' },
            { type: 'string', data: cmd.code },
        ],
    }
}

const docsForComandToSExp = (cmd: DocsForComand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'docs-for' },
            { type: 'string', data: cmd.symbolName },
            { type: 'symbol', data: cmd.mode },
        ],
    }
}

const caseSplitCommandToSExp = (cmd: CaseSplitCommand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'case-split' },
            { type: 'integer', data: cmd.line },
            { type: 'string', data: cmd.symbolName },
        ],
    }
}

const addClauseCommandToSExp = (cmd: AddClauseCommand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'add-clause' },
            { type: 'integer', data: cmd.line },
            { type: 'string', data: cmd.symbolName },
        ],
    }
}

const addProofClauseCommandToSExp = (cmd: AddProofClauseCommand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'add-proof-clause' },
            { type: 'integer', data: cmd.line },
            { type: 'string', data: cmd.symbolName },
        ],
    }
}

const makeWithCommandToSExp = (cmd: MakeWithCommand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'make-with' },
            { type: 'integer', data: cmd.line },
            { type: 'string', data: cmd.symbolName },
        ],
    }
}
const makeLemmaCommandToSExp = (cmd: MakeLemmaCommand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'make-lemma' },
            { type: 'integer', data: cmd.line },
            { type: 'string', data: cmd.symbolName },
        ],
    }
}

const makeCaseCommandToSExp = (cmd: MakeCaseCommand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'make-case' },
            { type: 'integer', data: cmd.line },
            { type: 'string', data: cmd.symbolName },
        ],
    }
}

const metavariablesCommandToSExp = (cmd: MetavariablesComand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'metavariables' },
            { type: 'integer', data: cmd.width },
        ],
    }
}

const proofSearchCommandToSExp = (cmd: ProofSearchCommand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'proof-search' },
            { type: 'integer', data: cmd.line },
            { type: 'string', data: cmd.symbolName },
        ],
    }
}

const printDefinitionCommandToSExp = (cmd: PrintDefinitionCommand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'print-definition' },
            { type: 'string', data: cmd.symbolName },
        ],
    }
}

const browseNamespaceCommandToSepx = (cmd: BrowseNamespaceCommand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'browse-namespace' },
            { type: 'string', data: cmd.namespace },
        ],
    }
}

const aproposCommandToSExp = (cmd: AproposCommand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'apropos' },
            { type: 'string', data: cmd.code },
        ],
    }
}

const replCompletionCommandToSExp = (cmd: ReplCompletionsCommand): SExp => {
    return {
        type: 'list',
        data: [
            { type: 'symbol', data: 'repl-completions' },
            { type: 'string', data: cmd.name },
        ],
    }
}

export const ideCommandToSExp = (cmd: IDECommand): SExp => {
    switch (cmd.type) {
        case 'interpret': {
            return interpretCommandToSExp(cmd)
        }
        case 'load-file': {
            return loadFileCommandToSExp(cmd)
        }
        case 'type-of': {
            return typeOfCommandToSExp(cmd)
        }
        case 'docs-for': {
            return docsForComandToSExp(cmd)
        }
        case 'case-split': {
            return caseSplitCommandToSExp(cmd)
        }
        case 'add-clause': {
            return addClauseCommandToSExp(cmd)
        }
        case 'add-proof-clause': {
            return addProofClauseCommandToSExp(cmd)
        }
        case 'make-with': {
            return makeWithCommandToSExp(cmd)
        }
        case 'make-lemma': {
            return makeLemmaCommandToSExp(cmd)
        }
        case 'make-case': {
            return makeCaseCommandToSExp(cmd)
        }
        case 'metavariables': {
            return metavariablesCommandToSExp(cmd)
        }
        case 'proof-search': {
            return proofSearchCommandToSExp(cmd)
        }
        case 'print-definition': {
            return printDefinitionCommandToSExp(cmd)
        }
        case 'browse-namespace': {
            return browseNamespaceCommandToSepx(cmd)
        }
        case 'apropos': {
            return aproposCommandToSExp(cmd)
        }
        case 'repl-completions': {
            return replCompletionCommandToSExp(cmd)
        }
    }
}
