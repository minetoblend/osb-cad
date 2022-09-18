import {ElementNode} from "@/editor/node/element/index";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {EditorContext} from "@/editor/ctx/context";
import {NodeBuilder} from "@/editor/node";
import {Vec2} from "@/util/math";
import {SBCollection} from "@/editor/objects/collection";
import {Origin} from "@/editor/objects/origin";

export class GridNode extends ElementNode {
    type = 'grid'
    icon = ['fas', 'grip'];


    constructor(ctx: EditorContext) {
        super(ctx, 'Grid');
    }

    define(builder: NodeBuilder) {
        builder
            .outputs(1)
            .parameters(param => param
                .vec2('centre', 'Centre', {defaultValue: Vec2.playfieldCentre()})
                .vec2('size', 'Size', {defaultValue: new Vec2(100, 100)})
                .int('xDivisions', 'X Divisions', {defaultValue: 5})
                .int('yDivisions', 'Y Divisions', {defaultValue: 5})

                .int('sprite', 'Sprite', {defaultValue: -1})
                .vec2('spriteScale', 'Sprite Scale', {defaultValue: Vec2.one()})
            )
    }

    async cook(ctx: CookContext): Promise<CookResult> {

        const geo = new SBCollection()

        const centre = this.chv2('centre')
        const size = this.chv2('size')
        const xDivisions = this.param('xDivisions')!.get()
        const yDivisions = this.param('yDivisions')!.get()
        const sprite = this.param('sprite')!.get()
        const spriteScale = this.chv2('spriteScale')

        for (let x = 0; x < xDivisions; x++) {
            for (let y = 0; y < yDivisions; y++) {
                const tx = xDivisions === 1 ? 0 :
                    (x / (xDivisions - 1) - 0.5) * size.x
                const ty =
                    yDivisions === 1 ? 0 :
                        (y / (yDivisions - 1) - 0.5) * size.y

                geo.addSprite(
                    new Vec2(tx, ty)
                        .add(centre),
                    Origin.Centre,
                    sprite,
                    spriteScale,
                )
            }
        }

        return CookResult.success(geo)
    }


}