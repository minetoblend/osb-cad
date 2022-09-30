import {RegisterNode} from "@/editor/node/registry";
import {SimulationNode} from "@/editor/node/element/particle/simulation";
import {NodeBuilder} from "@/editor/node";
import {CookError, CookResult} from "@/editor/node/cook.context";
import {CookJobContext} from "@/editor/cook/context";
import {SBCollection} from "@/editor/objects/collection";

@RegisterNode('Last Frame', ['fas', 'right-to-bracket'], 'simulation', 'simulation')
export class LastFrameNode extends SimulationNode {
    icon: string[] = ['fas', 'right-to-bracket'];

    define(builder: NodeBuilder) {
        builder
            .outputs(1)
    }

    async cook(ctx: CookJobContext): Promise<CookResult> {
        const geo = ctx.inject<SBCollection>('lastFrame')

        if (geo instanceof SBCollection) {
            return CookResult.success(geo)
        }

        return CookResult.failure([new CookError(this, 'Could not get input')])
    }

}