import * as Preact from 'preact'
import { useState, StateUpdater } from 'preact/hooks'
import { IdrisModel } from '../idris-model'
import { HighlightInformation } from '../utils/highlighter'
import * as highlighter from '../utils/highlighter'
import * as Rx from 'rx-lite'
import { fontOptions } from '../utils/dom'

const styles = fontOptions()

type ReplLineSuccess = {
    type: 'success'
    question: string
    answer: Array<HighlightInformation>
}

type ReplLineError = {
    type: 'error'
    question: string
    answer: Array<HighlightInformation>
}

type ReplLine = ReplLineSuccess | ReplLineError

const ask = (
    model: IdrisModel,
    question: string,
    lines: Array<ReplLine>,
    setLines: StateUpdater<Array<ReplLine>>,
) => {
    const escapedLine = question.replace(/"/g, '\\"')
    // append a space to trick the formatter, so that it wont turn
    // the input into a symbol
    model
        .interpret(`${escapedLine} `)
        .map(
            (e: any): ReplLine => ({
                type: 'success',
                question,
                answer: highlighter.highlight(e.msg[0], e.msg[1]),
            }),
        )
        .catch((e: any): any => {
            const errorAnswer: ReplLineError = {
                type: 'error',
                question,
                answer: highlighter.highlight(
                    e.message,
                    e.highlightInformation,
                ),
            }
            const ob = Rx.Observable.just(errorAnswer)
            return ob
        })
        .subscribe(
            (answer: ReplLine) => {
                setLines(lines.concat([answer]))
            },
            (err) => console.log(err),
        )
}

const SuccessAnswer: Preact.FunctionComponent<{
    answer: Array<HighlightInformation>
}> = (props) => {
    const { answer } = props
    return (
        <pre className="idris-repl-output" style={styles}>
            {highlighter.highlightToPreact(answer)}
        </pre>
    )
}

const ErrorAnswer: Preact.FunctionComponent<{
    answer: Array<HighlightInformation>
}> = (props) => {
    const { answer } = props
    return <pre>{highlighter.highlightToPreact(answer)}</pre>
}

const Answer: Preact.FunctionComponent<Omit<ReplLine, 'question'>> = (
    props,
) => {
    const { type, answer } = props
    switch (type) {
        case 'success': {
            return <SuccessAnswer answer={answer} />
        }
        case 'error': {
            return <ErrorAnswer answer={answer} />
        }
    }
}

const Line: Preact.FunctionComponent<ReplLine> = (props) => {
    const { type, question, answer } = props
    return (
        <div className="idris-repl-line" style={styles}>
            <div className="idris-repl-input">
                <span className="idris-repl-input-prompt">&gt; {question}</span>
            </div>
            <Answer type={type} answer={answer} />
        </div>
    )
}

type ReplProps = { model: IdrisModel }

const Repl: Preact.FunctionComponent<ReplProps> = (props) => {
    const { model } = props

    const [input, setInput] = useState<string>('')
    const [lines, setLines] = useState<Array<ReplLine>>([])

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
                        ask(model, input, lines, setLines)
                    }
                }}
            ></input>
            <div className="idris-repl-lines">
                {lines.map((line, index) => (
                    <Line
                        key={index}
                        type={line.type}
                        question={line.question}
                        answer={line.answer}
                    />
                ))}
            </div>
        </div>
    )
}

export class REPLView {
    0: HTMLDivElement = document.createElement('div')

    constructor(params: any) {
        const hostElement = this[0]

        const { model } = params.controller

        Preact.render(<Repl model={model} />, hostElement)
    }
}
