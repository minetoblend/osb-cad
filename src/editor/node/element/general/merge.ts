import {ElementNode} from "@/editor/node/element";
import {NodeBuilder} from "@/editor/node";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {RegisterNode} from "@/editor/node/registry";

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

    cook(ctx: CookContext): CookResult {
        const geos = ctx.getInputMultiple()
        const geo = geos.shift() ?? new SBCollection()

        geos.forEach(it => geo.append(it))

        return CookResult.success(
            geo
        );
    }
}