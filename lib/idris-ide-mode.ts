import Logger from './utils/Logger'
import * as sexpFormatter from './protocol/sexp-formatter'
import { EventEmitter } from 'events'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { SExp } from './protocol/ide-protocol'
import { listP } from './protocol/parser'
import { CompilerOptions } from './utils/ipkg'

export class IdrisIdeMode extends EventEmitter {
    process: ChildProcessWithoutNullStreams | null = null
    buffer = ''
    idrisBuffers = 0

    start(compilerOptions: CompilerOptions) {
        if (this.process == null || this.process.killed) {
            const pathToIdris: string = atom.config.get(
                'language-idris.pathToIdris',
            )
            const pkgs: Array<string> = (() => {
                if (compilerOptions.pkgs && compilerOptions.pkgs.length) {
                    const p = compilerOptions.pkgs.map((p) => ['-p', p]) as any
                    return [].concat.apply([], p)
                } else {
                    return []
                }
            })()

            let ipkgOptions = compilerOptions.options
                ? compilerOptions.options.split(' ')
                : []

            const tabLength = atom.config.get('editor.tabLength', {
                scope: ['source.idris'],
            })
            const configParams = [
                '--ide-mode',
                '--indent-with=' + tabLength,
                '--indent-clause=' + tabLength,
            ]

            const parameters = configParams.concat(pkgs, ipkgOptions)

            const options = compilerOptions.src
                ? { cwd: compilerOptions.src }
                : {}
            this.process = spawn(pathToIdris, parameters, options)
            this.process.on('error', this.error)
            this.process.on('exit', this.exited)
            this.process.on('close', this.exited)
            this.process.on('disconnect', this.exited)

            return this.process.stdout
                .setEncoding('utf8')
                .on('data', this.stdout.bind(this))
        }
    }

    send(cmd: SExp): void {
        if (this.process) {
            Logger.logOutgoingCommand(cmd)
            const serializedCommand = sexpFormatter.serialize(cmd)
            console.log('serializedCommand', serializedCommand)
            this.process.stdin.write(serializedCommand)
        } else {
            Logger.logText('Could not send command to the idris compiler')
            Logger.logOutgoingCommand(cmd)
        }
    }

    stop() {
        return this.process != null ? this.process.kill() : undefined
    }

    error(error: any) {
        const e =
            error.code === 'ENOENT'
                ? {
                      short: "Couldn't find idris executable",
                      long: `Couldn't find idris executable at \"${error.path}\"`,
                  }
                : {
                      short: error.code,
                      long: error.message,
                  }

        return atom.notifications.addError(e.short, { detail: e.long })
    }

    exited(code: number, signal: NodeJS.Signals) {
        let long, short
        if (signal === 'SIGTERM') {
            short = 'The idris compiler was closed'
            long = 'You stopped the compiler'
            return atom.notifications.addInfo(short, { detail: long })
        } else {
            short = 'The idris compiler was closed or crashed'
            long = signal
                ? `It was closed with the signal: ${signal}`
                : `It (probably) crashed with the error code: ${code}`
            return atom.notifications.addError(short, { detail: long })
        }
    }

    running(): boolean {
        return !!this.process && !this.process.killed
    }

    stdout(data: string): Array<boolean> {
        this.buffer += data
        const result = []
        while (this.buffer.length > 6) {
            this.buffer = this.buffer.trimLeft().replace(/\r\n/g, '\n')
            // We have 6 chars, which is the length of the command
            const len = parseInt(this.buffer.substr(0, 6), 16)
            if (this.buffer.length >= 6 + len) {
                // We also have the length of the command in the buffer, so
                // let's read in the command
                const cmd = this.buffer.substr(6, len).trim()
                Logger.logIncomingCommand(cmd)
                // Remove the length + command from the buffer
                this.buffer = this.buffer.substr(6 + len)
                // And then we can try to parse to command..
                const typedCommand = listP.parse(cmd.trim())
                if (typedCommand.isOk) {
                    result.push(this.emit('message', typedCommand.value))
                }
            } else {
                // We didn't have the entire command, so let's break the
                // while-loop and wait for the next data-event
                break
            }
        }
        return result
    }
}
