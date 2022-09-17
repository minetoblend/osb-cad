import {Node} from "@/editor/node/index";


export class NodeError {

    constructor(public readonly node: Node) {
    }
}

export class CircularDependencyError extends NodeError {
    constructor(node: Node, readonly path: Node[]) {
        super(node);
    }
}