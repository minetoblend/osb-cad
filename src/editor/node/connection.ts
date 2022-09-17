import {Node, NodeInput, NodeOutput} from "@/editor/node/index";
import {v4 as uuid} from 'uuid'
import {ref} from "vue";

export class NodeConnection<N extends Node = Node> {
    constructor(public from: NodeOutput<N>, public to: NodeInput<N>) {
    }

    readonly id = uuid()
    circular = ref(false)

}