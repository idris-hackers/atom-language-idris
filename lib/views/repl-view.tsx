import * as Preact from 'preact'
import { useState, StateUpdater } from 'preact/hooks'
import { HighlightInformation } from '../utils/highlighter'
import * as highlighter from '../utils/highlighter'
import { fontOptions } from '../utils/dom'
import { IdrisController } from '../idris-controller'
import { IdrisClient, FinalReply } from 'idris-ide-client'

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
    client: IdrisClient,
    question: string,
    lines: Array<ReplLine>,
    setLines: StateUpdater<Array<ReplLine>>,
) => {
    const escapedLine = question.replace(/"/g, '\\"')
    client
        .interpret(escapedLine)
        .then(
            (reply: FinalReply.Interpret): ReplLine => {
                if ('ok' in reply) {
                    return {
                        type: 'success',
                        question,
                        answer: highlighter.highlight(
                            reply.ok.result,
                            reply.ok.metadata,
                        ),
                    }
                } else
                    return {
                        type: 'error',
                        question,
                        answer: highlighter.highlight(
                            reply.err.message,
                            reply.err.metadata,
                        ),
                    }
            },
        )
        .then((answer) => setLines(lines.concat([answer])))
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

type ReplProps = { client: IdrisClient }

const Repl: Preact.FunctionComponent<ReplProps> = (props) => {
    const { client } = props

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
                        ask(client, input, lines, setLines)
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

    constructor(params: { controller: IdrisController }) {
        const hostElement = this[0]

        const { client } = params.controller

        Preact.render(<Repl client={client} />, hostElement)
    }
}
