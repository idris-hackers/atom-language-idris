# Development Guide

## Getting started

The easiest way is to get the source of the `language-idris` package via the `apm`-tooling:

```bash
apm dev language-idris
```

This will install the package in the folder `~/github/language-idris`. You will then be able to use the development version of `language-idris` by invoking atom from any directory containing some idris files using

```bash
atom -d .
```

## Development process

Atom is basically a browser and when doing development it can be useful to open the dev console.

<kbd>Alt</kbd>+<kbd>Cmd</kbd><kbd>i</kbd> opens the developer console on Mac OS X. This enables you to see console logging output and exceptions.

You can edit the sourcecode in another atom window:

```
$~/github/language-idris> atom .
```

Anytime you want to restart your project with the latest changes, you can just reload the window using `Window: Reload`.

## Code Structure

```bash
~/github/language-idris/lib (master %)$ tree
.
├── idris-controller.coffee
├── idris-ide-mode.coffee
├── idris-model.coffee
├── language-idris.coffee
├── utils
│   ├── Logger.coffee
│   ├── dom.coffee
│   ├── editor.coffee
│   ├── highlighter.coffee
│   ├── ipkg.coffee
│   ├── js.coffee
│   ├── parse.coffee
│   ├── sexp-formatter.coffee
│   └── symbol.coffee
└── views
    ├── apropos-view.coffee
    ├── holes-view.coffee
    ├── information-view.coffee
    ├── panel-view.coffee
    └── repl-view.coffee
```

The best point to get started is to dig into `idris-controller.coffee`. Almost all defined commands talk to a spawned idris process using the [Idris IDE protocol](http://docs.idris-lang.org/en/latest/reference/ide-protocol.html). This protocol communicates with Idris via S-Exp Expressions. If you want to see this communication have a look at `utils/Logger.coffee`.

In order to send a command to idris, you will probably need some information from the current editor context. There are plenty of examples in the code and a helper package in the `utils` section. Once you have a reply you will probably need to format it. This can be done via one of the `highlighters`. Again, this is something which occurs again and again in the code.


## Specs

There are (too) few tests defined in the spec directory. You can execute them using `Window: Run package specs`.
