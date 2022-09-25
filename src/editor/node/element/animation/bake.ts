import {RegisterNode} from "@/editor/node/registry";
import {ElementNode} from "@/editor/node/element";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {Node, NodeBuilder, TimingInformation} from "@/editor/node";
import {NodeDependency} from "@/editor/node/dependency";
import {SBCollection} from "@/editor/objects/collection";
import {Easing} from "@/editor/objects/easing";
import {MarkDirtyReason} from "@/editor/node/markDirty";
import {ExpressionDependency} from "@/editor/compile";

@RegisterNode('BakeAnimation', ['fas', 'bread-slice'], 'animation')
export class BakeAnimationNode extends ElementNode {
    icon = ['fas', 'bread-slice'];

    define(builder: NodeBuilder) {
        builder
            .inputs(1)
            .outputs(1)
            .parameters(param => param
                .int('startTime', 'Start Time')
                .int('endTime', 'End Time')
                .int('interval', 'Interval', {defaultValue: 50})
            )
    }

    getSampleTimes(): number[] {
        const startTime = this.param('startTime')!.get()
        const endTime = this.param('endTime')!.get()
        const interval = this.param('interval')!.get()

        if (endTime <= startTime)
            return [];


        const sampleTimes: number[] = []
        for (let time = startTime; time < endTime + interval; time += interval) {
            sampleTimes.push(Math.min(time, endTime))
        }
        return sampleTimes
    }

    async cook(ctx: CookContext): Promise<CookResult> {
        const sampleTimes = this.getSampleTimes()

        if (sampleTimes.length === 0)
            return CookResult.success(new SBCollection())

        const geos = sampleTimes.map(time => ctx.getInput(0, time))
        const geo = geos.shift()!


        let lastTime = sampleTimes[0]
        let lastGeo = geo
        sampleTimes.slice(1).forEach((time, timeIndex) => {
            const currentGeo = geos[timeIndex]

            currentGeo.forEach((spriteIndex, sprite) => {
                let bakedSprite = geo.getSprite(spriteIndex)
                if (!bakedSprite)
                    bakedSprite = sprite.clone()

                let lastSprite = lastGeo.getSprite(spriteIndex)

                if (!lastSprite)
                    return;

                if (!sprite._pos.equals(lastSprite._pos)) {
                    bakedSprite.move({
                        startTime: lastTime,
                        endTime: time,
                        startPos: lastSprite._pos,
                        endPos: sprite._pos,
                        easing: Easing.Linear
                    })
                }

                if (!sprite._scale.equals(lastSprite._scale)) {
                    bakedSprite.scaleVec({
                        startTime: lastTime,
                        endTime: time,
                        startScale: lastSprite._scale,
                        endScale: sprite._scale,
                        easing: Easing.Linear
                    })
                }

                if (sprite._rotation !== lastSprite._rotation) {
                    bakedSprite.rotate({
                        startTime: lastTime,
                        endTime: time,
                        startAngle: lastSprite._rotation,
                        endAngle: sprite._rotation,
                        easing: Easing.Linear
                    })
                }

                if (!bakedSprite.hasNoAnimation && !geo.getSprite(spriteIndex)) {
                    geo.addElement(bakedSprite)
                }
            })
            lastGeo = currentGeo
            lastTime = time
        })


        return CookResult.success(geo)
    }

    markDirty(reason?: MarkDirtyReason, visited: Set<Node> = new Set<Node>()) {
        if (reason?.expressionDependency === ExpressionDependency.Time) {
            return;
        }
        super.markDirty(reason, visited);
    }


    findDependenciesForCooking(visited: Set<Node> = new Set<Node>()): NodeDependency[] {
        const dependencies: NodeDependency[] = [];

        const sampleTimes = this.getSampleTimes()


        for (const time of sampleTimes) {
            const dependenciesAtTime = super.findDependenciesForCooking(new Set(visited));

            dependenciesAtTime.forEach(it => {
                it.time = time
                it.dirty = true
                it.key = time
            })

            dependencies.push(...dependenciesAtTime)
        }

        return dependencies
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