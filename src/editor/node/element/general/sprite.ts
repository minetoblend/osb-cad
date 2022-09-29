import {ElementNode} from "@/editor/node/element";
import {EditorContext} from "@/editor/ctx/context";
import {NodeBuilder} from "@/editor/node";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {Vec2} from "@/util/math";
import {Origin} from "@/editor/objects/origin";
import {NodeDependencyType} from "@/editor/compile";
import {RegisterNode} from "@/editor/node/registry";

@RegisterNode('Sprite', ['fas', 'image'], 'objects')
export class SpriteNode extends ElementNode {
    icon = ['far', 'image'];

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

    cook(ctx: CookContext): CookResult {
        const collection = new SBCollection()
        const spriteName = this.getParam<string>('sprite')
        const spriteId = this.ctx.fileStore.getTextureId(spriteName)


        collection.addSprite(
            this.chv2('position'),
            this.getParam<Origin>('origin'),
            spriteId,
            this.chv2('scale'),
        )

        return CookResult.success(collection);
    }

    private getParam<T>(id: string) {
        return this.param(id)!.get() as unknown as T
    }

    updateDependencies() {
        super.updateDependencies();
        this.dependencies.add(NodeDependencyType.Texture)
    }
}