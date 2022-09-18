import {ElementNode} from "@/editor/node/element";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {NodeBuilder} from "@/editor/node";
import {Easing} from "@/editor/objects/easing";
import {Color} from "@/util/math";


export class ColorNode extends ElementNode {
    type = 'color'
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

    async cook(ctx: CookContext): Promise<CookResult> {

        const geo = ctx.input[0] as SBCollection

        const startTime = this.param('startTime')!
        const endTime = this.param('endTime')!
        //const startColor = this.param('startColor')!
        //const endColor = this.param('endColor')!

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