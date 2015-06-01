# Tutorial

## First steps

### Installation

Install the `language-idris` package from the atom settings.
The package might tell you that you need to set the path to the `idris` executable
in the settings.

Create a new file and call it `ops.idr`.
Paste this code into your new file:

```idris
module Ops

||| Add two natural numbers.
add : Nat -> Nat -> Nat
add Z     y = y
add (S k) y = S (add k y)

||| Multiply two natural numbers.
mul : Nat -> Nat -> Nat
mul Z     y = Z
mul (S k) y = add y (mul k y)
```

### Type info

Select an instance of the `add` function in your code and press `ctrl-alt-t` or use the command palette (`ctrl-shift-p` on Win/Linux) and search for "Language Idris: Type Of".
A panel should open at the bottom of your window showing you the type of the `add` function, `Ops.add : Nat -> Nat -> Nat`.
Now try the same thing with the `mul` function.

### Show documentation

Another useful command is triggered by selecting a word and pressing `ctrl-alt-d` (or "Language Idris: Docs for" from the command palette). You can try it on `add`, `mul` or `Nat` for instance.

## REPL

## Proving
