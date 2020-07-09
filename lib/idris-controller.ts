import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import {
    MessagePanelView,
    PlainMessageView,
    LineMessageView,
} from 'atom-message-panel'
import { IdrisClient, InfoReply, FinalReply, Reply } from 'idris-ide-client'
import { InformationView } from './views/information-view'
import { HolesView } from './views/holes-view'
import { browseNamespaceView } from './views/browse-namespace'
import * as Symbol from './utils/symbol'
import { getWordUnderCursor, moveToNextEmptyLine } from './utils/editor'
import {
    TextEditor,
    RangeCompatible,
    DisplayMarker,
    Pane,
    WorkspaceOpenOptions,
} from 'atom'
import {
    findAndReadIpkgFile,
    compilerOptionsToFlags,
    CompilerOptions,
    defaultCompilerOptions,
    sameCompilerOptions,
} from './utils/ipkg'
import { highlight, highlightToString } from './utils/highlighter'

const replyCallback = (handleWarning: (reply: InfoReply.Warning) => void) => (
    reply: Reply,
): void => {
    switch (reply.type) {
        case ':warning':
            return handleWarning(reply)
        default:
    }
}

export class IdrisController {
    errorMarkers: Array<DisplayMarker> = []
    compilerOptions: CompilerOptions = defaultCompilerOptions
    idrisProc: ChildProcessWithoutNullStreams
    client: IdrisClient
    messages: MessagePanelView = new MessagePanelView({
        title: 'Idris Messages',
    })

    constructor() {
        this.prefixLiterateClause = this.prefixLiterateClause.bind(this)
        this.clearMessagePanel = this.clearMessagePanel.bind(this)
        this.hideAndClearMessagePanel = this.hideAndClearMessagePanel.bind(this)
        this.stopCompiler = this.stopCompiler.bind(this)
        this.runCommand = this.runCommand.bind(this)
        this.provideReplCompletions = this.provideReplCompletions.bind(this)
        this.typecheckFile = this.typecheckFile.bind(this)
        this.getDocsForWord = this.getDocsForWord.bind(this)
        this.getTypeForWord = this.getTypeForWord.bind(this)
        this.doCaseSplit = this.doCaseSplit.bind(this)
        this.doAddClause = this.doAddClause.bind(this)
        this.doAddProofClause = this.doAddProofClause.bind(this)
        this.doMakeWith = this.doMakeWith.bind(this)
        this.doMakeLemma = this.doMakeLemma.bind(this)
        this.doMakeCase = this.doMakeCase.bind(this)
        this.showHoles = this.showHoles.bind(this)
        this.doProofSearch = this.doProofSearch.bind(this)
        this.doBrowseNamespace = this.doBrowseNamespace.bind(this)
        this.printDefinition = this.printDefinition.bind(this)
        this.openREPL = this.openREPL.bind(this)
        this.apropos = this.apropos.bind(this)
        this.displayErrors = this.displayErrors.bind(this)

        const tabLength = atom.config.get('editor.tabLength', {
            scope: ['source.idris'],
        })

        this.idrisProc = spawn('idris', [
            '--ide-mode',
            '--indent-with=' + tabLength,
            '--indent-clause=' + tabLength,
        ])
        this.client = new IdrisClient(
            this.idrisProc.stdin,
            this.idrisProc.stdout,
            {
                replyCallback: replyCallback(this.handleWarning.bind(this)),
            },
        )
        this.startCompiler()
    }

