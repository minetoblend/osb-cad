export interface EditorObject {

    getChild(name: string): EditorObject | undefined

    getParent(): EditorObject | undefined

    canEvaluate(): boolean
}