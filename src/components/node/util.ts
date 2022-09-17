import {Vec2} from "@/util/math";
import {reactive} from "vue";


export class EditorTransform {

}

export class EditorLocation {
    constructor(readonly id: string) {
    }

    position = Vec2.zero()
    scale = 1
}

export class EditorStack {
    private readonly rootLocation = reactive(new EditorLocation('root'))
    private readonly locations: EditorLocation[] = []

    get current() {
        return this.locations[this.locations.length - 1] ?? this.rootLocation
    }

    get path() {
        return this.locations.map(it => it.id)
    }
}