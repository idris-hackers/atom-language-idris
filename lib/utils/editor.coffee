isCurrentLineEmpty = (editor) ->
  # save the current buffer range, so that we can
  # reset the state in the end
  bufferRange = editor.getSelectedBufferRange()

  editor.moveToBeginningOfLine()
  editor.selectToEndOfLine()
  selectedText = editor.getSelectedText()

  # reset the selection to what it was before calling
  # this function
  editor.setSelectedBufferRange bufferRange

  selectedText.trim() == ''

isCurrentLineLastOfFile = (editor) ->
  currentRow = editor.getCursorBufferPosition().row
  totalRows = editor.getLineCount()
  currentRow == totalRows - 1

moveToNextEmptyLine = (editor) ->
  while !isCurrentLineEmpty(editor) && !isCurrentLineLastOfFile(editor)
    editor.moveDown()

  if !isCurrentLineEmpty(editor)
    editor.insertNewlineBelow()

  editor.moveToBeginningOfLine()

module.exports =
  isCurrentLineEmpty: isCurrentLineEmpty
  moveToNextEmptyLine: moveToNextEmptyLine
