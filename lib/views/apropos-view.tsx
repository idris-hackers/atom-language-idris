import * as Preact from 'preact'
import { useState, StateUpdater } from 'preact/hooks'
import * as highlighter from '../utils/highlighter'
import { fontOptions } from '../utils/dom'
import { IdrisController } from '../idris-controller'
import { HighlightInformation } from '../utils/highlighter'
import { IdrisClient, FinalReply } from 'idris-ide-client'

const styles = fontOptions()

const ask = (
    client: IdrisClient,
    question: string,
    setAnswer: StateUpdater<Array<HighlightInformation>>,
) => {
    client.apropos(question).then((reply: FinalReply.Apropos) => {
        if ('ok' in reply) {
            setAnswer(highlighter.highlight(reply.ok.docs, reply.ok.metadata))
        } else {
            setAnswer(highlighter.highlight(reply.err, []))
        }
    })
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

type AproposProps = { client: IdrisClient }

const Apropos: Preact.FunctionComponent<AproposProps> = (props) => {
    const { client } = props
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
                        ask(client, input, setAnswer)
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

        const { client } = params.controller

        Preact.render(<Apropos client={client} />, hostElement)
    }
}
