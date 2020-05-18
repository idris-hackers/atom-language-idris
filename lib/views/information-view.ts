import * as highlighter from '../utils/highlighter'
import * as dom from '../utils/dom'

export class InformationViewClass extends HTMLElement {
    obligation: any
    highlightingInfo: any
    text: any

    initialize(params: any) {
        this.classList.add('idris-panel')
        this.obligation = params.obligation
        this.highlightingInfo = params.highlightingInfo
        if (this.highlightingInfo != null) {
            const highlighting = highlighter.highlight(
                this.obligation,
                this.highlightingInfo,
            )
            const info = highlighter.highlightToHtml(highlighting)
            const pre = dom.createCodeElement()
            pre.appendChild(info)
            return this.appendChild(pre)
        } else {
            return this.text(this.obligation)
        }
    }
}

export const InformationView = (document as any).registerElement(
    'idris-informations-view',
    { prototype: InformationViewClass.prototype },
)
