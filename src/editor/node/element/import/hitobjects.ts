import {ElementNode} from "@/editor/node/element";
import {CookContext, CookError, CookResult} from "@/editor/node/cook.context";
import {KeyframeInformation, NodeBuilder, TimingInformation} from "@/editor/node";
import {SBCollection} from "@/editor/objects/collection";
import {NodeDependencyType} from "@/editor/compile";
import {Vec2} from "@/util/math";
import {Origin} from "@/editor/objects/origin";
import {RegisterNode} from "@/editor/node/registry";
import {AttributeType} from "@/editor/objects/attribute";

@RegisterNode('HitObjects', ['fas', 'dorchadas'], 'import')
export class HitObjectsNode extends ElementNode {

    icon: string[] = ['fas', 'dorchadas'];

    define(builder: NodeBuilder) {
        builder.outputs(1)
            .parameters(param => param
                .string('timingAttribute', 'Timing attribute', {defaultValue: 'time'})
                .bool('sliderEnds', 'Add Slider Ends', {defaultValue: 1})
                .bool('sliderRepeats', 'Add Slider Repeats', {defaultValue: 1})
            )
    }

    cook(ctx: CookContext): CookResult {
        const geo = new SBCollection()

        const beatmap = this.ctx.currentBeatmapObject.value
        if (!beatmap)
            return CookResult.failure([new CookError(this, 'No valid beatmap selected')])

        const timingAttributeName = this.param('timingAttribute')!.get()
        const sliderEnds = !!this.param('sliderEnds')!.get()
        const sliderRepeats = !!this.param('sliderRepeats')!.get()
        geo.addAttribute(timingAttributeName, AttributeType.Float);

        beatmap.hitObjects.forEach(hitObject => {
            const playfieldOffset = new Vec2(60, 55)
            const startPosition = new Vec2(hitObject.position[0], hitObject.position[1]).add(playfieldOffset)

            if (hitObject.objectName === "circle" || hitObject.objectName === 'slider') {
                const {index} = geo.addSprite(
                    startPosition,
                    Origin.Centre,
                )
                geo.setAttribute(timingAttributeName, index, hitObject.startTime)
            }
            if (hitObject.objectName === 'slider') {
                const endPosition = new Vec2(hitObject.endPosition![0], hitObject.endPosition![1]).add(playfieldOffset)
                const repeatCount = hitObject.repeatCount!
                const repeatDuration = hitObject.duration! / hitObject.repeatCount!
                for (let i = 0; i < repeatCount; i++) {
                    if (i < repeatCount - 1 && !sliderRepeats)
                        continue;
                    if (i === repeatCount - 1 && !sliderEnds)
                        continue;

                    const pos = i % 2 === 0 ? endPosition : startPosition;
                    const {index} = geo.addSprite(
                        pos,
                        Origin.Centre,
                    )
                    geo.setAttribute(timingAttributeName, index, hitObject.startTime + repeatDuration * (i + 1))
                }
            }
        })

        return CookResult.success(geo);
    }

    updateDependencies() {
        super.updateDependencies();
        this.dependencies.add(NodeDependencyType.Beatmap)
    }

    get timingInformation(): TimingInformation | undefined {
        const beatmap = this.ctx.currentBeatmapObject.value
        if (!beatmap)
            return undefined

        const keyframes: KeyframeInformation[] = beatmap.hitObjects.map(hitobject => {
            return {
                time: hitobject.startTime,
                type: hitobject.objectName,
                duration: hitobject.duration
            }
        })

        if (beatmap && beatmap.hitObjects.length > 0) {
            return {
                startTime: beatmap.hitObjects[0].startTime,
                endTime: beatmap.hitObjects[beatmap.hitObjects.length - 1].startTime,
                keyframes,
                type: 'beatmap'
            }
        }

        return undefined;
    }

}