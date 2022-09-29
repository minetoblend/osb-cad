import {EditorObject} from "@/editor/ctx/editorObject";

export class EditorPath {
    readonly parts: ReadonlyArray<string>

    constructor(parts: string[]) {
        this.parts = Object.freeze(parts)
    }

    get length() {
        return this.parts.length
    }

    get current() {
        return this.parts[0]
    }

    get leaf() {
        return this.parts[this.parts.length - 1]
    }

    shift() {
        return new EditorPath(this.parts.slice(1))
    }

    child(value: string) {
        return new EditorPath([
            ...this.parts,
            value
        ]);
    }

    toString() {
        return '/' + this.parts.join('/')
    }

    replace(name: string) {
        return new EditorPath([
            ...this.parts.slice(0, this.parts.length - 1),
            name
        ]);
    }

    get hasParent() {
        return this.parts.length > 0
    }

    get parent(): EditorPath | undefined {
        if (this.hasParent)
            return new EditorPath(this.parts.slice(0, this.parts.length - 1))
        return undefined
    }

    get parentPaths(): EditorPath[] {
        if (this.parts.length === 0)
            return []

        const paths: EditorPath[] = []
        if (this.hasParent)
            paths.push(...this.parent!.parentPaths)

        paths.push(this)

        return paths
    }

    static root() {
        return new EditorPath([]);
    }


    static fromString(activePath: string) {
        return new EditorPath(activePath.split('/').filter(it => it.trim().length > 0));
    }

    resolve(relative: string) {
        if (relative.startsWith('/'))
            return EditorPath.fromString(relative)

        const parts: string[] = [...this.parts]

        const relativeParts = relative.split('/')

        relativeParts.forEach((part) => {
            if (part === '.') {
                return; //current node
            } else if (part === '..') {
                parts.pop(); //go back one node
            } else {
                parts.push(part)
            }
        })

        return new EditorPath(parts);
    }

    get isRelative() {
        return ['.', '..'].includes(this.parts[0])
    }

    split(): [string, EditorPath | undefined] {
        const [child, ...remaining] = this.parts
        return [child, remaining.length ? new EditorPath(remaining) : undefined]
    }

    find(root: EditorObject) {
        const parts = [...this.parts]
        let curObj = root
        while (parts.length > 0) {
            const pathElement = parts.shift()!
            let nextObj: EditorObject | undefined;
            if (pathElement === '..') {
                nextObj = curObj.getParent()
            } else if (pathElement === '.') {
                nextObj = curObj
            } else {
                nextObj = curObj.getChild(pathElement)
            }
            if (!nextObj) {
                throw Error('Not found')
            }
            curObj = nextObj
        }
        return curObj
    }
}