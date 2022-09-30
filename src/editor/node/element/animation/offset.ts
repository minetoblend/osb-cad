import {ElementNode} from "@/editor/node/element";
import {EditorContext} from "@/editor/ctx/context";
import {CookResult} from "@/editor/node/cook.context";
import {NodeBuilder} from "@/editor/node";
import {RegisterNode} from "@/editor/node/registry";
import {CookJobContext} from "@/editor/cook/context";
import {EditorPath} from "@/editor/node/path";

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

    async cook(ctx: CookJobContext): Promise<CookResult> {
        const geo = await ctx.fetchInput()

        const amount = this.param('amount')!

        geo.forEach((idx, el) => {
            el.offsetAnimation(amount.getWithElement({idx, el, geo: [geo]}))
        })

        return CookResult.success(geo);
    }
}

@RegisterNode('TimeShift', ['fas', 'forward'], 'animation')
export class TimeShiftNode extends ElementNode {
    icon = ['fas', 'forward']

    constructor(ctx: EditorContext) {
        super(ctx, 'Offset');
    }

    define(builder: NodeBuilder) {
        builder
            .inputs(1)
            .outputs(1)
            .parameters(param => param
                .int('amount', 'Amount', {defaultValue: 0, withIndex: false})
            )
    }

    async cook(ctx: CookJobContext): Promise<CookResult> {
        const offset: number = this.param('amount')!.get()

        const geo = await ctx.fetch(
            EditorPath.fromObject(this.inputs[0])
                .withQuery('time', ctx.time + offset)
        )

        geo.forEach((idx, el) => {
            el.offsetAnimation(offset)
        })

        return CookResult.success(geo);
    }
}