import {RegisterNode} from "@/editor/node/registry";
import {CookContext, CookError, CookResult, CookResultType} from "@/editor/node/cook.context";
import {NodeSystem} from "@/editor/node/system";
import {Node, NodeBuilder, TimingInformation} from "@/editor/node";
import {Deserializer, SerializedNodeSystem} from "@/editor/ctx/serialize";
import {LastFrameNode, SimulationInputNode} from "@/editor/node/element/particle/input";
import {SimulationNode} from "@/editor/node/element/particle/simulation";
import {NullNode} from "@/editor/node/element";
import {Vec2} from "@/util/math";
import {SBCollection} from "@/editor/objects/collection";
import {NodeDependencyType} from "@/editor/compile";
import {MarkDirtyReason} from "@/editor/node/markDirty";
import {NodeDependency} from "@/editor/node/dependency";
import {animationFrameAsPromise} from "@/util/promise";

@RegisterNode('ParticleSystem', ['fas', 'explosion'], 'objects')
export class ParticleSystem extends NodeSystem<SimulationNode> {
    icon = ['fas', 'explosion']

    nodeType = 'simulation'

    define(builder: NodeBuilder) {
        builder
            .inputs(4)
            .outputs(1)
            .parameters(param => param
                .int('startTime', 'Start Time')
                .int('endTime', 'End Time')
                .int('interval', 'Interval', {defaultValue: 50})
            )
    }

    updateDependencies() {
        super.updateDependencies();
        this.dependencies.add(NodeDependencyType.Time)
    }

    markDirty(reason?: MarkDirtyReason, visited: Set<Node> = new Set<Node>()): void {
        super.markDirty(reason, visited);
        if (reason?.expressionDependency !== NodeDependencyType.Time)
            this.simulationDirty = true
    }

    initFromData(data: Partial<SerializedNodeSystem>, deserializer: Deserializer) {
        super.initFromData(data, deserializer)

        if (data.nodes === undefined) {
            const lastFrameNode = new LastFrameNode(this.ctx, 'Last Frame')
            this.add(lastFrameNode)

            for (let i = 0; i < 4; i++) {
                const inputNode = new SimulationInputNode(this.ctx, 'Input' + i)
                inputNode.position.value.x = i * 200 + 200
                inputNode.param('input')!.set(i)

                this.add(inputNode)
            }

            const outputNode = new NullNode(this.ctx)
            outputNode.name.value = 'Output'
            outputNode.position.value = new Vec2(0, 400)
            this.add(outputNode)
            this.addConnection(lastFrameNode.outputs[0], outputNode.inputs[0])
            this.outputNode.value = outputNode.name.value
        }
    }

    simulationDirty = true
    simulationCache: SimulationCachedFrame[] = []

    cooking?: Promise<void>

    async cook(ctx: CookContext): Promise<CookResult> {
        if (this.cooking)
            await this.cooking;

        const startTime = this.param('startTime')!.get()
        const endTime = this.param('endTime')!.get()
        const interval = this.param('interval')!.get()

        if (ctx.TIME < startTime || ctx.TIME > endTime)
            return CookResult.success(new SBCollection())

        if (!this.simulationDirty) {
            let {index, found} = this.findCacheIndex(ctx.TIME)
            if (!found)
                index--

            return CookResult.success(this.simulationCache[index].geometry)
        }


        if (!this.outputNode.value)
            return CookResult.success(new SBCollection())

        const outputNode = this.getNode(this.outputNode.value!)!
        const simulation: SimulationCachedFrame[] = []

        let onFinish: Function = () => {
        };
        this.cooking = new Promise(resolve => onFinish = resolve)
        await animationFrameAsPromise()


        let lastTime = startTime
        for (let time = startTime; time < endTime + interval; time += interval) {
            time = Math.min(time, endTime)

            const lastFrame = simulation[simulation.length - 1] ?? new SimulationCachedFrame(time - interval, new SBCollection())

            await animationFrameAsPromise()

            // console.log('cooking frame ' + time)

            const dependency = new NodeDependency(outputNode, 0, 0, true)
            dependency.time = time
            dependency.delta = time - lastTime


            this.lastUpdate = performance.now()
            const result = await this.cookNode(dependency, lastFrame)
            if (result.type !== CookResultType.Success) {
                return CookResult.failure([], [...result.errors, ...result.upstreamErrors])
            }

            simulation.push(new SimulationCachedFrame(time, result.outputData[0]))
            lastTime = time
        }

        this.simulationDirty = false
        this.simulationCache = simulation


        let {index, found} = this.findCacheIndex(ctx.TIME)
        if (!found)
            index--

        this.cooking = undefined
        onFinish();

        return CookResult.success(this.simulationCache[index].geometry)
    }

    lastUpdate = performance.now()

    private async cookNode(dependency: NodeDependency, lastFame: SimulationCachedFrame): Promise<CookResult> {
        const node = dependency.node!
        let result = CookResult.failure()

        if (performance.now() - this.lastUpdate > 50) {
            console.log('wait')
            await animationFrameAsPromise()
            this.lastUpdate = performance.now()
        }

        try {
            let ctx: CookContext;

            if (node instanceof LastFrameNode) {
                ctx = new CookContext(this.ctx, [], dependency, () => new SBCollection())
                ctx.input[0] = [lastFame.geometry]
            } else {
                const dependencies = node!.findDependenciesForCooking()
                dependencies.forEach(it => it.assignFromDownstream(dependency))

                await Promise.all(dependencies.filter(it => it.node).map(dependency => this.cookNode(dependency, lastFame)))

                const failedDependencies = dependencies.filter(it => it.result && it.result.type === CookResultType.Failure)
                if (failedDependencies.length > 0) {
                    const upstreamErrors: CookError[] = []
                    failedDependencies.forEach(it => upstreamErrors.push(
                        ...it.result?.errors ?? []
                    ))
                    failedDependencies.forEach(it => upstreamErrors.push(
                        ...it.result?.upstreamErrors ?? []
                    ))
                    result = CookResult.failure([], upstreamErrors)
                    dependency.result = result
                    return result;
                }
                ctx = new CookContext(this.ctx, dependencies, dependency, () => new SBCollection())

            }

            result = await node.cook(ctx)
            dependency.result = result
        } catch (e) {
            result = CookResult.failure([new CookError(node, (e as Error).message)])
            console.error(e)
        }

        return result
    }

    private findCacheIndex(time: number): { found: boolean, index: number } {
        let index = 0
        let left = 0;
        let right = this.simulationCache.length - 1;
        while (left <= right) {
            index = left + ((right - left) >> 1);
            let commandTime = this.simulationCache[index].time;
            if (commandTime == time)
                return {found: true, index};
            else if (commandTime < time)
                left = index + 1;
            else right = index - 1;
        }
        index = left;
        return {found: false, index};
    }

    findDependenciesForCooking(visited: Set<Node> = new Set<Node>()): NodeDependency[] {
        return [];
    }

    get timingInformation(): TimingInformation | undefined {
        const start = this.param('startTime')!.get()
        const end = this.param('endTime')!.get()
        return {
            type: "animation",
            startTime: start,
            endTime: end,
            keyframes: [
                {time: start},
                {time: end},
            ]
        }
    }
}

export class SimulationCachedFrame {
    constructor(readonly time: number, readonly geometry: SBCollection) {
    }

}