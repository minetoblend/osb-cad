import {RegisterNode} from "@/editor/node/registry";
import {SimulationNode} from "@/editor/node/element/particle/simulation";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {Vec2} from "@/util/math";
import {NodeBuilder} from "@/editor/node";


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

    async cook(ctx: CookContext): Promise<CookResult> {
        const geo = ctx.getInput()

        const attributeName = 'force'

        if (!geo.hasAttribute(attributeName)) {
            geo.addAttribute(attributeName, 'vec2')
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
                    .mulF(ctx.DELTA)
            )
        })

        return CookResult.success(geo)
    }


}