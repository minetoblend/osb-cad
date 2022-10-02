import {RegisterNode} from "@/editor/node/registry";
import {CookResult, CookResultType} from "@/editor/node/cook.context";
import {NodeSystem} from "@/editor/node/system";
import {Node, NodeBuilder, TimingInformation} from "@/editor/node";
import {Deserializer, SerializedNodeSystem} from "@/editor/ctx/serialize";
import {InputNode} from "@/editor/node/element/general/input";
import {SimulationNode} from "@/editor/node/element/particle/simulation";
import {NullNode} from "@/editor/node/element";
import {Vec2} from "@/util/math";
import {SBCollection} from "@/editor/objects/collection";
import {NodeDependencyType} from "@/editor/compile";
import {MarkDirtyReason} from "@/editor/node/markDirty";
import {NodeDependency} from "@/editor/node/dependency";
import {animationFrameAsPromise} from "@/util/promise";
import {LastFrameNode} from "@/editor/node/element/particle/input";
import {CookJobContext} from "@/editor/cook/context";
import {shallowRef} from "vue";

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
        if (reason?.expressionDependency !== NodeDependencyType.Time) {
            this.simulationCache.value = []
        }
    }

    initFromData(data: Partial<SerializedNodeSystem>, deserializer: Deserializer) {
        super.initFromData(data, deserializer)

        if (data.nodes === undefined) {
            const lastFrameNode = new LastFrameNode(this.ctx, 'Last Frame')
            this.add(lastFrameNode)

            for (let i = 0; i < 4; i++) {
                const inputNode = new InputNode(this.ctx, 'Input' + i)
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

    simulationCache = shallowRef<SimulationCachedFrame[]>([])

    cooking?: Promise<void>

    lastUpdate = performance.now()

    async cook(ctx: CookJobContext): Promise<CookResult> {
        if (this.cooking)
            await this.cooking;

        let startTime = this.param('startTime')!.get()
        const endTime = this.param('endTime')!.get()
        const interval = this.param('interval')!.get()

        if (ctx.time < startTime || ctx.time > endTime)
            return CookResult.success(new SBCollection())

        if (!this.outputNode.value)
            return CookResult.success(new SBCollection())

        const outputNode = this.getNode(this.outputNode.value!)!
        const simulation = this.simulationCache.value

        let onFinish: Function = () => {
        };
        this.cooking = new Promise(resolve => onFinish = resolve)

        let lastTime = startTime - interval

        if (this.simulationCache.value.length > 0) {
            startTime = this.simulationCache.value[this.simulationCache.value.length - 1].time + interval
            lastTime = startTime = this.simulationCache.value[this.simulationCache.value.length - 1].time
        }


        this.lastUpdate = performance.now()

        for (let time = startTime; time < endTime + interval && time < ctx.time; time += interval) {
            time = Math.min(time, endTime)

            const lastFrame = simulation[simulation.length - 1]?.geometry ?? new SBCollection()

            if (performance.now() > this.lastUpdate + 200) {
                await animationFrameAsPromise()
                this.lastUpdate = performance.now()
            }

            ctx.provide('lastFrame', lastFrame)

            const result = await ctx.fetchResult(outputNode.path
                .withQuery('time', time)
                .withQuery('delta', time - lastTime)
            )

            if (result.type !== CookResultType.Success) {
                onFinish();
                return CookResult.failure([], [...result.errors, ...result.upstreamErrors])
            }

            simulation.push(new SimulationCachedFrame(time, result.outputData[0]))
            lastTime = time
        }

        this.simulationCache.value = [...simulation]

        let {index, found} = this.findCacheIndex(ctx.time)
        if (!found)
            index--

        this.cooking = undefined
        onFinish();

        return CookResult.success(this.simulationCache.value[index].geometry)
    }

    private findCacheIndex(time: number): { found: boolean, index: number } {
        let index = 0
        let left = 0;
        let right = this.simulationCache.value.length - 1;
        while (left <= right) {
            index = left + ((right - left) >> 1);
            let commandTime = this.simulationCache.value[index].time;
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
        let end = start //this.param('endTime')!.get()

        if (this.simulationCache.value.length) {
            end = this.simulationCache.value[this.simulationCache.value.length - 1].time
        }

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