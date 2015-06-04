# Tutorial

## First steps

## Learning Idris

This is an overview over the atom package for Idris.
If you are interested in learning Idris you can find the official documentation here http://docs.idris-lang.org/en/latest/ and the official Idris tutorial here http://eb.host.cs.st-andrews.ac.uk/writings/idris-tutorial.pdf.

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

We'll try to prove that the addition of natural numbers is associative for the
purpose of this tutorial.

Create a new file, call it `proving.idr` and insert the following code into it.

```idris
module Main

plusAssoc : (l, c, r : Nat) -> l `plus` (c `plus` r) = (l `plus` c) `plus` r
```

Now press `ctrl-shift-p` and type "Language Idris: Metavariables" into the command palette.

At the bottom of your window should open a small panel with all metavariables you'll have to prove.
Here it should just show:
```
Main.plusAssoc
    l : Nat
    c : Nat
    r : Nat
------------------------------------------------------
Main.plusAssoc : plus l (plus c r) = plus (plus l c) r
```
where `l : Nat, c : Nat, r : Nat` are variables you can use to prove
`Main.plusAssoc : plus l (plus c r) = plus (plus l c) r`.

If you put your cursor over `plusAssoc` in the `proving.idr` file and execute the command "Language Idris: Add Clause" a line wil be inserted by atom at the bottom of your file.

Your file should now look like this:
```idris
module Main

plusAssoc : (l, c, r : Nat) -> l `plus` (c `plus` r) = (l `plus` c) `plus` r
plusAssoc l c r = ?plusAssoc_rhs
```

If you select the `l` in `plusAssoc l c r = ?plusAssoc_rhs` and press `ctrl-alt-c` ("Language Idris: Case Split") it splits the `Nat` at `l`
into it's two cases `Z` (zero) and `(S k)` (the successor of `k`).
Rename `k` to `l` as we had it before, to show that it is the left value.

Your file should now look like this:
```idris
module Main

plusAssoc : (l, c, r : Nat) -> l `plus` (c `plus` r) = (l `plus` c) `plus` r
plusAssoc Z c r = ?plusAssoc_rhs_1
plusAssoc (S l) c r = ?plusAssoc_rhs_2
```

TODO

This tutorial is a written version of [David Christiansens](https://twitter.com/d_christiansen) emacs video for Atom.
https://www.youtube.com/watch?v=0eOY1NxbZHo&list=PLiHLLF-foEexGJu1a0WH_llkQ2gOKqipg
