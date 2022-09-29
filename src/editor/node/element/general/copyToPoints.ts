import {ElementNode} from "@/editor/node/element";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {NodeBuilder} from "@/editor/node";
import {RegisterNode} from "@/editor/node/registry";
import {Vec2} from "@/util/math";
import {AttributeType} from "@/editor/objects/attribute";

@RegisterNode('CopyToPoints', ['fas', 'clone'], 'general')
export class CopyToPointsNode extends ElementNode {
    icon = ['far', 'clone'];

    constructor(ctx: EditorContext) {
        super(ctx, 'CopyToPoints');
    }

    define(builder: NodeBuilder) {
        builder
            .input('Geometry to copy')
            .input('Points to copy to')
            .outputs(1)
            .parameters(param => param
                .bool('fromCenter', 'Copy From Playfield Center')
                .bool('useTimingAttribute', 'Use timing attribute')
                .string('timingAttribute', 'Timing attribute', {defaultValue: 'time'})
            )
    }

    cook(ctx: CookContext): CookResult {
        const geo = new SBCollection();

        const geoToCopy = ctx.getInput()
        const pointsToCopyTo = ctx.getInput(1)
        const timingAttributeName = this.param('timingAttribute')!.get() as string
        const timingAttribute = pointsToCopyTo.getAttributeContainer(timingAttributeName)
        const fromCenter = this.param('fromCenter')!.get() as boolean
        const useTiming = !!this.param('useTimingAttribute')!.get() &&
            timingAttribute

        pointsToCopyTo.forEach((index, el) => {
            const copy = geoToCopy.clone()
            if (useTiming)
                copy.addAttribute(timingAttributeName, AttributeType.Float)

            copy.forEach((index1, el1) => {
                let pos = el._pos
                if (fromCenter)
                    pos = pos.sub(Vec2.playfieldCentre())
                el1.moveWithCommands(pos)

                if (useTiming) {
                    const value = timingAttribute!.getValue(index)
                    el1.offsetAnimation(value)
                    copy.setAttribute(timingAttributeName, index1, value)
                }

                el1.applyAnimationFrom(el)
            })

            geo.append(copy)
        })

        return CookResult.success(geo);
    }
}