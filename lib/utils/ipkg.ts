import { Project } from 'atom'
import * as path from 'path'
import * as fs from 'fs'
import * as Rx from 'rx-lite'
import Logger from './Logger'

type IpkgFile = {
    file: string
    directory: string
    path: string
    ext: string
}

export type CompilerOptions = {
    options?: string
    pkgs: Array<string>
    src?: string
}

const optionsRegexp = /opts\s*=\s*\"([^\"]*)\"/
const sourcedirRegexp = /sourcedir\s*=\s*([a-zA-Z/0-9.]+)/
const pkgsRegexp = /pkgs\s*=\s*(([a-zA-Z/0-9., -_]+\s{0,1})*)/

// Find all ipkg-files in a directory and returns
// an observable of an array of files
export const findIpkgFile = (
    project: Project,
): Rx.Observable<Array<IpkgFile>> => {
    const directories = project.getDirectories()
    const directory = directories[0]
    let directoryPath: string
    if (directory) {
        Logger.logText('Project detected')
        directoryPath = directory.getPath()
    } else {
        Logger.logText('Single file detected')
        const editor: any = atom.workspace.getActivePaneItem()
        const file = editor?.buffer?.file
        directoryPath = file.getParent().path
    }

    const readDir = Rx.Observable.fromNodeCallback(fs.readdir)

    const r = readDir(directoryPath)
    return r.map((files: any) =>
        files
            .map(
                (file: string): IpkgFile => ({
                    file,
                    directory: directoryPath,
                    path: path.join(directoryPath, file),
                    ext: path.extname(file),
                }),
            )
            .filter((file: IpkgFile) => file.ext === '.ipkg'),
    )
}

const parseIpkgFile = (fileInfo: any) => (
    fileContents: string,
): CompilerOptions => {
    const optionsMatches = fileContents.match(optionsRegexp)
    const sourcedirMatches = fileContents.match(sourcedirRegexp)
    const pkgsMatches = fileContents.match(pkgsRegexp)

    const options = optionsMatches ? optionsMatches[1] : undefined

    const pkgs = pkgsMatches
        ? pkgsMatches[1].split(',').map((s: string) => s.trim())
        : []

    const src = sourcedirMatches
        ? path.join(fileInfo.directory, sourcedirMatches[1])
        : fileInfo.directory

    return { options, pkgs, src }
}

export const readIpkgFile = (ipkgFile: any): Rx.Observable<string> => {
    const readFile: any = Rx.Observable.fromNodeCallback(fs.readFile)
    return readFile(ipkgFile.path, { encoding: 'utf8' })
}

// Find the ipkg file in the top directory of the project and return
// the compiler options in it.
export const compilerOptions = (project: Project) => {
    const ipkgFilesObserver = findIpkgFile(project) as any
    return ipkgFilesObserver
        .flatMap((ipkgFiles: any) => {
            if (ipkgFiles.length) {
                const ipkgFile = ipkgFiles[0]
                return readIpkgFile(ipkgFile).map(parseIpkgFile(ipkgFile))
            } else {
                return Rx.Observable.return({})
            }
        })
        .catch(() => Rx.Observable.return({}))
}