    getCommands() {
        return {
            'language-idris:type-of': this.runCommand(this.getTypeForWord),
            'language-idris:docs-for': this.runCommand(this.getDocsForWord),
            'language-idris:case-split': this.runCommand(this.doCaseSplit),
            'language-idris:add-clause': this.runCommand(this.doAddClause),
            'language-idris:make-with': this.runCommand(this.doMakeWith),
            'language-idris:make-lemma': this.runCommand(this.doMakeLemma),
            'language-idris:make-case': this.runCommand(this.doMakeCase),
            'language-idris:holes': this.runCommand(this.showHoles),
            'language-idris:proof-search': this.runCommand(this.doProofSearch),
            'language-idris:typecheck': this.runCommand(this.typecheckFile),
            'language-idris:print-definition': this.runCommand(
                this.printDefinition,
            ),
            // 'language-idris:stop-compiler': this.stopCompiler,
            'language-idris:open-repl': this.runCommand(this.openREPL),
            'language-idris:apropos': this.runCommand(this.apropos),
            'language-idris:add-proof-clause': this.runCommand(
                this.doAddProofClause,
            ),
            'language-idris:browse-namespace': this.runCommand(
                this.doBrowseNamespace,
            ),
            'language-idris:close-information-view': this
                .hideAndClearMessagePanel,
        }
    }

    // check if this is a literate idris file
    isLiterateGrammar(): boolean {
        return (
            this.getEditor()?.getGrammar().scopeName === 'source.idris.literate'
        )
    }

    // prefix code lines with "> "  if we are in the literate grammar
    prefixLiterateClause(clause: string): string {
        if (this.isLiterateGrammar()) {
            const birdPattern = new RegExp(`^\
            >\
            (\\s)+\
            `)
            return clause
                .split('\n')
                .map((line: string) =>
                    line.match(birdPattern) ? line : '> ' + line,
                )
                .join('\n')
        } else {
            return clause
        }
    }

    createMarker(
        editor: TextEditor,
        range: RangeCompatible,
        type:
            | 'line'
            | 'line-number'
            | 'text'
            | 'highlight'
            | 'overlay'
            | 'gutter'
            | 'block'
            | 'cursor',
    ): DisplayMarker {
        const marker = editor.markBufferRange(range, { invalidate: 'never' })
        editor.decorateMarker(marker, {
            type,
            class: 'highlight-idris-error',
        })
        return marker
    }

    destroyMarkers(): void {
        Array.from(this.errorMarkers).map((marker) => marker.destroy())
    }

    destroy(): void {
        this.stopCompiler()
    }

    // clear the message panel and optionally display a new title
    clearMessagePanel(title?: string): void {
        if (this.messages) {
            this.messages.attach()
            this.messages.show()
            this.messages.clear()
            if (title) {
                this.messages.setTitle(title, true)
            }
        }
    }

    // hide the message panel
    hideAndClearMessagePanel(): void {
        if (this.messages) {
            this.clearMessagePanel()
            this.messages.hide()
        }
    }

    // add raw information to the message panel
    rawMessage(text: string): void {
        this.messages.add(
            new PlainMessageView({
                raw: true,
                message: '<pre>' + text + '</pre>',
                className: 'preview',
            }),
        )
    }

    /**
     * Get the currently active text editor.
     */
    getEditor(): TextEditor | undefined {
        return atom.workspace.getActiveTextEditor()
    }

    getPane(): Pane {
        return atom.workspace.getActivePane()
    }

    stopCompiler(): void {
        if (this.idrisProc) {
            this.idrisProc.kill()
        }
    }

    async startCompiler(): Promise<IdrisClient> {
        try {
            const compilerOptions = await findAndReadIpkgFile(atom.project)
            if (
                compilerOptions &&
                !sameCompilerOptions(this.compilerOptions, compilerOptions)
            ) {
                const tabLength = atom.config.get('editor.tabLength', {
                    scope: ['source.idris'],
                })

                const flags = compilerOptionsToFlags(compilerOptions, tabLength)
                this.stopCompiler()
                this.compilerOptions = compilerOptions
                this.idrisProc = spawn('idris', flags)
                this.client = new IdrisClient(
                    this.idrisProc.stdin,
                    this.idrisProc.stdout,
                    {
                        replyCallback: replyCallback(
                            this.handleWarning.bind(this),
                        ),
                    },
                )
            }
            return this.client
        } catch {
            return this.client
        }
    }

    runCommand(command: (args: any) => void) {
        return (args: any) => {
            this.startCompiler().then(() => {
                command(args)
            })
        }
    }

