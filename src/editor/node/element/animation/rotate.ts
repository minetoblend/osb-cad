import {ElementNode} from "@/editor/node/element";
import {EditorContext} from "@/editor/ctx/context";
import {CookResult} from "@/editor/node/cook.context";
import {NodeBuilder} from "@/editor/node";
import {Easing} from "@/editor/objects/easing";
import {RegisterNode} from "@/editor/node/registry";
import {CookJobContext} from "@/editor/cook/context";

@RegisterNode('Rotate', ['fas', 'rotate'], 'commands')
export class RotateNode extends ElementNode {
    icon = ['fas', 'rotate']

    constructor(ctx: EditorContext) {
        super(ctx, 'Rotate');
    }

    define(builder: NodeBuilder) {
        builder
            .inputs(1)
            .outputs(1)
            .parameters(param => param
                .int('startTime', 'Start Time', {defaultValue: 0, withIndex: true})
                .int('endTime', 'End Time', {defaultValue: 0, withIndex: true})
                .float('startAngle', 'Start Angle', {defaultValue: 1, withIndex: true})
                .float('endAngle', 'End Angle', {defaultValue: 1, withIndex: true})
            )
    }

    async cook(ctx: CookJobContext): Promise<CookResult> {
        const geo = await ctx.fetchInput()

        const startTime = this.param('startTime')!
        const endTime = this.param('endTime')!
        const startAngle = this.param('startAngle')!
        const endAngle = this.param('endAngle')!

        geo.forEach((idx, el) => {

            el.rotate({
                startTime: startTime.getWithElement({idx, el, geo: [geo]}),
                endTime: endTime.getWithElement({idx, el, geo: [geo]}),
                startAngle: startAngle.getWithElement({idx, el, geo: [geo]}) / 180 * Math.PI,
                endAngle: endAngle.getWithElement({idx, el, geo: [geo]}) / 180 * Math.PI,
                easing: Easing.QuadOut,
            })
        })

        return CookResult.success(geo);
    }
}