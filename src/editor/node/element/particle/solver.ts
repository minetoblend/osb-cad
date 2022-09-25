import {RegisterNode} from "@/editor/node/registry";
import {SimulationNode} from "@/editor/node/element/particle/simulation";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {NodeBuilder} from "@/editor/node";
import {Vec2} from "@/util/math";


@RegisterNode('ParticleSolver', ['fas', 'server'], 'simulation', 'simulation')
export class ParticleSolverNode extends SimulationNode {
    icon = ['fas', 'server']

    define(builder: NodeBuilder) {
        builder
            .inputs(1)
            .outputs(1)
    }

    async cook(ctx: CookContext): Promise<CookResult> {
        const geo = ctx.getInput()

        if (!geo.hasAttribute('force'))
            geo.addAttribute('force', 'vec2')
        if (!geo.hasAttribute('vel'))
            geo.addAttribute('vel', 'vec2')

        const delta = ctx.DELTA / 250

        geo.forEach((index, el) => {
            const vel = geo.getAttribute<Vec2>('vel', index)
            const force = geo.getAttribute<Vec2>('force', index)

            el._pos = el._pos.add(vel.mulF(delta));
            geo.setAttribute('vel', index, vel.add(
                force.mulF(delta)
            ))
            geo.setAttribute('force', index, Vec2.zero());
        })

        return CookResult.success(geo)
    }

    /**
     *
     */
}