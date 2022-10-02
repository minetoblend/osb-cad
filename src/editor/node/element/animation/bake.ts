import {RegisterNode} from "@/editor/node/registry";
import {ElementNode} from "@/editor/node/element";
import {CookResult} from "@/editor/node/cook.context";
import {Node, NodeBuilder, TimingInformation} from "@/editor/node";
import {NodeDependency} from "@/editor/node/dependency";
import {SBCollection} from "@/editor/objects/collection";
import {Easing} from "@/editor/objects/easing";
import {MarkDirtyReason} from "@/editor/node/markDirty";
import {NodeDependencyType} from "@/editor/compile";
import {CookJobContext} from "@/editor/cook/context";
import {EditorPath} from "@/editor/node/path";

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
            sampleTimes.push(
                Math.floor(Math.min(time, endTime))
            )
        }
        return sampleTimes
    }

    async cook(ctx: CookJobContext): Promise<CookResult> {
        const sampleTimes = this.getSampleTimes()

        if (sampleTimes.length === 0)
            return CookResult.success(new SBCollection())

        const geos = await Promise.all(sampleTimes.map(time => ctx.fetch(
            EditorPath.fromObject(this.inputs[0]).withQuery('time', time)
        )))
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
                    bakedSprite.move(Easing.Linear,
                        lastTime,
                        time,
                        lastSprite._pos,
                        sprite._pos
                    )
                }

                if (!sprite._scale.equals(lastSprite._scale)) {
                    bakedSprite.scaleVec(
                        Easing.Linear,
                        lastTime,
                        time,
                        lastSprite._scale,
                        sprite._scale,
                    )
                }

                if (sprite._rotation !== lastSprite._rotation) {
                    bakedSprite.rotate(
                        Easing.Linear,
                        lastTime,
                        time,
                        lastSprite._rotation,
                        sprite._rotation,
                    )
                }


                if (sprite._alpha !== lastSprite._alpha) {
                    bakedSprite.fade(
                        Easing.Linear,
                        lastTime,
                        time,
                        lastSprite._alpha,
                        sprite._alpha,
                    )
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
        if (reason?.expressionDependency === NodeDependencyType.Time) {
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
                it.dirty = true
                it.key = `frame:${time}`
                it.setQuery({time})
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