

# An Idris Mode for Atom

A work-in-progress Idris Mode for Atom.

It supports:

 - Typechecking (ctrl-alt-r)
   - compiles the file and reports errors
 - Case-splitting (ctrl-alt-c)
   - split a variable which can be pattern matched
 - Clause-adding (ctrl-alt-a)
   - add a clause to a function
 - Proof-search (ctrl-alt-s)
   - search for a proof of a hole
 - Showing the types of a variable (ctrl-alt-t)
   - show the type of a hole
 - Show the doc for a function (ctrl-alt-d)
 - make-with (ctrl-alt-w)
   - add further variables on the left hand side of a function
 - make-case (ctrl-alt-m)
 - make-lemma (ctrl-alt-l)
   - lift a hole into a function context
 - Add proof case (ctrl-alt-p)
   - alternate version of clause adding when trying to proof a type. http://docs.idris-lang.org/en/latest/reference/misc.html#match-application
 - Browse namespace (ctrl-alt-b)
   - select the name of a namespace beforehand
 - Showing holes
 - ipkg highlighting
 - REPL (ctrl-alt-enter)
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
