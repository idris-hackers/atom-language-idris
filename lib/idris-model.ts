import { IdrisIdeMode } from './idris-ide-mode'
import * as Rx from 'rx-lite'
import * as JS from './utils/js'
import * as path from 'path'
import { CompilerOptions } from './utils/ipkg'
import { IDECommand, SExp } from './protocol/ide-protocol'
import { ideCommandToSExp } from './protocol/to-sexp'
import Logger from './utils/Logger'

export class IdrisModel {
    requestId = 0
    ideModeRef: IdrisIdeMode | null = null
    subjects: { [id: number]: Rx.Subject<any> } = {}
    warnings: any = {}
    compilerOptions: CompilerOptions = { pkgs: [] }
    oldCompilerOptions: CompilerOptions = { pkgs: [] }

    constructor() {
        this.handleCommand = this.handleCommand.bind(this)
    }

    ideMode(compilerOptions: any) {
        if (
            this.ideModeRef &&
            (!JS.objectEqual(this.oldCompilerOptions, compilerOptions) ||
                !this.ideModeRef.running())
        ) {
            this.ideModeRef.process?.removeAllListeners()
            this.ideModeRef.stop()
            this.ideModeRef = null
        }
        if (!this.ideModeRef) {
            this.ideModeRef = new IdrisIdeMode()
            this.ideModeRef.on('message', this.handleCommand)
            this.ideModeRef.start(compilerOptions)
            this.oldCompilerOptions = compilerOptions
        }
        return this.ideModeRef
    }

    stop() {
        return this.ideModeRef != null ? this.ideModeRef.stop() : undefined
    }

    setCompilerOptions(options: CompilerOptions): void {
        this.compilerOptions = options
    }

    handleCommand(cmd: any) {
        if (cmd.length > 0) {
            const op = cmd[0],
                adjustedLength = Math.max(cmd.length, 2),
                params = cmd.slice(1, adjustedLength - 1),
                id = cmd[adjustedLength - 1]
            if (this.subjects[id] != null) {
                const subject = this.subjects[id]
                switch (op) {
                    case ':return':
                        var ret = params[0]
                        if (ret[0] === ':ok') {
                            const okparams = ret[1]
                            if (okparams[0] === ':metavariable-lemma') {
                                subject.onNext({
                                    responseType: 'return',
                                    msg: okparams,
                                })
                            } else {
                                subject.onNext({
                                    responseType: 'return',
                                    msg: ret.slice(1),
                                })
                            }
                        } else {
                            subject.onError({
                                message: ret[1],
                                warnings: this.warnings[id],
                                highlightInformation: ret[2],
                                cwd: this.compilerOptions.src,
                            })
                        }
                        subject.onCompleted()
                        return delete this.subjects[id]
                    case ':write-string':
                        var msg = params[0]
                        atom.notifications.addInfo(msg)
                        return subject.onNext({
                            responseType: 'write-string',
                            msg,
                        })
                    case ':warning':
                        var warning = params[0]
                        return this.warnings[id].push(warning)
                    case ':run-program':
                        var options = {
                            detail:
                                'The path for the compiled program. It was copied to your clipboard. Paste it into a terminal to execute.',
                            dismissible: true,
                            icon: 'comment',
                            buttons: [{ text: 'Confirm' }],
                        }
                        atom.clipboard.write(params[0])
                        return atom.notifications.addSuccess(params[0], options)
                    case ':set-prompt':
                    // Ignore
                    default: {
                        Logger.logObject('Unhandled Operator', op)
                        Logger.logObject('Params', params)
                        return
                    }
                }
            }
        }
    }

    getUID(): number {
        return ++this.requestId
    }

    prepareCommand(cmd: IDECommand): Rx.Subject<unknown> {
        const id = this.getUID()
        const subject = new Rx.Subject()
        this.subjects[id] = subject
        this.warnings[id] = []
        const command: SExp = {
            type: 'list',
            data: [ideCommandToSExp(cmd), { type: 'integer', data: id }],
        }
        this.ideMode(this.compilerOptions).send(command)
        return subject
    }

    changeDirectory(dir: string) {
        return this.interpret(`:cd ${dir}`)
    }

    load(uri: string) {
        const dir = this.compilerOptions.src
            ? this.compilerOptions.src
            : path.dirname(uri)

        const cd = (() => {
            if (dir !== this.compilerOptions.src) {
                this.compilerOptions.src = dir
                return this.changeDirectory(dir).map(() => dir)
            } else {
                return Rx.Observable.of(dir)
            }
        })()

        return cd.flatMap((_) => {
            return this.prepareCommand({ type: 'load-file', fileName: uri })
        })
    }

    docsFor(symbolName: string) {
        return this.prepareCommand({
            type: 'docs-for',
            symbolName,
            mode: 'full',
        })
    }

    replCompletions(name: string) {
        return this.prepareCommand({ type: 'repl-completions', name })
    }

    getType(code: string) {
        return this.prepareCommand({ type: 'type-of', code })
    }

    caseSplit(line: number, symbolName: string) {
        return this.prepareCommand({ type: 'case-split', line, symbolName })
    }

    makeWith(line: number, symbolName: string) {
        return this.prepareCommand({ type: 'make-with', line, symbolName })
    }

    makeLemma(line: number, symbolName: string) {
        return this.prepareCommand({ type: 'make-lemma', line, symbolName })
    }

    interpret(code: string) {
        return this.prepareCommand({ type: 'interpret', code })
    }

    makeCase(line: number, symbolName: string) {
        return this.prepareCommand({ type: 'make-case', line, symbolName })
    }

    addClause(line: number, symbolName: string) {
        return this.prepareCommand({ type: 'add-clause', line, symbolName })
    }

    addProofClause(line: number, symbolName: string) {
        return this.prepareCommand({
            type: 'add-proof-clause',
            line,
            symbolName,
        })
    }

    holes(width: number) {
        return this.prepareCommand({ type: 'metavariables', width })
    }

    proofSearch(line: number, symbolName: string) {
        return this.prepareCommand({ type: 'proof-search', line, symbolName })
    }

    printDefinition(symbolName: string) {
        return this.prepareCommand({ type: 'print-definition', symbolName })
    }

    apropos(code: string) {
        return this.prepareCommand({ type: 'apropos', code })
    }

    browseNamespace(namespace: string) {
        return this.prepareCommand({ type: 'browse-namespace', namespace })
    }
}
