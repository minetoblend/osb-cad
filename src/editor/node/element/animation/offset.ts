import {ElementNode} from "@/editor/node/element";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {NodeBuilder} from "@/editor/node";

export class OffsetNode extends ElementNode {
    type = 'offset¶'
    icon = ['fas', 'clock']

    constructor(ctx: EditorContext) {
        super(ctx, 'Offset');
    }

    define(builder: NodeBuilder) {
        builder
            .inputs(1)
            .outputs(1)
            .parameters(param => param
                .int('amount', 'Amount', {defaultValue: 0, withIndex: true})
            )
    }

    async cook(ctx: CookContext): Promise<CookResult> {

        const geo = ctx.input[0] as SBCollection

        const amount = this.param('amount')!

        geo.forEach((idx, el) => {

            el.offsetAnimation(amount.getWithElement({idx, el, geo: ctx.input}))
        })

        return CookResult.success(geo);
    }
}