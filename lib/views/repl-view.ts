const Cycle = require('@cycle/core')
const CycleDOM = require('@cycle/dom')
const highlighter = require('../utils/highlighter')
const Rx = require('rx-lite')
const { fontOptions } = require('../utils/dom')

const styles = fontOptions()

// highlight : forall a.
//   { code : String, highlightInformation : HighlightInformation } ->
//   CycleDOM
const highlight = function ({ code, highlightInformation }: any) {
    if (highlightInformation) {
        const highlights = highlighter.highlight(code, highlightInformation)
        return highlighter.highlightToCycle(highlights)
    } else {
        return code
    }
}

const displaySuccess = function (line: any) {
    const highlightedCode = highlight(line)

    return CycleDOM.h(
        'pre',
        {
            className: 'idris-repl-output',
            style: styles,
        },
        [highlightedCode],
    )
}

const displayError = function (line: any) {
    const highlightedCode = highlight(line)

    return CycleDOM.h('pre', {}, highlightedCode)
}

var REPLCycle = {
    // view : Observable State -> Observable CycleDOM
    view(state$: Array<Array<any>>) {
        return state$.map(function (lines) {
            lines = lines.map(function (line) {
                const answer =
                    line.type === 'success'
                        ? displaySuccess(line)
                        : displayError(line)

                return CycleDOM.h(
                    'div',
                    {
                        className: 'idris-repl-line',
                        style: styles,
                    },
                    [
                        CycleDOM.h('div', { className: 'idris-repl-input' }, [
                            CycleDOM.h(
                                'span',
                                { className: 'idris-repl-input-prompt' },
                                '> ',
                            ),
                            line.input,
                        ]),
                        answer,
                    ],
                )
            })

            return CycleDOM.h(
                'div',
                {
                    className: 'idris-panel-view',
                },
                [
                    CycleDOM.h(
                        'input',
                        {
                            type: 'text',
                            className:
                                'native-key-bindings idris-repl-input-field',
                        },
                        '',
                    ),
                    CycleDOM.h('div', { className: 'idris-repl-lines' }, lines),
                ],
            )
        })
    },

    main(responses: any) {
        const input = responses.DOM.select('input')
            .events('keydown')
            .filter((ev: any) => ev.keyCode === 13)
            .map((ev: any) => ev.target.value)
            .startWith('')

        return {
            DOM: REPLCycle.view(responses.CONTENT),
            CONTENT: input,
        }
    },

    driver(options: any) {
        return {
            DOM: CycleDOM.makeDOMDriver(options.hostElement),
            CONTENT(inp: any) {
                return inp
                    .filter((line: any) => line !== '')
                    .flatMap((line: any) => {
                        const escapedLine = line.replace(/"/g, '\\"')
                        // append a space to trick the formatter, so that it wont turn
                        // the input into a symbol
                        return options.model
                            .interpret(`${escapedLine} `)
                            .map((e: any) => ({
                                type: 'success',
                                input: line,
                                code: e.msg[0],
                                highlightInformation: e.msg[1],
                            }))
                            .catch((e: any) =>
                                Rx.Observable.just({
                                    type: 'error',
                                    input: line,
                                    code: e.message,
                                    highlightInformation:
                                        e.highlightInformation,
                                    warnings: e.warnings,
                                }),
                            )
                    })
                    .scan((acc: any, x: any) => [x].concat(acc), [])
                    .startWith([])
            },
        }
    },
}

export class REPLView {
    0: HTMLDivElement = document.createElement('div')

    constructor(params: any) {
        const hostElement = this[0]

        const { model } = params.controller

        const drivers = REPLCycle.driver({
            hostElement,
            model,
        })

        Cycle.run(REPLCycle.main, drivers)
    }
}