    // see https://github.com/atom/autocomplete-plus/wiki/Provider-API
    provideReplCompletions() {
        return {
            selector: '.source.idris',

            inclusionPriority: 1,
            excludeLowerPriority: false,

            // Get suggestions from the Idris REPL. You can always ask for suggestions <Ctrl+Space>
            // or type at least 3 characters to get suggestions based on your autocomplete-plus
            // settings.
            getSuggestions: ({ prefix, activatedManually }: any) => {
                const trimmedPrefix = prefix.trim()
                if (trimmedPrefix.length > 2 || activatedManually) {
                    return this.startCompiler()
                        .then(() => {
                            return this.client.replCompletions(trimmedPrefix)
                        })
                        .then((reply: FinalReply.ReplCompletions) => {
                            return reply.completions.map((sug) => ({
                                type: 'function',
                                text: sug,
                            }))
                        })
                } else {
                    return null
                }
            },
        }
    }

    saveFile(editor: TextEditor | undefined): Promise<string> {
        if (editor) {
            const path = editor.getPath()
            if (path) {
                return editor.save().then(() => path)
            } else {
                const pane = this.getPane()
                const savePromise = pane.saveActiveItemAs()
                if (savePromise) {
                    const newPath = editor.getPath()
                    if (newPath) {
                        return savePromise.then(() => newPath)
                    } else {
                        return Promise.reject()
                    }
                } else {
                    return Promise.reject()
                }
            }
        } else {
            return Promise.reject()
        }
    }

    typecheckFile() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                this.clearMessagePanel('Idris: Typechecking...')

                const successHandler = (loadFile: FinalReply.LoadFile) => {
                    if (loadFile.ok) {
                        this.clearMessagePanel(
                            'Idris: File loaded successfully',
                        )
                    }
                }

