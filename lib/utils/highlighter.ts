import * as Preact from 'preact'
import Logger from './Logger'

export type HighlightInformation = {
    classes: Array<string>
    word: string
    description: string
}

const highlightInfoListToOb = (list: Array<any>) => {
    const obj: { [key: string]: any } = {}
    for (let x of list) {
        const key = x[0].slice(1)
        const value = x[1]
        obj[key] = value
    }
    return obj
}

// Use the right CSS classes, so that we can use the
// syntax highlighting built into atom.
const decorToClasses = (decor: string) => {
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
            Logger.logText('unknown decor: ' + decor)
            Logger.logText(
                'you may want to review the highlighter.coffee script',
            )
            return []
    }
}

const highlightWord = (word: string, info: any): HighlightInformation => {
    const type = info.info.type || ''
    const doc = info.info['doc-overview'] || ''

    const description = info.info.type != null ? `${type}\n\n${doc}`.trim() : ''

    return {
        classes: decorToClasses(info.info.decor).concat('syntax--idris'),
        word,
        description,
    }
}

// Build highlighting information that we can then pass to one
// of our serializers.
export const highlight = (
    code: string,
    highlightingInfo: Array<[number, number, Array<any>]>,
): Array<HighlightInformation> => {
    const highlighted = highlightingInfo
        .map(function ([start, length, info]) {
            return {
                start,
                length,
                info: highlightInfoListToOb(info),
            }
        })
        .filter((i) => i.info.decor != null)
        .reduce<[number, Array<HighlightInformation>]>(
            ([position, text], info) => {
                const newPosition = info.start + info.length
                const unhighlightedText: HighlightInformation = {
                    classes: [],
                    word: code.slice(position, info.start),
                    description: '',
                }
                const highlightedWord = highlightWord(
                    code.slice(info.start, newPosition),
                    info,
                )
                const newText = text.concat(unhighlightedText, highlightedWord)

                return [newPosition, newText]
            },
            [0, []],
        )

    const [position, text] = highlighted
    const rest = {
        classes: [],
        word: code.slice(position),
        description: '',
    }
    const higlightedWords = text.concat(rest)
    return higlightedWords.filter(
        (higlightedWord: any) => higlightedWord.word !== '',
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
            classes.forEach((c: any) => span.classList.add(c))
            span.textContent = word
            return span
        }
    })
    const container = document.createElement('span')
    spans.forEach((span: any) => container.appendChild(span))
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
