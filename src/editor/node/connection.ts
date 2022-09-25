import {Node} from "@/editor/node/index";
import {v4 as uuid} from 'uuid'
import {ref} from "vue";
import {SerializedConnection} from "@/editor/ctx/serialize";
import {NodeInput, NodeOutput} from "@/editor/node/input";

export class NodeConnection<N extends Node = Node> {
    constructor(public from: NodeOutput<N>, public to: NodeInput<N>) {
    }

    readonly id = uuid()
    circular = ref(false)

    serialize() : SerializedConnection {
        return {
            from: {
                node: this.from.node.name.value,
                index: this.from.index,
            },
            to: {
                node: this.to.node.name.value,
                index: this.to.index,
            }
        }
    }

    get isSelected(): boolean {
        return !!this.from.node.parent?.isConnectionSelected(this)
    }
}