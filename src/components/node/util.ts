import {Vec2} from "@/util/math";

export class EditorLocation {
    position = Vec2.zero()
    scale = 1

    constructor(readonly id: string) {
    }

    clone() {
        const location = new EditorLocation(this.id)
        location.position = this.position.clone()
        location.scale = this.scale
        return location
    }
}