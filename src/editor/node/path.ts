export class NodePath {
    constructor(readonly parts: string[]) {
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
        return new NodePath(this.parts.slice(1))
    }

    child(value: string) {
        return new NodePath([
            ...this.parts,
            value
        ]);
    }

    toString() {
        return '/' + this.parts.join('/')
    }

    replace(name: string) {
        return new NodePath([
            ...this.parts.slice(0, this.parts.length - 1),
            name
        ]);
    }

    get hasParent() {
        return this.parts.length > 0
    }

    get parent(): NodePath | undefined {
        if (this.hasParent)
            return new NodePath(this.parts.slice(0, this.parts.length - 1))
        return undefined
    }

    get parentPaths(): NodePath[] {
        if (this.parts.length === 0)
            return []

        const paths: NodePath[] = []
        if (this.hasParent)
            paths.push(...this.parent!.parentPaths)

        paths.push(this)

        return paths
    }

    static root() {
        return new NodePath([]);
    }


    static fromString(activePath: string) {
        return new NodePath(activePath.split('/').filter(it => it.trim().length > 0));
    }
}