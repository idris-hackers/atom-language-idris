import { appendFile } from 'fs'
import * as sexpFormatter from '../protocol/sexp-formatter'
import { SExp } from '../protocol/ide-protocol'

type LogOutput =
    | { type: 'none' }
    | { type: 'console' }
    | { type: 'file'; path: string }

class Logger {
    logOutput: LogOutput = { type: 'none' }

    logText(str: string): void {
        switch (this.logOutput.type) {
            case 'none': {
                return
            }
            case 'console': {
                console.log(str)
                return
            }
            case 'file': {
                appendFile(this.logOutput.path, str, (err) => {
                    if (err) {
                        throw err
                    }
                })
                return
            }
        }
    }

    logObject(description: string, obj: object): void {
        switch (this.logOutput.type) {
            case 'none': {
                return
            }
            case 'console': {
                console.log(description, obj)
                return
            }
            case 'file': {
                const output = `=====\n${description}:\n\n${JSON.stringify(
                    obj,
                    undefined,
                    4,
                )}`
                appendFile(this.logOutput.path, output, (err) => {
                    if (err) {
                        throw err
                    }
                })
                return
            }
        }
    }

    formatCommand(cmd: SExp): string {
        return sexpFormatter.serialize(cmd)
    }

    logIncomingCommand(str: string): void {
        this.logText(`< ${str}\n`)
    }

    logOutgoingCommand(cmd: any): void {
        const str = this.formatCommand(cmd)
        this.logText(`> ${str}`)
    }
}

export default new Logger()
