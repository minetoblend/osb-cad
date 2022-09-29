import {RegisterNode} from "@/editor/node/registry";
import {SimulationNode} from "@/editor/node/element/particle/simulation";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {NodeBuilder} from "@/editor/node";
import {AttributeType} from "@/editor/objects/attribute";
import {SBCollection} from "@/editor/objects/collection";


@RegisterNode('ParticleSolver', ['fas', 'server'], 'simulation', 'simulation')
export class ParticleSolverNode extends SimulationNode {
    icon = ['fas', 'server']

    define(builder: NodeBuilder) {
        builder
            .inputs(1)
            .outputs(1)
    }

    cook(ctx: CookContext): CookResult {
        const geo = ctx.fetchInput() as SBCollection


        if (!geo.hasAttribute('force'))
            geo.addAttribute('force', AttributeType.Vec2)
        if (!geo.hasAttribute('vel'))
            geo.addAttribute('vel', AttributeType.Vec2)

        //const delta = ctx.DELTA / 250

        geo.filter((index) => {
            const lifetime = geo.getAttribute<number>('lifetime', index)
            const age = geo.getAttribute<number>('age', index) + ctx.DELTA
            if (age <= lifetime)
                geo.setAttribute('age', index, age)
            return age < lifetime
        })
        /*
                geo.forEach((index, el) => {
                    const vel = geo.getAttribute<Vec2>('vel', index)
                    const force = geo.getAttribute<Vec2>('force', index)

                    el._pos = el._pos.add(vel.mulF(delta));
                    geo.setAttribute('vel', index, vel.add(
                        force.mulF(delta)
                    ))
                    geo.setAttribute('force', index, Vec2.zero());
                })*/

        return CookResult.success(geo)
    }

    /**
     *
     */
}