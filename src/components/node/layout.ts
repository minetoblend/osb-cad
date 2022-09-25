import {Vec2} from "@/util/math";
import {Node} from "@/editor/node";
import {NodeInput, NodeOutput} from "@/editor/node/input";


export function getNodeLayout(node: Node): NodeLayout {
    const size = new Vec2(124, 34)
    const nodeCenter = node.position.value.clone().add(size.mulF(0.5))

    let totalInputWidth = 0
    const socketSize = 8
    const socketSizeMultiple = 25
    const socketGap = 8
    const inputWidths: number[] = []

    node.inputs.forEach((input, index) => {
        const inputWidth = input.multiple ?
            Math.max(input.connections.length * 6 + 8, socketSizeMultiple) :
            socketSize

        totalInputWidth += inputWidth
        inputWidths.push(inputWidth)
        if (index > 0)
            totalInputWidth += socketGap
    })

    const inputs: SocketLayout[] = []
    let curX = nodeCenter.x - totalInputWidth * 0.5

    node.inputs.forEach((input, index) => {
        inputs.push({
            input,
            position: new Vec2(curX, node.position.value.y - socketSize),
            size: new Vec2(inputWidths[index], socketSize)
        })
        curX += socketGap + inputWidths[0]
    })

    const outputs: SocketLayout[] = []
    const totalOutputWidth = (node.outputs.length - 1) * (socketSize + socketGap) + socketSize
    curX = nodeCenter.x - totalOutputWidth * 0.5
    node.outputs.forEach((output) => {
        outputs.push({
            output,
            position: new Vec2(curX, node.position.value.y + size.y),
            size: new Vec2(socketSize, socketSize)
        })
        curX += socketGap + socketSize
    })

    return new NodeLayout(node.position.value.clone(), size, inputs, outputs,)
}

export class NodeLayout {
    position: Vec2
    size: Vec2
    inputs: SocketLayout[]
    outputs: SocketLayout[]

    constructor(position: Vec2, size: Vec2, inputs: SocketLayout[], outputs: SocketLayout[]) {
        this.position = position;
        this.size = size;
        this.inputs = inputs;
        this.outputs = outputs;
    }

    get min() {
        return this.position
    }

    get max() {
        return this.position.add(this.size)
    }
}

export interface SocketLayout {
    position: Vec2,
    size: Vec2,
    input?: NodeInput
    output?: NodeOutput
}