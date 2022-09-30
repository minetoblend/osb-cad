import {RegisterNode} from "@/editor/node/registry";
import {SimulationNode} from "@/editor/node/element/particle/simulation";
import {CookResult} from "@/editor/node/cook.context";
import {Vec2} from "@/util/math";
import {NodeBuilder} from "@/editor/node";
import {AttributeType} from "@/editor/objects/attribute";
import {CookJobContext} from "@/editor/cook/context";


@RegisterNode('Gravity', ['fas', 'arrows-down-to-line'], 'simulation', 'simulation')
export class GravityNode extends SimulationNode {
    icon = ['fas', 'arrows-down-to-line']

    define(builder: NodeBuilder) {
        builder
            .inputs(1)
            .outputs(1)
            .parameters(param =>
                param.vec2('gravity', 'Gravity', {withIndex: true, defaultValue: new Vec2(0, 10)})
            )
    }

    async cook(ctx: CookJobContext): Promise<CookResult> {
        const geo = await ctx.fetchInput()

        const attributeName = 'force'

        if (!geo.hasAttribute(attributeName)) {
            geo.addAttribute(attributeName, AttributeType.Vec2)
        }

        const attribute = geo.getAttributeContainer<Vec2>(attributeName)!
        const xParam = this.param('gravity.x')!
        const yParam = this.param('gravity.y')!

        geo.forEach((idx, el) => {
            attribute.setValue(idx,
                (attribute.getValue(idx) as Vec2)
                    .add(new Vec2(
                        xParam.getWithElement({idx, el, geo: [geo], ...ctx}),
                        yParam.getWithElement({idx, el, geo: [geo], ...ctx})
                    ))
            )
        })

        return CookResult.success(geo)
    }


}