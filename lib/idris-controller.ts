import {
    MessagePanelView,
    PlainMessageView,
    LineMessageView,
} from 'atom-message-panel'
import { InformationView } from './views/information-view'
import { HolesView } from './views/holes-view'
import Logger from './utils/Logger'
import { IdrisModel } from './idris-model'
import * as Ipkg from './utils/ipkg'
import * as Symbol from './utils/symbol'
import { getWordUnderCursor, moveToNextEmptyLine } from './utils/editor'
import * as highlighter from './utils/highlighter'
import {
    TextEditor,
    RangeCompatible,
    DisplayMarker,
    Pane,
    WorkspaceOpenOptions,
} from 'atom'
import { windowsToWsl } from 'wsl-path'

export class IdrisController {
    errorMarkers: Array<DisplayMarker> = []
    model: IdrisModel = new IdrisModel(windowsToWsl)
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
    prefixLiterateClause(clause: Array<string>): Array<string> {
        const birdPattern = new RegExp(`^\
>\
(\\s)+\
`)

        if (this.isLiterateGrammar()) {
            return Array.from(clause).map((line: string) =>
                line.match(birdPattern) ? line : '> ' + line,
            )
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
        if (this.model) {
            Logger.logText('Idris: Shutting down!')
            this.model.stop()
        }
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

    initialize(compilerOptions: Ipkg.CompilerOptions): void {
        this.destroyMarkers()
        this.messages.attach()
        this.messages.hide()
        this.model.setCompilerOptions(compilerOptions)
    }

    /**
     * Get the currently active text editor.
     */
    getEditor(): TextEditor | undefined {
        return atom.workspace.getActiveTextEditor()
    }

    insertNewlineWithoutAutoIndent(editor: TextEditor): void {
        editor.insertText('\n', { autoIndentNewline: false })
    }

    getPane(): Pane {
        return atom.workspace.getActivePane()
    }

    stopCompiler(): boolean | undefined {
        return this.model != null ? this.model.stop() : undefined
    }

    runCommand(command: (args: any) => void) {
        return (args: any) => {
            const compilerOptions = Ipkg.compilerOptions(atom.project)
            return compilerOptions.subscribe((options: any) => {
                Logger.logObject('Compiler Options:', options)
                this.initialize(options)
                return command(args)
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
                    return Ipkg.compilerOptions(atom.project)
                        .flatMap((options: any) => {
                            this.initialize(options)
                            return this.model.replCompletions(trimmedPrefix)
                        })
                        .toPromise()
                        .then(({ msg }: any) =>
                            Array.from(msg[0][0]).map((sug) => ({
                                type: 'function',
                                text: sug,
                            })),
                        )
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

                const successHandler = () => {
                    return this.clearMessagePanel(
                        'Idris: File loaded successfully',
                    )
                }

                return this.model
                    .load(uri)
                    .filter(
                        ({ responseType }: any) => responseType === 'return',
                    )
                    .subscribe(successHandler, this.displayErrors)
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

                const successHandler = ({ msg }: any) => {
                    const [type, highlightingInfo] = Array.from(msg)
                    this.clearMessagePanel(
                        'Idris: Docs for <tt>' + word + '</tt>',
                    )

                    const informationView = new InformationView()
                    informationView.initialize({
                        obligation: type,
                        highlightingInfo,
                    })
                    return this.messages.add(informationView)
                }

                return this.model
                    .load(uri)
                    .filter(
                        ({ responseType }: any) => responseType === 'return',
                    )
                    .flatMap(() => this.model.docsFor(word))
                    .catch(() => this.model.docsFor(word))
                    .subscribe(successHandler, this.displayErrors)
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
                const successHandler = ({ msg }: any): void => {
                    const [type, highlightingInfo] = msg
                    this.clearMessagePanel(
                        'Idris: Type of <tt>' + word + '</tt>',
                    )
                    const informationView = new InformationView()
                    informationView.initialize({
                        obligation: type,
                        highlightingInfo,
                    })
                    this.messages.add(informationView)
                }
                return this.model
                    .load(uri)
                    .filter((response: any) => {
                        return response.responseType === 'return'
                    })
                    .flatMap(() => this.model.getType(word))
                    .subscribe(successHandler, this.displayErrors)
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

                const successHandler = ({ msg }: any) => {
                    const [split] = msg
                    if (split === '') {
                        // split returned nothing - cannot split
                        return this.clearMessagePanel(
                            'Idris: Cannot split ' + word,
                        )
                    } else {
                        this.hideAndClearMessagePanel()
                        const lineRange = cursor.getCurrentLineBufferRange({
                            includeNewline: true,
                        })
                        return editor.setTextInBufferRange(lineRange, split)
                    }
                }

                return this.model
                    .load(uri)
                    .filter(
                        ({ responseType }: any) => responseType === 'return',
                    )
                    .flatMap(() => this.model.caseSplit(line + 1, word))
                    .subscribe(successHandler, this.displayErrors)
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
                // by adding a clause we make sure that the word is
                // not treated as a symbol
                const word = getWordUnderCursor(editor)

                this.clearMessagePanel('Idris: Add clause ...')

                const successHandler = ({ msg }: any) => {
                    const [clause] = this.prefixLiterateClause(msg)

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

                return this.model
                    .load(uri)
                    .filter(
                        ({ responseType }: any) => responseType === 'return',
                    )
                    .flatMap(() => this.model.addClause(line + 1, word))
                    .subscribe(successHandler, this.displayErrors)
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

                const successHandler = ({ msg }: any) => {
                    const [clause] = this.prefixLiterateClause(msg)

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

                return this.model
                    .load(uri)
                    .filter(
                        ({ responseType }: any) => responseType === 'return',
                    )
                    .flatMap(() => this.model.addProofClause(line + 1, word))
                    .subscribe(successHandler, this.displayErrors)
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

                const successHandler = ({ msg }: any) => {
                    const [clause] = Array.from(this.prefixLiterateClause(msg))

                    this.hideAndClearMessagePanel()

                    return editor.transact(() => {
                        // Delete old line, insert the new with block
                        editor.deleteLine()
                        editor.moveToBeginningOfLine()
                        editor.insertText(clause)
                        this.insertNewlineWithoutAutoIndent(editor)
                        // And move the cursor to the beginning of
                        // the new line
                        editor.moveToBeginningOfLine()
                        editor.moveUp(2)
                    })
                }

                if (word != null ? word.length : undefined) {
                    return this.model
                        .load(uri)
                        .filter(
                            ({ responseType }: any) =>
                                responseType === 'return',
                        )
                        .flatMap(() => this.model.makeWith(line + 1, word))
                        .subscribe(successHandler, this.displayErrors)
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

                const successHandler = ({ msg }: any) => {
                    // param1 contains the code which replaces the hole
                    // param2 contains the code for the lemma function
                    let [lemty, param1, param2] = msg
                    param2 = this.prefixLiterateClause(param2)

                    this.hideAndClearMessagePanel()

                    return editor.transact(function () {
                        if (lemty === ':metavariable-lemma') {
                            // Move the cursor to the beginning of the word
                            editor.moveToBeginningOfWord()
                            // Because the ? in the Holes isn't part of
                            // the word, we move left once, and then select two
                            // words
                            editor.moveLeft()
                            editor.selectToEndOfWord()
                            editor.selectToEndOfWord()
                            // And then replace the replacement with the lemma call..
                            editor.insertText(param1[1])

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
                            editor.insertText(param2[1])
                            return editor.insertNewlineBelow()
                        }
                    })
                }

                return this.model
                    .load(uri)
                    .filter(
                        ({ responseType }: any) => responseType === 'return',
                    )
                    .flatMap(() => this.model.makeLemma(line + 1, word))
                    .subscribe(successHandler, this.displayErrors)
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

                const successHandler = ({ msg }: any) => {
                    const [clause] = Array.from(this.prefixLiterateClause(msg))

                    this.hideAndClearMessagePanel()

                    return editor.transact(() => {
                        // Delete old line, insert the new case block
                        editor.moveToBeginningOfLine()
                        editor.deleteLine()
                        editor.insertText(clause)
                        this.insertNewlineWithoutAutoIndent(editor)
                        // And move the cursor to the beginning of
                        // the new line
                        editor.moveToBeginningOfLine()
                        editor.moveUp(2)
                    })
                }

                return this.model
                    .load(uri)
                    .filter(
                        ({ responseType }: any) => responseType === 'return',
                    )
                    .flatMap(() => this.model.makeCase(line + 1, word))
                    .subscribe(successHandler, this.displayErrors)
            })
        }
    }

    // show all holes in the current file
    showHoles() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                this.clearMessagePanel('Idris: Searching holes ...')

                const successHandler = ({ msg }: any) => {
                    const [holes] = msg
                    this.clearMessagePanel('Idris: Holes')
                    const holesView = new HolesView()
                    holesView.initialize(holes)
                    this.messages.add(holesView)
                }

                return this.model
                    .load(uri)
                    .filter(
                        ({ responseType }: any) => responseType === 'return',
                    )
                    .flatMap(() => this.model.holes(80))
                    .subscribe(successHandler, this.displayErrors)
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

                const successHandler = ({ msg }: any) => {
                    const [res] = msg

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

                return this.model
                    .load(uri)
                    .filter(
                        ({ responseType }: any) => responseType === 'return',
                    )
                    .flatMap(() => this.model.proofSearch(line + 1, word))
                    .subscribe(successHandler, this.displayErrors)
            })
        }
    }

    doBrowseNamespace() {
        const editor = this.getEditor()
        if (editor) {
            return this.saveFile(editor).then((uri) => {
                let nameSpace = editor.getSelectedText()

                this.clearMessagePanel(
                    'Idris: Browsing namespace <tt>' + nameSpace + '</tt>',
                )

                const successHandler = ({ msg }: any) => {
                    // the information is in a two dimensional array
                    // one array contains the namespaces contained in the namespace
                    // and the seconds all the methods
                    const namesSpaceInformation = msg[0][0]
                    for (nameSpace of namesSpaceInformation) {
                        this.rawMessage(nameSpace)
                    }

                    const methodInformation = msg[0][1]
                    return (() => {
                        const result = []
                        for (let [
                            line,
                            highlightInformation,
                        ] of methodInformation) {
                            const highlighting = highlighter.highlight(
                                line,
                                highlightInformation,
                            )
                            const info = highlighter.highlightToString(
                                highlighting,
                            )
                            result.push(this.rawMessage(info))
                        }
                        return result
                    })()
                }

                return this.model
                    .load(uri)
                    .filter(
                        ({ responseType }: any) => responseType === 'return',
                    )
                    .flatMap(() => this.model.browseNamespace(nameSpace))
                    .subscribe(successHandler, this.displayErrors)
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

                const successHandler = ({ msg }: any) => {
                    const [type, highlightingInfo] = Array.from(msg)
                    this.clearMessagePanel(
                        'Idris: Definition of <tt>' + word + '</tt>',
                    )
                    const informationView = new InformationView()
                    informationView.initialize({
                        obligation: type,
                        highlightingInfo,
                    })
                    return this.messages.add(informationView)
                }

                return this.model
                    .load(uri)
                    .filter(
                        ({ responseType }: any) => responseType === 'return',
                    )
                    .flatMap(() => this.model.printDefinition(word))
                    .catch(() => this.model.printDefinition(word))
                    .subscribe(successHandler, this.displayErrors)
            })
        }
    }

    /**
     * open the repl window
     */
    openREPL() {
        const editor = this.getEditor()
        if (editor) {
            const uri = editor.getPath() as any
            this.clearMessagePanel('Idris: opening REPL ...')

            const successHandler = () => {
                this.hideAndClearMessagePanel()

                const options: WorkspaceOpenOptions = {
                    split: 'right',
                    searchAllPanes: true,
                }

                atom.workspace.open('idris://repl', options)
            }

            return this.model
                .load(uri)
                .filter(({ responseType }: any) => responseType === 'return')
                .subscribe(successHandler, this.displayErrors)
        }
    }

    /**
     * open the apropos window
     */
    apropos() {
        const editor = this.getEditor()
        if (editor) {
            const uri = editor.getPath() as any
            this.clearMessagePanel('Idris: opening apropos view ...')

            const successHandler = () => {
                this.hideAndClearMessagePanel()

                const options: WorkspaceOpenOptions = {
                    split: 'right',
                    searchAllPanes: true,
                }

                return atom.workspace.open('idris://apropos', options)
            }

            return this.model
                .load(uri)
                .filter(({ responseType }: any) => responseType === 'return')
                .subscribe(successHandler, this.displayErrors)
        }
    }

    // generic function to display errors in the status bar
    displayErrors(err: any) {
        this.clearMessagePanel('<i class="icon-bug"></i> Idris Errors')

        // display the general error message
        if (err.message != null) {
            this.rawMessage(err.message)
        }

        return (() => {
            const result = []
            for (let warning of err.warnings) {
                const type = warning[3]
                const highlightingInfo = warning[4]
                const highlighting = highlighter.highlight(
                    type,
                    highlightingInfo,
                )
                const info = highlighter.highlightToString(highlighting)

                const line = warning[1][0]
                const character = warning[1][1]
                const uri = warning[0].replace('./', err.cwd + '/')

                // this provides information about the line and column of the error
                this.messages.add(
                    new LineMessageView({
                        line,
                        character,
                        file: uri,
                    }),
                )

                // this provides a highlighted version of the error message
                // returned by idris
                this.rawMessage(info)

                const editor = atom.workspace.getActiveTextEditor()
                if (editor && line > 0 && uri === editor.getPath()) {
                    const startPoint = warning[1]
                    startPoint[0] = startPoint[0] - 1
                    const endPoint = warning[2]
                    endPoint[0] = endPoint[0] - 1
                    const gutterMarker = this.createMarker(
                        editor,
                        [startPoint, endPoint],
                        'line-number',
                    )
                    const lineMarker = this.createMarker(
                        editor,
                        [
                            [line - 1, character - 1],
                            [line, 0],
                        ],
                        'line',
                    )
                    this.errorMarkers.push(gutterMarker)
                    result.push(this.errorMarkers.push(lineMarker))
                } else {
                    result.push(undefined)
                }
            }
            return result
        })()
    }
}
