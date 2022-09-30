import {CookError, CookResult} from "@/editor/node/cook.context";
import {Node, NodeBuilder} from "@/editor/node";
import {RegisterNode} from "@/editor/node/registry";
import {ElementNode} from "@/editor/node/element";
import {NodeDependency} from "@/editor/node/dependency";
import {CookJobContext} from "@/editor/cook/context";
import {EditorPath} from "@/editor/node/path";

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

    async cook(ctx: CookJobContext): Promise<CookResult> {
        if (!this.parent)
            return CookResult.failure([new CookError(this, 'No Parent')])

        const input = this.param('input')!.get()

        const res = await ctx.fetch(EditorPath.fromObject(this.parent!.inputs[input]))

        return CookResult.success(res)
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
