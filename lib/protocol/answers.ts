export type Premise = {
    name: string
    type: string
    metadata: any
}

export type Conclusion = {
    type: string
    highlightingInformation: Array<any>
}

export type Hole = {
    name: string
    premises: Array<Premise>
    conclusions: Array<Conclusion>
}
