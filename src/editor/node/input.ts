import {NodeConnection} from "@/editor/node/connection";
import {Node} from "@/editor/node/index";
import {shallowReactive} from "vue";
import {EditorObject} from "@/editor/ctx/editorObject";

export class NodeInput<N extends Node = Node> implements EditorObject {
    constructor(
        public readonly node: N,
        public name: string,
        public index: number,
        public multiple: boolean,
    ) {
    }

    connections = shallowReactive<NodeConnection<N>[]>([])

    canEvaluate(): boolean {
        return false;
    }

    getChild(name: string): EditorObject | undefined {
        return undefined;
    }

    getParent(): EditorObject | undefined {
        return this.node;
    }

    getName(): string {
        return ':input' + this.index
    }


}

export class NodeOutput<N extends Node = Node> {
    constructor(
        public readonly node: N,
        public name: string,
        public index: number,
    ) {
    }

    connections: NodeConnection<N>[] = []
}