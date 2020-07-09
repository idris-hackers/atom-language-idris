import { readdir, readFile } from 'fs'
import { promisify } from 'util'
import { extname, join } from 'path'
import { Project } from 'atom'

export type FileInfo = {
    file: string
    path: string
    directory: string
    ext: string
}

export type CompilerOptions = {
    options?: string
    pkgs: Array<string>
    src?: string
}

export const defaultCompilerOptions: CompilerOptions = {
    pkgs: [],
}

/**
 * Check if two `CompilerOptions` are the same.
 */
export function sameCompilerOptions(
    c1: CompilerOptions,
    c2: CompilerOptions,
): boolean {
    const sameOptions = c1.options === c2.options
    const sameSrc = c1.src === c2.src
    const p1 = c1.pkgs
    const p2 = c2.pkgs
    const samePkgs =
        p1.length === p2.length &&
        p1.every((value, index) => value === p2[index])
    return sameOptions && sameSrc && samePkgs
}

const readDirPromise = promisify(readdir)
const readFilePromise = promisify(readFile)

const optionsRegexp = /opts\s*=\s*\"([^\"]*)\"/
const sourcedirRegexp = /sourcedir\s*=\s*([a-zA-Z/0-9.]+)/
const pkgsRegexp = /pkgs\s*=\s*(([a-zA-Z/0-9., -_]+\s{0,1})*)/

/**
 * Get the project folder from a `Project.
 */
export function getProjectFolder(project: Project): string {
    const directories = project.getDirectories()
    const directory = directories[0]
    if (directory) {
        return directory.getPath()
    } else {
        const editor: any = atom.workspace.getActivePaneItem()
        const file = editor?.buffer?.file
        return file.getParent().path
    }
}

/**
 * Find an iPKG file in the project directory.
 * Uses the first one it finds right now.
 */
export async function findIpkgFile(
    projectDirectory: string,
): Promise<FileInfo | null> {
    try {
        const files = await readDirPromise(projectDirectory)
        const ipkgFiles = files
            .map(
                (file): FileInfo => {
                    return {
                        file,
                        path: join(projectDirectory, file),
                        directory: projectDirectory,
                        ext: extname(file),
                    }
                },
            )
            .filter((file) => file.ext === '.ipkg')
        if (ipkgFiles.length > 0) {
            return ipkgFiles[0]
        } else {
            return null
        }
    } catch {
        return null
    }
}

/**
 * Parse the important parts of an iPKG file
 * into `CompilerOptions`
 */
export function parseIpkgFile(
    fileInfo: FileInfo,
    fileContents: string,
): CompilerOptions {
    const optionsMatches = fileContents.match(optionsRegexp)
    const sourcedirMatches = fileContents.match(sourcedirRegexp)
    const pkgsMatches = fileContents.match(pkgsRegexp)

    const options = optionsMatches ? optionsMatches[1] : undefined

    const pkgs = pkgsMatches
        ? pkgsMatches[1].split(',').map((s: string) => s.trim())
        : []

    const src = sourcedirMatches
        ? join(fileInfo.directory, sourcedirMatches[1])
        : fileInfo.directory

    return { options, pkgs, src }
}

/**
 * Try to find the iPKG file and parse the important bits out
 * from a `Project`.
 */
export async function findAndReadIpkgFile(
    project: Project,
): Promise<CompilerOptions | null> {
    const projectFolder = getProjectFolder(project)
    const ipkgFile = await findIpkgFile(projectFolder)
    if (ipkgFile) {
        const fileContents = await readFilePromise(ipkgFile.path, {
            encoding: 'utf8',
        })
        return parseIpkgFile(ipkgFile, fileContents)
    } else {
        return null
    }
}

/**
 * Convert `CompilerOptions` to command line parameters
 * understood by the idris compiler.
 * @param compilerOptions
 * @param tabLength
 */
export function compilerOptionsToFlags(
    compilerOptions: CompilerOptions,
    tabLength: number,
): Array<string> {
    let ipkgOptions = compilerOptions.options
        ? compilerOptions.options.split(' ')
        : []

    const configParams = [
        '--ide-mode',
        '--indent-with=' + tabLength,
        '--indent-clause=' + tabLength,
    ]

    const packageTuples = compilerOptions.pkgs.map((p) => ['-p', p])

    const emptyStringArray: Array<string> = []
    const pkgs: Array<string> = emptyStringArray.concat.apply(
        emptyStringArray,
        packageTuples,
    )
    const parameters = configParams.concat(pkgs, ipkgOptions)
    return parameters
}
