import {Node} from "@/editor/node/index";
import {Vec2} from "@/util/math";
import {NodeParameter} from "@/editor/node/parameter";


interface SerializedNode {
    type: string;
    name: string;
    position: Vec2;
    parameters: Record<string, SerializedNodeParameter>;
}

interface SerializedNodeParameter {
    type: string
    value: any
}

export function serializeNode(node: Node): SerializedNode {
    const parameters: Record<string, SerializedNodeParameter> = {}

    node.params.forEach((param, id) =>
        parameters[id] = serializeNodeParameter(param))

    return {
        name: node.name.value,
        type: Object.getPrototypeOf(node).constructor.name,
        position: node.position.value.clone(),
        parameters
    }
}

export function serializeNodeParameter(param: NodeParameter): SerializedNodeParameter {
    return {
        type: param.type,
        value: param.value,
    }
}