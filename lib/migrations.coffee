#
# Throw out this module as soon as it becomes a maintenance burden, or
# sufficient stabilization time has passed for the new keymap.
#

CSON = require 'cson-parser'

formatLegacyKeymap = () ->
    legacyKeymap =
      "atom-text-editor[data-grammar~=\"idris\"]":
        "ctrl-alt-a": "language-idris:add-clause"
        "ctrl-alt-b": "language-idris:browse-namespace"
        "ctrl-alt-c": "language-idris:case-split"
        "ctrl-alt-d": "language-idris:docs-for"
        "ctrl-alt-l": "language-idris:make-lemma"
        "ctrl-alt-m": "language-idris:make-case"
        "ctrl-alt-p": "language-idris:add-proof-clause"
        "ctrl-alt-r": "language-idris:typecheck"
        "ctrl-alt-s": "language-idris:proof-search"
        "ctrl-alt-t": "language-idris:type-of"
        "ctrl-alt-w": "language-idris:make-with"
        "ctrl-alt-enter": "language-idris:open-repl"
      ".platform-darwin atom-text-editor[data-grammar~=\"idris\"]":
        "ctrl-cmd-a": "language-idris:add-clause"
        "ctrl-cmd-b": "language-idris:browse-namespace"
        "ctrl-cmd-c": "language-idris:case-split"
        "ctrl-cmd-d": "language-idris:docs-for"
        "ctrl-cmd-l": "language-idris:make-lemma"
        "ctrl-cmd-m": "language-idris:make-case"
        "ctrl-cmd-p": "language-idris:add-proof-clause"
        "ctrl-cmd-r": "language-idris:typecheck"
        "ctrl-cmd-s": "language-idris:proof-search"
        "ctrl-cmd-t": "language-idris:type-of"
        "ctrl-cmd-w": "language-idris:make-with"
        "ctrl-cmd-enter": "language-idris:open-repl"

    keymapExtension = atom.keymaps.getUserKeymapPath().split('.').pop()
    if keymapExtension == 'cson'
      return CSON.stringify(legacyKeymap, null, 2)
    if keymapExtension == 'json'
      return JSON.stringify(legacyKeymap, null, 2)


module.exports =
  showKeymapDeprecationNotice: ->
    detailMd = """
      Please use <kbd>ctrl-i</kbd><kbd>r</kbd>,
                 <kbd>ctrl-i</kbd><kbd>t</kbd>,
                 <kbd>ctrl-i</kbd><kbd>c</kbd> shortcuts
      instead of <kbd>ctrl-alt-r</kbd>,
                 <kbd>ctrl-alt-t</kbd>,
                 <kbd>ctrl-alt-c</kbd>... etc.

      As usual, you can learn Idris shortcuts in Command Palette:
      <kbd>ctrl-shift-p</kbd> or <kbd>cmd-shift-p</kbd>, then type `Idris`.

      ---

      To get back the old `ctrl-alt` bindings *(not recommended)*,
      click the "Edit keymap" button below, and paste.
      """

    popup = atom.notifications.addInfo("Default Idris keymap has been changed.",
      dismissable: true
      description: detailMd
      buttons: [
        { text: "Dismiss", onDidClick: () -> popup.dismiss() }
        {
          text: "Edit keymap"
          className: 'btn btn-warning icon icon-clippy copy-icon'
          onDidClick: () ->
            atom.clipboard.write(formatLegacyKeymap())
            atom.commands.dispatch(atom.views.getView(atom.workspace),
              'application:open-your-keymap')
            popup.dismiss()
            atom.notifications.addSuccess("Copied to clipboard",
              description: "The old `ctrl-alt` Idris keymap can be pasted now."
            )
        }
      ]
    )
