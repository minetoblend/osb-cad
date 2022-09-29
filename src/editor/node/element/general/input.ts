import {CookContext, CookResult} from "@/editor/node/cook.context";
import {Node, NodeBuilder} from "@/editor/node";
import {RegisterNode} from "@/editor/node/registry";
import {ElementNode} from "@/editor/node/element";
import {NodeDependency} from "@/editor/node/dependency";

@RegisterNode('Input', ['fas', 'right-to-bracket'], 'general', 'element')
export class InputNode extends ElementNode {
    icon: string[] = ['fas', 'right-to-bracket'];


    define(builder: NodeBuilder) {
        builder
            .outputs(1)
            .parameters(param => param
                .int('input', 'Input')
            )
    }

    cook(ctx: CookContext): CookResult {
        return CookResult.success(ctx.inputGeometry[0])
    }

    findDependenciesForCooking(visited: Set<Node> = new Set<Node>()): NodeDependency[] {
        const parent = this.parent
        if (!parent)
            return []

        const inputIndex = this.param('input')!.get()

        const input = parent.inputs[inputIndex]
        if (input && input.connections.length > 0) {
            const connection = input.connections[0]
            return [
                new NodeDependency(connection.from.node, 0, connection.from.index, false)
            ]
        } else {
            return [NodeDependency.empty(0)]
        }
    }

}
