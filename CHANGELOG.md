# Language-Idris Changelog

## Next version

### Added

### Fixed

## v0.3.1

### Added

### Fixed

- get documentation or types for operators [#66](https://github.com/idris-hackers/atom-language-idris/issues/66)
- removed the statusbar [#67](https://github.com/idris-hackers/atom-language-idris/issues/67)

## v0.3.0

### Added

- Add a means of setting the Idris -p option [#29](https://github.com/idris-hackers/atom-language-idris/issues/29)

### Fixed

## v0.2.5

### Added

- Restart the idris compiler after every commmand if it was killed [#54](https://github.com/idris-hackers/atom-language-idris/pull/54)
- added the ability to style all the idris-panels

### Fixed

- Status message should appear only in idris projects [#52](https://github.com/idris-hackers/atom-language-idris/issues/52) many thanks to @jeremy-w

## v0.2.4

### Added

### Fixed

- Uncaught ReferenceError: editor is not defined [#49](https://github.com/idris-hackers/atom-language-idris/issues/49)
- Error when searching for type, documentation [#37](https://github.com/idris-hackers/atom-language-idris/issues/37)

## v0.2.3

### Added

- make-with (@edwinb)
- make-case (@edwinb)
- make-lemma (@edwinb)

### Fixed

- Uncaught Error: Can't save buffer with no file path [#47](https://github.com/idris-hackers/atom-language-idris/issues/47)
- save files before executing a command (@edwinb)
- The Idris Errors panel should tell me if typechecking went successfully [#43](https://github.com/idris-hackers/atom-language-idris/issues/43) (@edwinb)

## v0.2.2

### Added

### Fixed

- fix the new error messages

## v0.2.1

### Added

- `print-definition` to show the definition of the selected word
- add error messages when the compiler crashes/can't be found

### Fixed

## v0.2.0

### Added

- status indicator that shows if a file is loaded or dirty
- metavariables are now called holes

### Fixed

- fixed bug in the parser when there where backslashes in the answer [#32](https://github.com/idris-hackers/atom-language-idris/issues/32) (@david-christiansen)
- Program not loaded before running interactive editing commands [#34](https://github.com/idris-hackers/atom-language-idris/issues/34)
- faster startup [#28](https://github.com/idris-hackers/atom-language-idris/issues/28)

## v0.1.4

### Added

- new metavariable view (`Language Idris: Metavariables`)
- a tutorial that explains how to use this package
- context menu for `Language Idris: Type Of` and `Language Idris: Docs For`

### Fixed

- `Language Idris: Proof Search` and `Language Idris: Add Clause`
- deprecations that now broke the editor because of the dropped API methods

## v0.1.3

### Added

### Fixed

- Better syntax highlighting
- fixed the parser for the ide-mode lisp
- fixed [#18](https://github.com/idris-hackers/atom-language-idris/issues/18)
- fixed [#19](https://github.com/idris-hackers/atom-language-idris/issues/19)
- fixed an issue with the error lines not being clickable in the error panel

## v0.1.1

### Added

- Type and doc info highlighting https://github.com/idris-hackers/atom-language-idris/pull/9 (@archaeron)

### Fixed

- Ensure that keybindings only work on Idris files (#2)
- Syntax highlighting for infix functions
- Fixed a crash when idris was not installed

## v0.1.0

### Added

- Shortcut to Show the doc of a variable (ctrl-alt-d)

### Fixed

- updated for the new version of Atom (@archaeron)
- new parser for the ide-mode commands (@archaeron)
- new serializer for the ide-mode commands (@archaeron)
- various fixes (@ulidtko)

## v0.0.1

### Added

- Case-splitting (ctrl-alt-c) (@fangel)
- Clause-adding (ctrl-alt-a) (@fangel)
- Proof-search (ctrl-alt-s) (@fangel)
- Showing the types of meta-variables (ctrl-alt-t) (@fangel)
- Show the doc of a variable (@fangel)
