import Cycle from '@cycle/core'
import * as CycleDOM from '@cycle/dom'
import * as highlighter from '../utils/highlighter'
import * as Rx from 'rx-lite'
import { fontOptions } from '../utils/dom'

const styles = fontOptions()

var AproposCycle = {
    // highlight : forall a.
    //   { code : String, highlightInformation : HighlightInformation } ->
    //   CycleDOM
    highlight({ code, highlightInformation }: any) {
        const highlights = highlighter.highlight(code, highlightInformation)
        return highlighter.highlightToCycle(highlights)
    },

    // view : Observable State -> Observable CycleDOM
    view(state$: any) {
        return state$.map(function (apropos: any) {
            const aproposAnswer = (() => {
                if (apropos.code) {
                    const highlightedCode = AproposCycle.highlight(apropos)
                    return CycleDOM.h(
                        'pre',
                        { className: 'idris-apropos-output', style: styles },
                        highlightedCode,
                    )
                } else {
                    return CycleDOM.h('span', '')
                }
            })()

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
                    CycleDOM.h(
                        'div',
                        { className: 'idris-repl-lines' },
                        aproposAnswer,
                    ),
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
            DOM: AproposCycle.view(responses.CONTENT),
            CONTENT: input,
        }
    },

    // driver : forall a.
    //   IdrisModel -> Observable String ->
    //   Observable (List { a | code : String, highlightInformation : highlightInformation })
    driver(options: any) {
        return {
            DOM: CycleDOM.makeDOMDriver(options.hostElement),
            CONTENT(inp: any) {
                return inp
                    .filter((line: any) => line !== '')
                    .flatMap((line: any) => {
                        const escapedLine = line.replace(/"/g, '\\"')
                        return options.model
                            .apropos(escapedLine)
                            .map((e: any) => ({
                                code: e.msg[0],
                                highlightInformation: e.msg[1],
                            }))
                            .catch((e: any) =>
                                Rx.Observable.just({
                                    code: e.message,
                                    highlightInformation:
                                        e.highlightInformation,
                                }),
                            )
                    })
                    .startWith({})
            },
        }
    },
}

export class AproposView {
    0: HTMLDivElement = document.createElement('div')

    constructor(params: any) {
        const hostElement = this[0]

        const { model } = params.controller

        const drivers = AproposCycle.driver({
            hostElement,
            model,
        })

        Cycle.run(AproposCycle.main, drivers)
    }
}
