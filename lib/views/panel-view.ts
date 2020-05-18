import { REPLView } from './repl-view'
import { AproposView } from './apropos-view'

export class IdrisPanel {
    panel: string = ''
    controller: any

    constructor(controller: any, panel: string) {
        this.controller = controller
        this.panel = panel
    }

    getTitle() {
        switch (this.panel) {
            case 'repl': {
                return 'Idris: REPL'
            }
            case 'apropos': {
                return 'Idris: Apropos'
            }
            default: {
                return 'Idris ?'
            }
        }
    }

    getViewClass() {
        switch (this.panel) {
            case 'repl': {
                return REPLView
            }
            case 'apropos': {
                return AproposView
            }
            default:
                return undefined
        }
    }

    getURI() {
        switch (this.panel) {
            case 'repl': {
                return 'idris://repl'
            }
            case 'apropos': {
                return 'idris://apropos'
            }
        }
    }
}
