import * as Preact from 'preact'
import { MessageMetadata } from 'idris-ide-client/build/reply'
import { highlight, highlightToPreact } from '../utils/highlighter'
import { fontOptions } from '../utils/dom'

export type Declaration = {
    name: string
    metadata: Array<MessageMetadata>
}

type SubModulesProps = {
    subModules: Array<string>
}

const SubModulesView: Preact.FunctionComponent<SubModulesProps> = (
    props: SubModulesProps,
) => {
    const { subModules } = props
    return (
        <div>
            <h3>Submodules</h3>
            {subModules.map((subModule) => (
                <div>{subModule}</div>
            ))}
        </div>
    )
}

type DeclarationsProps = { declarations: Array<Declaration> }

const DeclarationsView: Preact.FunctionComponent<DeclarationsProps> = (
    props: DeclarationsProps,
) => {
    const { declarations } = props
    return (
        <div>
            <h3>Declarations</h3>
            {declarations.map((declaration) => {
                const highlighted = highlightToPreact(
                    highlight(declaration.name, declaration.metadata),
                )
                return <div>{highlighted}</div>
            })}
        </div>
    )
}

type BrowseNamespaceProps = {
    subModules: Array<string>
    declarations: Array<Declaration>
}

const BrowseNamespace: Preact.FunctionComponent<BrowseNamespaceProps> = (
    props,
) => {
    const { subModules, declarations } = props

    return (
        <pre style={fontOptions()}>
            <SubModulesView subModules={subModules} />
            <DeclarationsView declarations={declarations} />
        </pre>
    )
}

export const browseNamespaceView = (
    props: BrowseNamespaceProps,
): HTMLElement => {
    const hostElement = document.createElement('div')

    Preact.render(<BrowseNamespace {...props} />, hostElement)
    return hostElement
}
