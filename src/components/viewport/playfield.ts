import * as PIXI from 'pixi.js'
import {EditorContext} from "@/editor/ctx/context";
import {ShallowRef} from "vue";
import {SBCollection} from "@/editor/objects/collection";
import {StoryboardElementContainer} from "@/components/viewport/element";
import {StoryboardStatistics} from "@/components/viewport/statistics";

export class PlayfieldContainer extends PIXI.Container {
    private geometry: ShallowRef<SBCollection | undefined>;
    private readonly spriteContainer: PIXI.Container

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

        g.lineStyle(1.5, 0xffffff, 0.25)

        g.drawRoundedRect(60, 55, 510, 385, 3)

        this.geometry = ctx.currentGeometry

        this.spriteContainer = new PIXI.Container()

        this.addChild(this.spriteContainer)
        this.addChild(g)
    }


    updateSprites(geometry: SBCollection | undefined, time: number = this.ctx.time.value): StoryboardStatistics {
        const statistics = new StoryboardStatistics()
        if (!geometry) {
            this.spriteContainer.removeChildren().forEach(it => it.destroy({children: true}))
            return statistics;
        }

        let elements = geometry.elements.filter(it => {
            const {count, overlapping} = it.commandCountAt(time)
            statistics.add(count, overlapping)
            return count > 0 || it.isActiveAt(time) || it.hasNoAnimation
        })

        if (elements.length < this.spriteContainer.children.length) {
            this.spriteContainer.removeChildren(elements.length).forEach(it => it.destroy({children: true}))
        }

        elements.forEach((element, index) => {
            if (!this.spriteContainer.children[index])
                this.spriteContainer.addChild(new StoryboardElementContainer(this.ctx, element, time));
            else
                (this.spriteContainer.children[index] as StoryboardElementContainer).updateFrom(element, time)
        })
        return statistics
    }
}