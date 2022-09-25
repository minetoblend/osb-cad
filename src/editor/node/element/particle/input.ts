import {SimulationNode} from "@/editor/node/element/particle/simulation";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {Node, NodeBuilder} from "@/editor/node";
import {RegisterNode} from "@/editor/node/registry";
import {ParticleSystem} from "@/editor/node/element";
import {NodeDependency} from "@/editor/node/dependency";

@RegisterNode('Input', ['fas', 'right-to-bracket'], 'simulation', 'simulation')
export class SimulationInputNode extends SimulationNode {
    icon: string[] = ['fas', 'right-to-bracket'];

    define(builder: NodeBuilder) {
        builder
            .outputs(1)
            .parameters(param => param
                .int('input', 'Input')
            )
    }

    async cook(ctx: CookContext): Promise<CookResult> {
        return CookResult.success(
            ctx.input[0][0]
        )
    }

    findDependenciesForCooking(visited: Set<Node> = new Set<Node>()): NodeDependency[] {
        const particleSystem = this.getParticleSystem()
        if (!particleSystem)
            return []

        const inputIndex = this.param('input')!.get()

        const input = particleSystem.inputs[inputIndex]
        if (input && input.connections.length > 0) {
            const connection = input.connections[0]
            return [
                new NodeDependency(connection.from.node, inputIndex, connection.from.index)
            ]
        } else {
            return [NodeDependency.empty(inputIndex)]
        }
    }

    getParticleSystem(): ParticleSystem | undefined {
        if (this.parent instanceof ParticleSystem)
            return this.parent
        return undefined
    }

}

@RegisterNode('Last Frame', ['fas', 'right-to-bracket'], 'simulation', 'simulation')
export class LastFrameNode extends SimulationNode {
    icon: string[] = ['fas', 'right-to-bracket'];

    define(builder: NodeBuilder) {
        builder
            .outputs(1)
    }

    async cook(ctx: CookContext): Promise<CookResult> {
        return CookResult.success(ctx.getInput())
    }

}