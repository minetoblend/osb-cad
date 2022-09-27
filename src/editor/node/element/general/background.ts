import {ElementNode} from "@/editor/node/element";
import {EditorContext} from "@/editor/ctx/context";
import {NodeBuilder} from "@/editor/node";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {Origin} from "@/editor/objects/origin";
import {Vec2} from "@/util/math";
import {NodeDependencyType} from "@/editor/compile";
import {RegisterNode} from "@/editor/node/registry";

@RegisterNode('Background', ['fas', 'panorama'], 'objects')
export class BackgroundNode extends ElementNode {
    icon = ['fas', 'panorama'];

    constructor(ctx: EditorContext) {
        super(ctx, 'Sprite');
    }

    define(builder: NodeBuilder) {
        builder
            .outputs(1)
            .parameters(param => param
                .sprite('sprite', 'Sprite')
                .float('scale', 'Scale', {defaultValue: 1})
            )
    }

    async cook(ctx: CookContext): Promise<CookResult> {
        const collection = new SBCollection()
        const spriteName = this.getParam<string>('sprite')

        const spriteId = this.ctx.fileStore.getTextureId(spriteName)
        const texture = this.ctx.fileStore.textures[spriteId]?.texture

        let scale = 1
        if (texture)
            scale = Math.max(640 / texture.width, 480 / texture.height)

        scale *= this.param('scale')!.get()

        collection.addSprite(
            Vec2.playfieldCentre(),
            Origin.Centre,
            spriteId,
            new Vec2(scale),
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