import { TextEditor } from 'atom'

export const isCurrentLineEmpty = (editor: TextEditor): boolean => {
    // save the current buffer range, so that we can
    // reset the state in the end
    const bufferRange = editor.getSelectedBufferRange()

    editor.moveToBeginningOfLine()
    editor.selectToEndOfLine()
    const selectedText = editor.getSelectedText()

    // reset the selection to what it was before calling
    // this function
    editor.setSelectedBufferRange(bufferRange)

    return selectedText.trim() === ''
}

const isCurrentLineLastOfFile = (editor: TextEditor): boolean => {
    const currentRow = editor.getCursorBufferPosition().row
    const totalRows = editor.getLineCount()
    return currentRow === totalRows - 1
}

export const moveToNextEmptyLine = (editor: TextEditor): void => {
    while (!isCurrentLineEmpty(editor) && !isCurrentLineLastOfFile(editor)) {
        editor.moveDown()
    }

    if (!isCurrentLineEmpty(editor)) {
        editor.insertNewlineBelow()
    }

    editor.moveToBeginningOfLine()
}

// the REGEXP to define what constitutes a word
const options = {
    wordRegex: /(^[	 ]*$|[^\s\/\\\(\)":,\.;<>~!@#\$%\^&\*\|\+=\[\]\{\}`\?\-…]+)|(\?[-!#\$%&\*\+\.\/<=>@\\\^\|~:]+|[-!#\$%&\*\+\.\/<=>@\\\^\|~:][-!#\$%&\*\+\.\/<=>@\\\^\|~:\?]*)+/g,
}

// get the word or operator under the cursor
export const getWordUnderCursor = (editor: TextEditor): string => {
    const range = editor.getLastCursor().getCurrentWordBufferRange(options)
    return editor.getTextInBufferRange(range)
}
