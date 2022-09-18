import {ElementNode} from "@/editor/node/element/index";
import {EditorContext} from "@/editor/ctx/context";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {NodeBuilder} from "@/editor/node";

export class CopyToPointsNode extends ElementNode {
    type = 'copyToPoints'
        icon = ['far', 'clone'];

    constructor(ctx: EditorContext) {
        super(ctx, 'CopyToPoints');
    }

    define(builder: NodeBuilder) {
        builder
            .input('Geometry to copy')
            .input('Points to copy to')
            .outputs(1)

    }

    async cook(ctx: CookContext): Promise<CookResult> {
        const geo = new SBCollection();

        const geoToCopy = ctx.input[0] as SBCollection
        const pointsToCopyTo = ctx.input[1] as SBCollection

        pointsToCopyTo.forEach((index, el) => {
            const copy = geoToCopy.clone()

            copy.forEach((index1, el1) => {
                el1.moveWithCommands(el.pos)
            })

            geo.append(copy)
        })

        return CookResult.success(geo);
    }
}