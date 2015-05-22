# A Idris Mode for Atom

A work-in-progress Idris Mode for Atom.

It supports:

 - Case-splitting (ctrl-alt-c)
 - Clause-adding (ctrl-alt-a)
 - Proof-search (ctrl-alt-s)
 - Showing the types of meta-variables (ctrl-alt-t)
 - Show the doc of a variable (ctrl-alt-d)

It is rather finicky, and doesn't have very good error-handling yet.
You will probably need to find the config for the module and put in
the full path for the `idris` executable, because Atom doesn't use
the search-path of your shell.

## Todo:

 - Add better support for drawing attention to error-messages
 - Improve the syntax-highlighting (the current is base on the Sublime plugin)
 - Ensure that keybindings only work on Idris files
   - When Atom supports it, ensure that they only work in the grammar scopes
     that they should work in.
 - Add support for the missing interactions supported by Idris IDESlave
   - Proof Clause-adding
   - Show list of meta-variables
   - ...
