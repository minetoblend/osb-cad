import {ElementNode} from "@/editor/node/element";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {NodeBuilder} from "@/editor/node";
import {Easing} from "@/editor/objects/easing";


export class RotateNode extends ElementNode {
    type = 'rotate'
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

    async cook(ctx: CookContext): Promise<CookResult> {

        const geo = ctx.input[0] as SBCollection

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