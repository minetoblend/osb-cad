import {RegisterNode} from "@/editor/node/registry";
import {SimulationNode} from "@/editor/node/element/particle/simulation";
import {CookResult} from "@/editor/node/cook.context";
import {NodeBuilder} from "@/editor/node";
import {AttributeType} from "@/editor/objects/attribute";
import {SBCollection} from "@/editor/objects/collection";
import {CookJobContext} from "@/editor/cook/context";


@RegisterNode('ParticleSolver', ['fas', 'server'], 'simulation', 'simulation')
export class ParticleSolverNode extends SimulationNode {
    icon = ['fas', 'server']

    define(builder: NodeBuilder) {
        builder
            .inputs(1)
            .outputs(1)
    }

    async cook(ctx: CookJobContext): Promise<CookResult> {
        const geo = await ctx.fetchInput() as SBCollection


        if (!geo.hasAttribute('force'))
            geo.addAttribute('force', AttributeType.Vec2)
        if (!geo.hasAttribute('vel'))
            geo.addAttribute('vel', AttributeType.Vec2)

        const delta = ctx.delta

        geo.filter((index) => {
            const lifetime = geo.getAttribute<number>('lifetime', index)
            const age = geo.getAttribute<number>('age', index) + delta
            if (age <= lifetime)
                geo.setAttribute('age', index, age)
            return age < lifetime
        })

        return CookResult.success(geo)
    }

    /**
     *
     */
}