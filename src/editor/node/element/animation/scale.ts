import {ElementNode} from "@/editor/node/element";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {NodeBuilder} from "@/editor/node";
import {Easing} from "@/editor/objects/easing";


export class ScaleNode extends ElementNode {
    type = 'scale'
    icon = ['fas', 'up-right-and-down-left-from-center']

    constructor(ctx: EditorContext) {
        super(ctx, 'Scale');
    }

    define(builder: NodeBuilder) {
        builder
            .inputs(1)
            .outputs(1)
            .parameters(param => param
                .int('startTime', 'Start Time', {defaultValue: 0, withIndex: true})
                .int('endTime', 'End Time', {defaultValue: 0, withIndex: true})
                .float('startScale', 'Start Scale', {defaultValue: 1, withIndex: true})
                .float('endScale', 'End Scale', {defaultValue: 1, withIndex: true})
            )
    }

    async cook(ctx: CookContext): Promise<CookResult> {

        const geo = ctx.input[0] as SBCollection

        const startTime = this.param('startTime')!
        const endTime = this.param('endTime')!
        const startScale = this.param('startScale')!
        const endScale = this.param('endScale')!

        geo.forEach((idx, el) => {

            el.scale({
                startTime: startTime.getWithElement({idx, el, geo: [geo]}),
                endTime: endTime.getWithElement({idx, el, geo: [geo]}),
                startScale: startScale.getWithElement({idx, el, geo: [geo]}),
                endScale: endScale.getWithElement({idx, el, geo: [geo]}),
                easing: Easing.QuadOut,
            })
        })

        return CookResult.success(geo);
    }
}