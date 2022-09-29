import {RegisterNode} from "@/editor/node/registry";
import {SimulationNode} from "@/editor/node/element/particle/simulation";
import {NodeBuilder} from "@/editor/node";
import {CookContext, CookResult} from "@/editor/node/cook.context";

@RegisterNode('Last Frame', ['fas', 'right-to-bracket'], 'simulation', 'simulation')
export class LastFrameNode extends SimulationNode {
    icon: string[] = ['fas', 'right-to-bracket'];

    define(builder: NodeBuilder) {
        builder
            .outputs(1)
    }

    cook(ctx: CookContext): CookResult {
        return CookResult.success(ctx.getInput())
    }

}