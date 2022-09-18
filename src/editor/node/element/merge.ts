import {ElementNode} from "@/editor/node/element/index";
import {NodeBuilder} from "@/editor/node";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";

export class MergeNode extends ElementNode {
    type = 'merge'
    icon = ['fas', 'down-left-and-up-right-to-center']

    constructor(ctx: EditorContext) {
        super(ctx, 'Merge');
    }

    define(schema: NodeBuilder) {
        schema
            .inputs(1, true)
            .output('output')
    }

    async cook(ctx: CookContext): Promise<CookResult> {

        const geos = (ctx.input[0] as SBCollection[])
        const geo = geos.shift() ?? new SBCollection()

        geos.forEach(it => geo.append(it))

        return CookResult.success(
            geo
        );
    }
}