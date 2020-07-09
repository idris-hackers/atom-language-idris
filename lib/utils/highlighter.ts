import * as Preact from 'preact'
import { MessageMetadata } from 'idris-ide-client/build/reply'
import { Decor } from 'idris-ide-client/build/s-exps'

export type HighlightInformation = {
    classes: Array<string>
    word: string
    description: string
}

// Use the right CSS classes, so that we can use the
// syntax highlighting built into atom.
const decorToClasses = (decor: Decor | undefined): Array<string> => {
    switch (decor) {
        case ':type':
            return ['syntax--storage', 'syntax--type']
        case ':function':
            return ['syntax--entity', 'syntax--name', 'syntax--function']
        case ':data':
            return ['syntax--constant']
        case ':keyword':
            return ['syntax--keyword']
        case ':bound':
            return ['syntax--support', 'syntax--function']
        case ':metavar':
            return ['syntax--constant']
        default:
            return []
    }
}

const highlightWord = (
    word: string,
    info: MessageMetadata,
): HighlightInformation => {
    const type = info.metadata.type || ''
    const doc = info.metadata.docOverview || ''

    const description = type != '' ? `${type}\n\n${doc}`.trim() : ''

    return {
        classes: decorToClasses(info.metadata.decor).concat('syntax--idris'),
        word,
        description,
    }
}

type Acc = {
    position: number
    text: Array<HighlightInformation>
}
const initialAcc: Acc = { position: 0, text: [] }

// Build highlighting information that we can then pass to one
// of our serializers.
export const highlight = (
    code: string,
    highlightingInfo: Array<MessageMetadata>,
): Array<HighlightInformation> => {
    const highlighted = highlightingInfo
        .filter((i) => i.metadata.decor != null)
        .reduce<Acc>(({ position, text }, info) => {
            const newPosition: number = info.start + info.length
            const unhighlightedText = {
                classes: [],
                word: code.slice(position, info.start),
                description: '',
            }
            const highlightedWord = highlightWord(
                code.slice(info.start, newPosition),
                info,
            )
            const newText = text.concat(unhighlightedText, highlightedWord)
            return { position: newPosition, text: newText }
        }, initialAcc)

    const { position, text } = highlighted
    const rest = {
        classes: [],
        word: code.slice(position),
        description: '',
    }
    const higlightedWords = text.concat(rest)
    return higlightedWords.filter(
        (higlightedWord) => higlightedWord.word !== '',
    )
}

// Applies the highlighting and returns the result as an html-string.
export const highlightToString = (highlights: Array<HighlightInformation>) =>
    highlights
        .map(function ({ classes, word }) {
            if (classes.length === 0) {
                return word
            } else {
                return `<span class=\"${classes.join(' ')}\">${word}</span>`
            }
        })
        .join('')

// Applies the highlighting and returns the result as a DOM-objects.
export const highlightToHtml = (highlights: Array<HighlightInformation>) => {
    const spans = highlights.map(function ({ classes, word }) {
        if (classes.length === 0) {
            return document.createTextNode(word)
        } else {
            const span = document.createElement('span')
            classes.forEach((c) => span.classList.add(c))
            span.textContent = word
            return span
        }
    })
    const container = document.createElement('span')
    spans.forEach((span) => container.appendChild(span))
    return container
}

export const highlightToPreact = (
    highlights: Array<HighlightInformation>,
): Preact.VNode => {
    const highlighted = highlights.map(({ classes, word, description }) => {
        if (classes.length === 0) {
            return word as string
        } else {
            return Preact.h(
                'span',
                { className: classes.join(' '), title: description },
                word,
            )
        }
    })
    return Preact.h('div', {}, highlighted)
}
