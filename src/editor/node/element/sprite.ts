import {ElementNode} from "@/editor/node/element/index";
import {EditorContext} from "@/editor/ctx/context";
import {NodeBuilder} from "@/editor/node";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {Vec2} from "@/util/math";
import {Origin} from "@/editor/objects/origin";

export class SpriteNode extends ElementNode {
    icon = ['far', 'image'];
    type = 'sprite'

    constructor(ctx: EditorContext) {
        super(ctx, 'Sprite');
    }

    define(builder: NodeBuilder) {
        builder
            .outputs(1)
            .parameters(param => param
                .sprite('sprite', 'Sprite')
                .vec2('position', 'Position')
                .vec2('scale', 'Scale', {defaultValue: Vec2.one()})
                .origin('origin', 'Origin', {})
            )
    }

    async cook(ctx: CookContext): Promise<CookResult> {
        const collection = new SBCollection()

        collection.addSprite(
            this.chv2('position'),
            this.getParam<Origin>('origin'),
            this.getParam<number>('sprite'),
            this.chv2('scale'),
        )

        return CookResult.success(collection);
    }

    private getParam<T>(id: string) {
        return this.param(id)!.get() as unknown as T
    }
}