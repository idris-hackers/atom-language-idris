# IPKG files

When you open a directory with a file at the top level in it that ends in `.ipkg`, all the commands
in this package will read it and use it to find the path of your sources and resolve
dependencies.

Supported are the `opts` and `sourcedir` options.

There is [more information](http://docs.idris-lang.org/en/latest/tutorial/packages.html) about `ipkg`-files in the idris documentation.


## Example

You have a folder that looks like this:

```
src
└───Main.idr
└───OtherFile.idr
your-project.ipkg
```

with `your-project.ipkg` containing:

```
package yourProject

sourcedir = src
modules = Main
executable = yourExecutable
main = Main

opts = "-p lightyear"
```

the package will search in the `src`-directory for your files and will
load the dependencies specified in `opts`.
