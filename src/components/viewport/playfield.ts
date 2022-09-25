import * as PIXI from 'pixi.js'
import {EditorContext} from "@/editor/ctx/context";
import {ShallowRef} from "vue";
import {SBCollection} from "@/editor/objects/collection";
import {StoryboardElementContainer} from "@/components/viewport/element";

export class PlayfieldContainer extends PIXI.Container {
    private geometry: ShallowRef<SBCollection | undefined>;
    private spriteContainer: PIXI.Container

    private visualizer: PIXI.Graphics

    constructor(readonly ctx: EditorContext) {
        super();
        const g = new PIXI.Graphics()

        g.lineStyle(0)
        g.beginFill(0x000000, 0.5)
        g.drawRect(-100, -300, 840, 300)
        g.drawRect(-100, 480, 840, 300)

        g.drawRect(-300, 0, 300, 480)
        g.drawRect(640, 0, 300, 480)

        g.endFill()
        g.lineStyle(1.5, 0xffffff, 0.5)
        g.drawRoundedRect(0, 0, 640, 480, 5)

        this.geometry = ctx.currentGeometry

        this.spriteContainer = new PIXI.Container()

        this.addChild(this.spriteContainer)
        this.addChild(g)

        this.visualizer = new PIXI.Graphics()
        this.addChild(this.visualizer)
    }


    updateSprites(geometry: SBCollection | undefined, time: number = this.ctx.time.value) {
        if (!geometry) {
            this.spriteContainer.removeChildren().forEach(it => it.destroy({children: true}))
            return;
        }
        if (geometry.elements.length < this.spriteContainer.children.length) {
            this.spriteContainer.removeChildren(geometry.elements.length)
        }
        geometry.elements.forEach((element, index) => {
            if (!this.spriteContainer.children[index])
                this.spriteContainer.addChild(new StoryboardElementContainer(this.ctx, element, time));
            else
                (this.spriteContainer.children[index] as StoryboardElementContainer).updateFrom(element, time)
        })
    }
}