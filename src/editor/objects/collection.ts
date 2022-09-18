import {SBElement} from "@/editor/objects/index";
import {Vec2} from "@/util/math";
import {Origin} from "@/editor/objects/origin";


export class SBCollection {

    elements: SBElement[]

    constructor(elements: SBElement[] = []) {
        this.elements = elements
    }

    addSprite(
        pos: Vec2 = Vec2.zero(),
        origin: Origin = Origin.Centre,
        sprite: number = -1,
        scale: Vec2 = Vec2.one()
    ): { el: SBElement, index: number } {
        const el = new SBElement(pos, origin, sprite, scale)
        const index = this.elements.length
        this.elements.push(el)
        return {el, index}
    }

    clone() {
        return new SBCollection(
            this.elements.map(it => it.clone())
        )
    }

    getSprite(index: number) {
        return this.elements[index]
    }

    forEach(run: (index: number, el: SBElement) => void) {
        for (let i = 0; i < this.elements.length; i++) {
            run(i, this.elements[i])
        }
        return this;
    }

    append(geo: SBCollection) {
        this.elements.push(
            ...geo.elements
        )
    }
}