                return this.client
                    .loadFile(uri)
                    .then(successHandler)
                    .catch(this.displayErrors)
            })
        }
    }

    getDocsForWord() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                const word = Symbol.serializeWord(getWordUnderCursor(editor))
                this.clearMessagePanel(
                    'Idris: Searching docs for <tt>' + word + '</tt> ...',
                )

                const successHandler = (docsFor: FinalReply.DocsFor) => {
                    if (docsFor.ok) {
                        this.clearMessagePanel(
                            'Idris: Docs for <tt>' + word + '</tt>',
                        )
                        const informationView = new InformationView()
                        informationView.initialize(
                            docsFor.docs,
                            docsFor.metadata,
                        )
                        this.messages.add(informationView)
                    } else {
                        this.rawMessage(docsFor.err)
                    }
                }

                return this.client
                    .loadFile(uri)
                    .then(() => this.client.docsFor(word, ':full'))
                    .then(successHandler)
                    .catch(this.displayErrors)
            })
        }
    }

    getTypeForWord() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                const word = Symbol.serializeWord(getWordUnderCursor(editor))
                this.clearMessagePanel(
                    'Idris: Searching type of <tt>' + word + '</tt> ...',
                )
                const successHandler = (typeOf: FinalReply.TypeOf) => {
                    if (typeOf.ok) {
                        this.clearMessagePanel(
                            'Idris: Type of <tt>' + word + '</tt>',
                        )
                        const informationView = new InformationView()
                        informationView.initialize(
                            typeOf.typeOf,
                            typeOf.metadata,
                        )
                        this.messages.add(informationView)
                    } else {
                        this.rawMessage(typeOf.err)
                    }
                }
                return this.client
                    .loadFile(uri)
                    .then(() => this.client.typeOf(word))
                    .then(successHandler)
                    .catch(this.displayErrors)
            })
        }
    }

    doCaseSplit() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                const cursor = editor.getLastCursor()
                const line = cursor.getBufferRow()
                const word = getWordUnderCursor(editor)

                this.clearMessagePanel('Idris: Do case split ...')

                const successHandler = (caseSplit: FinalReply.CaseSplit) => {
                    if (caseSplit.ok) {
                        this.hideAndClearMessagePanel()
                        const lineRange = cursor.getCurrentLineBufferRange({
                            includeNewline: true,
                        })
                        return editor.setTextInBufferRange(
                            lineRange,
                            caseSplit.caseClause,
                        )
                    } else {
                        this.clearMessagePanel('Idris: Cannot split ' + word)
                    }
                }

                return this.client
                    .loadFile(uri)
                    .then(() => this.client.caseSplit(word, line + 1))
                    .then(successHandler)
                    .catch(this.displayErrors)
            })
        }
    }

    /**
     *  Add a new clause to a function.
     */
    doAddClause() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                const line = editor.getLastCursor().getBufferRow()
                const word = getWordUnderCursor(editor)

                this.clearMessagePanel('Idris: Add clause ...')

                const successHandler = (addClause: FinalReply.AddClause) => {
                    const clause = this.prefixLiterateClause(
                        addClause.initialClause,
                    )

                    this.hideAndClearMessagePanel()

                    editor.transact(() => {
                        moveToNextEmptyLine(editor)

                        // Insert the new clause
                        editor.insertText(clause)

                        // And move the cursor to the beginning of
                        // the new line and add an empty line below it
                        editor.insertNewlineBelow()
                        editor.moveUp()
                        editor.moveToBeginningOfLine()
                    })
                }

                return this.client
                    .loadFile(uri)
                    .then(() => this.client.addClause(word, line + 1))
                    .then(successHandler)
                    .catch(this.displayErrors)
            })
        }
    }

    /**
     * Use special syntax for proof obligation clauses.
     */
    doAddProofClause() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                const line = editor.getLastCursor().getBufferRow()
                const word = getWordUnderCursor(editor)
                this.clearMessagePanel('Idris: Add proof clause ...')
                const successHandler = (reply: FinalReply.AddClause) => {
                    const clause = this.prefixLiterateClause(
                        reply.initialClause,
                    )
                    this.hideAndClearMessagePanel()
                    editor.transact(() => {
                        moveToNextEmptyLine(editor)
                        // Insert the new clause
                        editor.insertText(clause)
                        // And move the cursor to the beginning of
                        // the new line and add an empty line below it
                        editor.insertNewlineBelow()
                        editor.moveUp()
                        editor.moveToBeginningOfLine()
                    })
                }
                return this.client
                    .loadFile(uri)
                    .then(() => this.client.addClause(word, line + 1))
                    .then(successHandler)
                    .catch(this.displayErrors)
            })
        }
    }

    // add a with view
    doMakeWith() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                const line = editor.getLastCursor().getBufferRow()
                const word = getWordUnderCursor(editor)

                this.clearMessagePanel('Idris: Make with view ...')

                const successHandler = (reply: FinalReply.MakeWith) => {
                    const clause = this.prefixLiterateClause(reply.withClause)

                    this.hideAndClearMessagePanel()

                    return editor.transact(function () {
                        // Delete old line, insert the new with block
                        editor.deleteLine()
                        editor.insertText(clause)
                        // And move the cursor to the beginning of
                        // the new line
                        editor.moveToBeginningOfLine()
                        return editor.moveUp()
                    })
                }

                if (word != null ? word.length : undefined) {
                    return this.client
                        .loadFile(uri)
                        .then(() => this.client.makeWith(word, line + 1))
                        .then(successHandler)
                        .catch(this.displayErrors)
                } else {
                    return this.clearMessagePanel(
                        'Idris: Illegal position to make a with view',
                    )
                }
            })
        }
    }

    // construct a lemma from a hole
    doMakeLemma() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                let line = editor.getLastCursor().getBufferRow()
                const word = getWordUnderCursor(editor)
                this.clearMessagePanel('Idris: Make lemma ...')

                const successHandler = (reply: FinalReply.MakeLemma) => {
                    if ('err' in reply) {
                        this.clearMessagePanel(
                            'Idris: Cannot make lemma at ' + word,
                        )
                    } else {
                        // metavariable contains the code which replaces the hole
                        // declaration contains the code for the lemma function
                        const { declaration, metavariable } = reply

                        this.hideAndClearMessagePanel()

                        return editor.transact(function () {
                            // Move the cursor to the beginning of the word
                            editor.moveToBeginningOfWord()
                            // Because the ? in the Holes isn't part of
                            // the word, we move left once, and then select two
                            // words
                            editor.moveLeft()
                            editor.selectToEndOfWord()
                            editor.selectToEndOfWord()
                            // And then replace the replacement with the lemma call..
                            editor.insertText(metavariable)
                            // Now move to the previous blank line and insert the type
                            // of the lemma
                            editor.moveToBeginningOfLine()
                            line = editor.getLastCursor().getBufferRow()
                            // I tried to make this a function but failed to find out how
                            // to call it and gave up...
                            while (line > 0) {
                                editor.moveToBeginningOfLine()
                                editor.selectToEndOfLine()
                                const contents = editor.getSelectedText()
                                if (contents === '') {
                                    break
                                }
                                editor.moveUp()
                                line--
                            }
                            editor.insertNewlineBelow()
                            editor.insertText(declaration)
                            return editor.insertNewlineBelow()
                        })
                    }
                }

                return this.client
                    .loadFile(uri)
                    .then(() => this.client.makeLemma(word, line + 1))
                    .then(successHandler)
                    .catch(this.displayErrors)
            })
        }
    }

    // create a case statement
    doMakeCase() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                const line = editor.getLastCursor().getBufferRow()
                const word = getWordUnderCursor(editor)
                this.clearMessagePanel('Idris: Make case ...')

                const successHandler = (reply: FinalReply.MakeCase) => {
                    const [clause] = Array.from(
                        this.prefixLiterateClause(reply.caseClause),
                    )

                    this.hideAndClearMessagePanel()

                    return editor.transact(function () {
                        // Delete old line, insert the new case block
                        editor.moveToBeginningOfLine()
                        editor.deleteLine()
                        editor.insertText(clause)
                        // And move the cursor to the beginning of
                        // the new line
                        editor.moveToBeginningOfLine()
                        return editor.moveUp()
                    })
                }

                return this.client
                    .loadFile(uri)
                    .then(() => this.client.makeCase(word, line + 1))
                    .then(successHandler)
                    .catch(this.displayErrors)
            })
        }
    }

    // show all holes in the current file
    showHoles() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                this.clearMessagePanel('Idris: Searching holes ...')

                const successHandler = (
                    metavariables: FinalReply.Metavariables,
                ) => {
                    debugger
                    this.clearMessagePanel('Idris: Holes')
                    const holesView = new HolesView()
                    holesView.initialize(metavariables)
                    this.messages.add(holesView)
                }

                return this.client
                    .loadFile(uri)
                    .then(() => this.client.metavariables(80))
                    .then(successHandler)
                    .catch(this.displayErrors)
            })
        }
    }

    /**
     * Replace a hole with a proof.
     */
    doProofSearch() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                const line = editor.getLastCursor().getBufferRow()
                const word = getWordUnderCursor(editor)
                this.clearMessagePanel('Idris: Searching proof ...')

                const successHandler = (reply: FinalReply.ProofSearch) => {
                    const res = reply.solution

                    this.hideAndClearMessagePanel()
                    if (res.startsWith('?')) {
                        // proof search returned a new hole
                        this.clearMessagePanel(
                            'Idris: Searching proof was not successful.',
                        )
                    } else {
                        editor.transact(() => {
                            // Move the cursor to the beginning of the word
                            editor.moveToBeginningOfWord()
                            // Because the ? in the Holes isn't part of
                            // the word, we move left once, and then select two
                            // words
                            editor.moveLeft()
                            editor.selectToEndOfWord()
                            editor.selectToEndOfWord()
                            // And then replace the replacement with the guess..
                            editor.insertText(res)
                        })
                    }
                }

                return this.client
                    .loadFile(uri)
                    .then(() => this.client.proofSearch(word, line + 1, []))
                    .then(successHandler)
                    .catch(this.displayErrors)
            })
        }
    }

    doBrowseNamespace() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                let nameSpace = editor.getSelectedText().trim()

                this.clearMessagePanel(
                    'Idris: Browsing namespace <tt>' + nameSpace + '</tt>',
                )

                const successHandler = (reply: FinalReply.BrowseNamespace) => {
                    if (reply.ok) {
                        const view = browseNamespaceView(reply)
                        this.messages.add(view)
                    } else {
                        this.clearMessagePanel(
                            'Idris: Browse Namespace was not successful.',
                        )
                    }
                }

                return this.client
                    .loadFile(uri)
                    .then(() => this.client.browseNamespace(nameSpace))
                    .then(successHandler)
                    .catch(this.displayErrors)
            })
        }
    }

    /**
     * get the definition of a function or type
     */
    printDefinition() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                const word = Symbol.serializeWord(getWordUnderCursor(editor))
                this.clearMessagePanel(
                    'Idris: Searching definition of <tt>' + word + '</tt> ...',
                )

                const successHandler = (reply: FinalReply.PrintDefinition) => {
                    if (reply.ok) {
                        this.clearMessagePanel(
                            'Idris: Definition of <tt>' + word + '</tt>',
                        )
                        const informationView = new InformationView()
                        informationView.initialize(
                            reply.definition,
                            reply.metadata,
                        )
                        this.messages.add(informationView)
                    } else {
                        this.clearMessagePanel(
                            'Idris: Error getting definition of <tt>' +
                                word +
                                '</tt>',
                        )
                    }
                }

                return this.client
                    .loadFile(uri)
                    .then(() => this.client.printDefinition(word))
                    .then(successHandler)
                    .catch(this.displayErrors)
            })
        }
    }

    /**
     * open the repl window
     */
    openREPL() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                this.clearMessagePanel('Idris: opening REPL ...')

                const successHandler = () => {
                    this.hideAndClearMessagePanel()
                    const options: WorkspaceOpenOptions = {
                        split: 'right',
                        searchAllPanes: true,
                    }
                    atom.workspace.open('idris://repl', options)
                }

                return this.client
                    .loadFile(uri)
                    .then(successHandler)
                    .catch(this.displayErrors)
            })
        }
    }

    /**
     * open the apropos window
     */
    apropos() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                this.clearMessagePanel('Idris: opening apropos view ...')
                const successHandler = () => {
                    this.hideAndClearMessagePanel()
                    const options: WorkspaceOpenOptions = {
                        split: 'right',
                        searchAllPanes: true,
                    }
                    return atom.workspace.open('idris://apropos', options)
                }
                return this.client
                    .loadFile(uri)
                    .then(successHandler)
                    .catch(this.displayErrors)
            })
        }
    }

    displayErrors(_e: any) {
        this.clearMessagePanel(
            '<i class="icon-bug"></i> There was a fatal error',
        )
    }

    // generic function to display errors in the status bar
    handleWarning(reply: InfoReply.Warning) {
        const { err } = reply
        const { warning, metadata, start, end, filename } = err

        this.clearMessagePanel('<i class="icon-bug"></i> Idris Errors')

        const highlighting = highlight(warning, metadata)
        const info = highlightToString(highlighting)

        // this provides information about the line and column of the error
        this.messages.add(
            new LineMessageView({
                message: info,
                character: start.column,
                line: start.line,
                file: filename,
            }),
        )

        const editor = atom.workspace.getActiveTextEditor()
        if (editor && start.line > 0 && filename === editor.getPath()) {
            const startPoint = { row: start.line - 1, column: start.column }
            const endPoint = { row: end.line - 1, column: end.column }

            const gutterMarker = this.createMarker(
                editor,
                [startPoint, endPoint],
                'line-number',
            )
            const lineMarker = this.createMarker(
                editor,
                [startPoint, startPoint],
                'line',
            )
            this.errorMarkers.push(gutterMarker)
            this.errorMarkers.push(lineMarker)
        }
    }
}
