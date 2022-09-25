import {NodeConnection} from "@/editor/node/connection";
import {Node} from "@/editor/node/index";
import {shallowReactive} from "vue";

export class NodeInput<N extends Node = Node> {
    constructor(
        public readonly node: N,
        public name: string,
        public index: number,
        public multiple: boolean,
    ) {
    }

    connections = shallowReactive<NodeConnection<N>[]>([])//: NodeConnection<N>[] = []

    getValue(): any {
        if (this.multiple)
            return this.connections.map(it => it.from.node.getOutput(this.connections[0].from.index))
        if (this.connections.length)
            return this.connections[0].from.node.getOutput(this.connections[0].from.index)

        return undefined
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