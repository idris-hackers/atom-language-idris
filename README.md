

# An Idris Mode for Atom

A work-in-progress Idris Mode for Atom.

It supports:

 - Typechecking (<kbd>ctrl-i</kbd> <kbd>r</kbd>)
   - compiles the file and reports errors
 - Case-splitting (<kbd>ctrl-i</kbd> <kbd>c</kbd>)
   - split a variable which can be pattern matched
 - Clause-adding (<kbd>ctrl-i</kbd> <kbd>a</kbd>)
   - add a clause to a function
 - Proof-search (<kbd>ctrl-i</kbd> <kbd>s</kbd>)
   - search for a proof of a hole
 - Showing the types of a variable (<kbd>ctrl-i</kbd> <kbd>t</kbd>)
   - show the type of a hole
 - Show the doc for a function or interface (<kbd>ctrl-i</kbd> <kbd>d</kbd>)
 - Print definition of data type, function, interface (<kbd>ctrl-i</kbd> <kbd>f</kbd>)
 - make-with (<kbd>ctrl-i</kbd> <kbd>w</kbd>)
   - add further variables on the left hand side of a function
 - make-case (<kbd>ctrl-i</kbd> <kbd>m</kbd>)
 - make-lemma (<kbd>ctrl-i</kbd> <kbd>l</kbd>)
   - lift a hole into a function context
 - Add proof case (<kbd>ctrl-i</kbd> <kbd>p</kbd>)
   - alternate version of clause adding when trying to proof a type. http://docs.idris-lang.org/en/latest/reference/misc.html#match-application
 - Browse namespace (<kbd>ctrl-i</kbd> <kbd>b</kbd>)
   - select the name of a namespace beforehand
 - Showing holes (<kbd>ctrl-i</kbd> <kbd>o</kbd>)
 - ipkg highlighting
 - REPL (<kbd>ctrl-i</kbd> <kbd>enter</kbd>)
 - Apropos view

## Usage

The package should work after installation. The only thing you might need to
set is the path to the `idris` executable in the config of this package.
If it doesn't work it's probably a bug.

There is a tutorial on how to use the editor under [`documentation/tutorial.md`](https://github.com/idris-hackers/atom-language-idris/blob/master/documentation/tutorial.md).

### Working with ipkg files

Place your ipkg file in the top level directory of your project.
There is more information available in a in a [separate documentation](https://github.com/idris-hackers/atom-language-idris/blob/master/documentation/ipkg.md).

## Todo

 - Add better support for drawing attention to error-messages
 - Improve the syntax-highlighting (the current is based on the Sublime plugin)
 - Add autocompletion
 - ...

## Development

see the [Development Guide](DEVELOPMENT.md)
