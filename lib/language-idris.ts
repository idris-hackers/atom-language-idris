import { IdrisController } from './idris-controller'
import { CompositeDisposable } from 'atom'
import * as url from 'url'
import { IdrisPanel } from './views/panel-view'

let controller: IdrisController | null = null
let subscriptions = new CompositeDisposable()

export function activate() {
    controller = new IdrisController()

    const subscription = atom.commands.add(
        'atom-text-editor[data-grammar~="idris"]',
        controller.getCommands(),
    )
    subscriptions = new CompositeDisposable()
    subscriptions.add(subscription)

    atom.workspace.addOpener((uriToOpen: string) => {
        try {
            const { protocol, host } = url.parse(uriToOpen)
            if (protocol === 'idris:') {
                return new IdrisPanel(controller, host || '')
            }
        } catch (error) {
            return
        }
    })
}

export const deactivate = () => {
    subscriptions.dispose()
    if (controller) {
        controller.destroy()
    }
}

export const provide = () => {
    if (controller) {
        controller.provideReplCompletions()
    }
}
