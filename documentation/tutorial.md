# Tutorial

## First steps

## Learning Idris

This is an overview of the atom package for Idris. If you are interested in learning Idris you can find the [official documentation](http://docs.idris-lang.org/en/latest/), and the [official Idris tutorial](http://docs.idris-lang.org/en/latest/tutorial/).

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

### Typecheck

Open the command palette (`ctrl-shift-p` on Win/Linux) and select `Language Idris: Typecheck`. (or use `ctrl-alt-r`)

### Type info

Select an instance of the `add` function in your code and press `ctrl-alt-t` or use the command palette (`ctrl-shift-p` on Win/Linux) and search for "Language Idris: Type Of". A panel should open at the bottom of your window showing you the type of the `add` function, `Ops.add : Nat -> Nat -> Nat`.
Now try the same thing with the `mul` function.

### Show documentation

Another useful command is triggered by selecting a word and pressing `ctrl-alt-d` (or "Language Idris: Docs for" from the command palette). You can try it on `add`, `mul` or `Nat` for instance.

### REPL

You can create a REPL window by pressing `ctrl-alt-enter`. Enter REPL commands at the top, just as if you were using the REPL command line interface. 

### Idris command line options and library package dependencies 

Sometimes you may have dependendencies on Idris packages, for instance Lightyear for parsing or Pruvioj for advanced theorem proving. 
In Atom you can specify these dependencies using the project model, which simply means using Open Folder rather than Open File 
from the File menu. Atom will look for a .ipkg file in the folder and load any dependencies listed. More details are described in 
[Working with ipkg files](https://github.com/idris-hackers/atom-language-idris/blob/master/documentation/ipkg.md). 

## Interactive proofs using Idris and Atom

We'll try to prove that the addition of natural numbers is associative for the
purpose of this tutorial.

Create a new file, call it `proving.idr` and insert the following code into it.

```idris
module Main

plusAssoc : (l, c, r : Nat) -> l `plus` (c `plus` r) = (l `plus` c) `plus` r
```

Load the file into Idris by typechecking it by pressing `ctrl-alt-r`. Then press `ctrl-shift-p` and type "Language Idris: Holes".

At the bottom of your window should open a small panel with all holes you'll have to prove.
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

If you put your cursor over `plusAssoc` in the `proving.idr` file and execute the command "Language Idris: Add Clause" (`ctrl-alt-a`) a line wil be inserted by atom at the bottom of your file.

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

After type checking the file again, open the holes view and it will show you both holes:

```
Main.plusAssoc_rhs_1
    c : Nat
    r : Nat
------------------------------------------
Main.plusAssoc_rhs_1 : plus c r = plus c r

Main.plusAssoc_rhs_2
    l : Nat
    c : Nat
    r : Nat
--------------------------------------------------------------------
Main.plusAssoc_rhs_2 : S (plus l (plus c r)) = S (plus (plus l c) r)
```

Now you can see, that you need to prove that `plus c r = plus c r` for `Main.plusAssoc_rhs_1`. Idris can insert the code automatically for us. Select `plusAssoc_rhs_1` and press `ctrl+alt+s` ("Language Idris: Proof Search") and Idris will insert `Refl` for you.

Now the file looks like this:
```idris
module Main

plusAssoc : (l, c, r : Nat) -> l `plus` (c `plus` r) = (l `plus` c) `plus` r
plusAssoc Z c r = Refl
plusAssoc (S l) c r = ?plusAssoc_rhs_2
```

Only one hole is left now:

```
Main.plusAssoc_rhs_2
    l : Nat
    c : Nat
    r : Nat
--------------------------------------------------------------------
Main.plusAssoc_rhs_2 : S (plus l (plus c r)) = S (plus (plus l c) r)
```

Now replace the line

```idris
plusAssoc (S l) c r = ?plusAssoc_rhs_2
```

with

```idris
plusAssoc (S l) c r = rewrite plusAssoc l c r in ?plusAssoc_rhs_2
```

and after type checking the holes view now shows us:

```
Main.plusAssoc_rhs_2
    l : Nat
    c : Nat
    r : Nat
    _rewrite_rule : plus (plus l c) r = plus l (plus c r)
--------------------------------------------------------------------
Main.plusAssoc_rhs_2 : S (plus (plus l c) r) = S (plus (plus l c) r)
```

Now you need to prove that `S (plus (plus l c) r) = S (plus (plus l c) r)` and Idris can again do this for us.

And you end with the file

```idris
module Main

plusAssoc : (l, c, r : Nat) -> l `plus` (c `plus` r) = (l `plus` c) `plus` r
plusAssoc Z c r = Refl
plusAssoc (S l) c r = rewrite plusAssoc l c r in Refl
```

and a proof that the addition of natural numbers is associative.

This tutorial is a written version of [David Christiansen's](https://twitter.com/d_christiansen) emacs video for Atom.
https://www.youtube.com/watch?v=0eOY1NxbZHo&list=PLiHLLF-foEexGJu1a0WH_llkQ2gOKqipg
