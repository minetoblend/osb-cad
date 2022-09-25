import {ElementNode} from "@/editor/node/element";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {NodeBuilder} from "@/editor/node";
import {RegisterNode} from "@/editor/node/registry";

@RegisterNode('Offset', ['fas', 'clock'], 'animation')
export class OffsetNode extends ElementNode {
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

        const geo = ctx.getInput()

        const amount = this.param('amount')!

        geo.forEach((idx, el) => {
            el.offsetAnimation(amount.getWithElement({idx, el, geo: ctx.getInputs()}))
        })

        return CookResult.success(geo);
    }
}