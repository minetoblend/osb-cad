import {ElementNode} from "@/editor/node/element";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {EditorContext} from "@/editor/ctx/context";
import {NodeBuilder} from "@/editor/node";
import {Vec2} from "@/util/math";
import {SBCollection} from "@/editor/objects/collection";
import {Origin} from "@/editor/objects/origin";
import {RegisterNode} from "@/editor/node/registry";
import Prando from 'prando';

@RegisterNode('Scatter', ['fas', 'spray-can'], 'objects')
export class ScatterNode extends ElementNode {
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
                .int('amount', 'Amount', {defaultValue: 20})
                .int('seed', 'Seed')
            )
    }

    cook(ctx: CookContext): CookResult {
        const geo = new SBCollection()

        const centre = this.chv2('centre')
        const size = this.chv2('size')
        const amount = this.param('amount')!.get(ctx)
        const seed = this.param('seed')!.get(ctx)

        const rng = new Prando(seed * 1000)

        for (let i = 0; i < amount; i++) {
            const position = centre.add(size.mul(new Vec2(
                rng.next(-0.5, 0.5),
                rng.next(-0.5, 0.5)
            )))
            geo.addSprite(
                position,
                Origin.Centre
            )
        }

        return CookResult.success(geo)
    }


}