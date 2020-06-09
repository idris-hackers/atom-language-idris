export const joinHtmlElements = function (
    containerElem: string,
    elems: Array<Node>,
) {
    const div = document.createElement(containerElem)
    elems.forEach((elem: any) => div.appendChild(elem))
    return div
}

export const createCodeElement = (): HTMLPreElement => {
    const pre = document.createElement('pre')
    const fontFamily = atom.config.get('language-idris.panelFontFamily')
    if (fontFamily !== '') {
        pre.style.fontFamily = fontFamily
    }
    const fontSize = atom.config.get('language-idris.panelFontSize')
    pre.style.fontSize = `${fontSize}px`
    const enableLigatures = atom.config.get('language-idris.panelFontLigatures')
    if (enableLigatures) {
        pre.style.fontFeatureSettings = '"liga"'
    }
    return pre
}

export const fontOptions = () => {
    const fontSize = atom.config.get('language-idris.panelFontSize')
    const fontSizeAttr = `${fontSize}px`
    const enableLigatures = atom.config.get('language-idris.panelFontLigatures')
    const webkitFontFeatureSettings = enableLigatures ? '"liga"' : '"inherit"'

    const fontFamily = atom.config.get('language-idris.panelFontFamily')
    if (fontFamily !== '') {
        fontFamily
    } else {
        '"inherit"'
    }

    return {
        'font-size': fontSizeAttr,
        '-webkit-font-feature-settings': webkitFontFeatureSettings,
        'font-family': fontFamily,
    }
}
