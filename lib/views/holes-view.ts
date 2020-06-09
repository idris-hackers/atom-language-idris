import * as highlighter from '../utils/highlighter'
import { createCodeElement, joinHtmlElements } from '../utils/dom'

const textNode = (text: string): Text => document.createTextNode(text)

export class HolesViewClass extends HTMLElement {
    holesContainer: HTMLPreElement | undefined

    initialize(holes: any): void {
        this.classList.add('idris-panel')
        this.holesContainer = createCodeElement()
        this.holesContainer.classList.add('idris-mode')
        this.holesContainer.classList.add('block')
        this.holesContainer.classList.add('idris-holes-view')

        this.appendChild(this.holesContainer)
        this.showHoles(holes)
    }

    showHoles(holes: any): void {
        this.holesContainer?.appendChild(this.prettyprintHoles(holes))
    }

    prettyprintHoles(holes: any) {
        const html = holes.map(
            ([name, premises, conclusion]: [string, any, any]) => {
                return this.prettyprintHole(name, premises, conclusion)
            },
        )
        return joinHtmlElements('div', html)
    }

    prettyprintHole(name: string, premises: any, conclusion: any) {
        const prettyPremises = this.prettyprintPremises(premises)
        const prettyConclusion: any = this.prettyprintConclusion(
            name,
            conclusion,
        )

        const hole = joinHtmlElements(
            'div',
            [textNode(`${name}`)].concat(prettyPremises, prettyConclusion),
        )
        hole.classList.add('idris')
        hole.classList.add('idris-hole')
        return hole
    }

    prettyprintPremises(premises: any) {
        const html = premises.map(
            ([name, type, highlightInformation]: [string, any, any]) => {
                const highlight = highlighter.highlight(
                    type,
                    highlightInformation,
                )
                type = highlighter.highlightToHtml(highlight)
                return joinHtmlElements(
                    'div',
                    [textNode(`    ${name} : `)].concat(type),
                )
            },
        )
        return joinHtmlElements('div', html)
    }

    prettyprintConclusion(name: string, [type, highlightInformation]: any) {
        const highlight = highlighter.highlight(type, highlightInformation)
        const highlightedConclusion = highlighter.highlightToHtml(highlight)
        const dividerLength = `${name} : ${type}`.length
        var divider = ''
        for (var i = 0; i < dividerLength; i++) {
            divider += '-'
        }

        return [
            textNode(divider),
            document.createElement('br'),
            textNode(`${name} : `),
            highlightedConclusion,
        ]
    }
}

export const HolesView = (document as any).registerElement('idris-holes-view', {
    prototype: HolesViewClass.prototype,
})
