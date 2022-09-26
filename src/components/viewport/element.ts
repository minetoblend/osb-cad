import * as PIXI from 'pixi.js'
import {SBElement, SBElementType} from "@/editor/objects";
import {EditorContext} from "@/editor/ctx/context";
import {Origin} from "@/editor/objects/origin";

const pointGraphics = new PIXI.Graphics()
pointGraphics.beginFill(0xffffff)
pointGraphics.drawRect(-3, -3, 6, 6)

export class StoryboardElementContainer extends PIXI.Container {


    constructor(readonly ctx: EditorContext, public element: SBElement, time: number) {
        super();
        this.createChildren(element.type)
        this.update(time)
    }

    updateFrom(element: SBElement, time: number) {
        const type = element.type
        if (type !== this.element.type) {
            this.createChildren(type)
        }
        this.element = element

        this.update(time)
    }

    sprite?: PIXI.Sprite
    point?: PIXI.Graphics

    createChildren(type: SBElementType) {
        this.removeChildren().forEach(it => it.destroy())
        this.sprite = undefined
        this.point = undefined
        switch (type) {
            case SBElementType.Point:
                this.point = new PIXI.Graphics(pointGraphics.geometry)
                this.addChild(this.point)
                return;
            case SBElementType.Sprite:
                this.sprite = new PIXI.Sprite();
                this.addChild(this.sprite)
                return;
        }
    }

    update(time: number) {

        if (this.element.type === SBElementType.Sprite) {
            const texture = this.ctx.fileStore.textures[this.element._sprite]
            this.sprite!.texture = texture.texture
        }


        this.position.copyFrom(this.element.getPos(time))
        this.rotation = this.element.getRotation(time)
        this.scale.copyFrom(this.element.getScale(time))

        this.alpha = this.element.getAlpha(time)

        if (this.sprite) {
            const color = this.element.getColor(time)
            this.sprite.tint = color.hex
        }


        if (this.sprite) {
            const sprite = this.sprite
            switch (this.element._origin) {
                case Origin.TopLeft:
                    sprite.anchor.set(0, 0);
                    break;
                case Origin.Centre:
                    sprite.anchor.set(0.5, 0.5);
                    break;
                case Origin.CentreLeft:
                    sprite.anchor.set(0, 0.5);
                    break;
                case Origin.TopRight:
                    sprite.anchor.set(1, 0);
                    break;
                case Origin.BottomCentre:
                    sprite.anchor.set(0.5, 1);
                    break;
                case Origin.TopCentre:
                    sprite.anchor.set(0.5, 0);
                    break;
                case Origin.Custom:
                    sprite.anchor.set(0, 0);
                    break;
                case Origin.CentreRight:
                    sprite.anchor.set(1, 0.5);
                    break;
                case Origin.BottomLeft:
                    sprite.anchor.set(0, 1);
                    break;
                case Origin.BottomRight:
                    sprite.anchor.set(1, 1);
                    break;
            }
        }
    }


}