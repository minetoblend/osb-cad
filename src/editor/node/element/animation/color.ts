import {ElementNode} from "@/editor/node/element";
import {EditorContext} from "@/editor/ctx/context";
import {CookResult} from "@/editor/node/cook.context";
import {NodeBuilder} from "@/editor/node";
import {Easing} from "@/editor/objects/easing";
import {Color} from "@/util/math";
import {RegisterNode} from "@/editor/node/registry";
import {CookJobContext} from "@/editor/cook/context";

@RegisterNode('Color', ['fas', 'brush'], 'commands')
export class ColorNode extends ElementNode {
    icon = ['fas', 'brush']

    constructor(ctx: EditorContext) {
        super(ctx, 'Color');
    }

    define(builder: NodeBuilder) {
        builder
            .inputs(1)
            .outputs(1)
            .parameters(param => param
                .int('startTime', 'Start Time', {defaultValue: 0, withIndex: true})
                .int('endTime', 'End Time', {defaultValue: 0, withIndex: true})
                .color('startColor', 'Start Color', {defaultValue: Color.white, withIndex: true})
                .color('endColor', 'End Color', {defaultValue: Color.white, withIndex: true})
            )
    }

    async cook(ctx: CookJobContext): Promise<CookResult> {
        const geo = await ctx.fetchInput()

        const startTime = this.param('startTime')!
        const endTime = this.param('endTime')!

        geo.forEach((idx, el) => {

            el.color({
                startTime: startTime.getWithElement({idx, el, geo: [geo]}),
                endTime: endTime.getWithElement({idx, el, geo: [geo]}),
                startColor: this.chc('startColor', {idx, el, geo: [geo]}),
                endColor: this.chc('endColor', {idx, el, geo: [geo]}),
                easing: Easing.QuadOut,
            })
        })

        return CookResult.success(geo);
    }
}