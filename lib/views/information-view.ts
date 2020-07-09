import * as highlighter from '../utils/highlighter'
import * as dom from '../utils/dom'
import { MessageMetadata } from 'idris-ide-client/build/reply'

export class InformationViewClass extends HTMLElement {
    initialize(content: string, metadata?: Array<MessageMetadata>) {
        this.classList.add('idris-panel')

        if (metadata != null) {
            const highlighting = highlighter.highlight(content, metadata)
            const info = highlighter.highlightToHtml(highlighting)
            const pre = dom.createCodeElement()
            pre.appendChild(info)
            return this.appendChild(pre)
        } else {
            return this.append(content)
        }
    }
}

export const InformationView = (document as any).registerElement(
    'idris-informations-view',
    { prototype: InformationViewClass.prototype },
)
