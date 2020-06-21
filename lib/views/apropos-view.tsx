import * as Preact from 'preact'
import { useState, StateUpdater } from 'preact/hooks'
import * as highlighter from '../utils/highlighter'
import * as Rx from 'rx-lite'
import { fontOptions } from '../utils/dom'
import { IdrisController } from '../idris-controller'
import { IdrisModel } from '../idris-model'
import { HighlightInformation } from '../utils/highlighter'

const styles = fontOptions()

const ask = (
    model: IdrisModel,
    question: string,
    setAnswer: StateUpdater<Array<HighlightInformation>>,
) => {
    model
        .apropos(question)
        .map((e: any): {
            code: string
            highlightInfo: Array<[number, number, Array<any>]>
        } => ({
            code: e.msg[0],
            highlightInfo: e.msg[1],
        }))
        .catch((e: any) =>
            Rx.Observable.just({
                code: e.message,
                highlightInfo: e.highlightInformation,
            }),
        )
        .subscribe(
            ({ code, highlightInfo }) => {
                const answer = highlighter.highlight(code, highlightInfo)
                setAnswer(answer)
            },
            (err) =>
                setAnswer([
                    { word: err.message, classes: [], description: '' },
                ]),
        )
}

type AnswerProps = { highlightInfo: Array<HighlightInformation> }

const Answer: Preact.FunctionComponent<AnswerProps> = (props) => {
    const { highlightInfo } = props
    return (
        <pre className="idris-apropos-output" style={styles}>
            {highlighter.highlightToPreact(highlightInfo)}
        </pre>
    )
}

type AproposProps = { model: IdrisModel }

const Apropos: Preact.FunctionComponent<AproposProps> = (props) => {
    const { model } = props
    const [input, setInput] = useState<string>('')
    const [answer, setAnswer] = useState<Array<HighlightInformation>>([])

    return (
        <div className="idris-panel-view">
            <input
                type="text"
                className="native-key-bindings idris-repl-input-field"
                onInput={(e) => {
                    setInput(e.currentTarget.value)
                }}
                onKeyPress={(e) => {
                    if (e.keyCode === 13) {
                        ask(model, input, setAnswer)
                    }
                }}
            >
                {input}
            </input>
            <div className="idris-repl-lines">
                <Answer highlightInfo={answer} />
            </div>
        </div>
    )
}

export class AproposView {
    0: HTMLDivElement = document.createElement('div')

    constructor(params: { controller: IdrisController }) {
        const hostElement = this[0]

        const { model } = params.controller

        Preact.render(<Apropos model={model} />, hostElement)
    }
}
