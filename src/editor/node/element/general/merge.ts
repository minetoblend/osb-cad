import {ElementNode} from "@/editor/node/element";
import {NodeBuilder} from "@/editor/node";
import {EditorContext} from "@/editor/ctx/context";
import {CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {RegisterNode} from "@/editor/node/registry";
import {CookJobContext} from "@/editor/cook/context";

@RegisterNode('Merge', ['fas', 'down-left-and-up-right-to-center'], 'general')
export class MergeNode extends ElementNode {
    icon = ['fas', 'down-left-and-up-right-to-center']

    constructor(ctx: EditorContext) {
        super(ctx, 'Merge');
    }

    define(schema: NodeBuilder) {
        schema
            .inputs(1, true)
            .output('output')
    }

    async cook(ctx: CookJobContext): Promise<CookResult> {
        const geos = await Promise.all(this.inputs[0].connections.map(connection =>
            ctx.fetch(connection.from.node.path, connection.from.index)
        ))

        const geo = geos.shift() ?? new SBCollection()

        geos.forEach(it => geo.append(it))

        return CookResult.success(
            geo
        );
    }
}