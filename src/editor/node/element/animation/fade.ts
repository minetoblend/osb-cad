import {ElementNode} from "@/editor/node/element";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {NodeBuilder} from "@/editor/node";
import {Easing} from "@/editor/objects/easing";


export class FadeNode extends ElementNode {
    type = 'fade'
    icon = ['fas', 'circle-half-stroke']

    constructor(ctx: EditorContext) {
        super(ctx, 'Fade');
    }

    define(builder: NodeBuilder) {
        builder
            .inputs(1)
            .outputs(1)
            .parameters(param => param
                .int('startTime', 'Start Time', {defaultValue: 0, withIndex: true})
                .int('endTime', 'End Time', {defaultValue: 0, withIndex: true})
                .float('startAlpha', 'Start Alpha', {defaultValue: 1, withIndex: true})
                .float('endAlpha', 'End Alpha', {defaultValue: 1, withIndex: true})
            )
    }

    async cook(ctx: CookContext): Promise<CookResult> {

        const geo = ctx.input[0] as SBCollection

        const startTime = this.param('startTime')!
        const endTime = this.param('endTime')!
        const startAlpha = this.param('startAlpha')!
        const endAlpha = this.param('endAlpha')!

        geo.forEach((idx, el) => {

            el.fade({
                startTime: startTime.getWithElement({idx, el, geo: [geo]}),
                endTime: endTime.getWithElement({idx, el, geo: [geo]}),
                startAlpha: startAlpha.getWithElement({idx, el, geo: [geo]}),
                endAlpha: endAlpha.getWithElement({idx, el, geo: [geo]}),
                easing: Easing.QuadOut,
            })
        })

        return CookResult.success(geo);
    }
}