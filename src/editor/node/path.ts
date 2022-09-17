export class NodePath {
    constructor(readonly parts: string[]) {
    }

    get length() {
        return this.parts.length
    }

    get current() {
        return this.parts[0]
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
        return this.parts.join('/')
    }

    replace(name: string) {
        return new NodePath([
            ...this.parts.slice(0, this.parts.length - 1),
            name
        ]);
    }
}