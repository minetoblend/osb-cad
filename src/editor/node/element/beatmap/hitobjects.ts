import {ElementNode} from "@/editor/node/element";
import {CookContext, CookError, CookResult} from "@/editor/node/cook.context";
import {KeyframeInformation, NodeBuilder, TimingInformation} from "@/editor/node";
import {SBCollection} from "@/editor/objects/collection";
import {ExpressionDependency} from "@/editor/compile";
import {Vec2} from "@/util/math";
import {Origin} from "@/editor/objects/origin";
import {RegisterNode} from "@/editor/node/registry";

@RegisterNode('HitObjects', ['fas', 'dorchadas'], 'import')
export class HitObjectsNode extends ElementNode {

    icon: string[] = ['fas', 'dorchadas'];

    define(builder: NodeBuilder) {
        builder.outputs(1)
            .parameters(param => param
                .string('timingAttribute', 'Timing attribute', {defaultValue: 'time'})
            )
    }

    async cook(ctx: CookContext): Promise<CookResult> {

        const geo = new SBCollection()

        const beatmap = this.ctx.currentBeatmapObject.value
        if (!beatmap)
            return CookResult.failure([new CookError(this, 'No valid beatmap selected')])

        const timingAttributeName = this.param('timingAttribute')!.get()

        geo.addAttribute(timingAttributeName, 'number');

        if (beatmap) {
            beatmap.hitObjects.forEach(hitObject => {
                if (hitObject.objectName === "circle" || hitObject.objectName === 'slider') {
                    const {index} = geo.addSprite(
                        new Vec2(hitObject.position[0] + 60, hitObject.position[1] + 55),
                        Origin.Centre,
                    )
                    geo.setAttribute(timingAttributeName, index, hitObject.startTime)
                }
            })
        }

        return CookResult.success(geo);
    }

    updateDependencies() {
        super.updateDependencies();
        this.dependencies.add(ExpressionDependency.Beatmap)
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