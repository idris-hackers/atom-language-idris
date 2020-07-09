import { FinalReply } from 'idris-ide-client'
import * as highlighter from '../utils/highlighter'
import { createCodeElement, joinHtmlElements } from '../utils/dom'
import { MessageMetadata } from 'idris-ide-client/build/reply'

const textNode = (text: string): Text => document.createTextNode(text)

type Metavariable = {
    name: string
    type: string
    metadata: Array<MessageMetadata>
}

export class HolesViewClass extends HTMLElement {
    holesContainer: HTMLPreElement | undefined

    initialize(holes: FinalReply.Metavariables): void {
        this.classList.add('idris-panel')
        this.holesContainer = createCodeElement()
        this.holesContainer.classList.add('idris-mode')
        this.holesContainer.classList.add('block')
        this.holesContainer.classList.add('idris-holes-view')

        this.appendChild(this.holesContainer)
        this.showHoles(holes)
    }

    showHoles(holes: FinalReply.Metavariables): void {
        this.holesContainer?.appendChild(this.prettyprintHoles(holes))
    }

    prettyprintHoles(holes: FinalReply.Metavariables) {
        const html = holes.ok.map((metavariable) => {
            return this.prettyprintHole(
                metavariable.metavariable,
                metavariable.scope,
            )
        })
        return joinHtmlElements('div', html)
    }

    prettyprintHole(metavariable: Metavariable, premises: Array<Metavariable>) {
        const prettyPremises = this.prettyprintPremises(premises)
        const prettyConclusion = this.prettyprintConclusion(metavariable)

        const children: Array<HTMLElement | Text> = [
            textNode(`${name}`),
            prettyPremises,
            ...prettyConclusion,
        ]

        const hole = joinHtmlElements('div', children)
        hole.classList.add('idris')
        hole.classList.add('idris-hole')
        return hole
    }

    prettyprintPremises(premises: Array<Metavariable>) {
        const html = premises.map((premise) => {
            const highlight = highlighter.highlight(
                premise.type,
                premise.metadata,
            )
            const type = highlighter.highlightToHtml(highlight)
            return joinHtmlElements('div', [
                textNode(`    ${premise.name} : `),
                type,
            ])
        })
        return joinHtmlElements('div', html)
    }

    prettyprintConclusion(metavariable: Metavariable) {
        const highlight = highlighter.highlight(
            metavariable.type,
            metavariable.metadata,
        )
        const highlightedConclusion = highlighter.highlightToHtml(highlight)
        const dividerLength = `${metavariable.name} : ${metavariable.type}`
            .length
        var divider = ''
        for (var i = 0; i < dividerLength; i++) {
            divider += '-'
        }

        return [
            textNode(divider),
            document.createElement('br'),
            textNode(`${metavariable.name} : `),
            highlightedConclusion,
        ]
    }
}

export const HolesView = (document as any).registerElement('idris-holes-view', {
    prototype: HolesViewClass.prototype,
})
