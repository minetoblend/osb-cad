import {Node} from "@/editor/node";
import {CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";

export class NodeDependency {
    constructor(readonly node: Node | undefined, readonly input: number, readonly output: number, public dirty = !!node?.isDirty, public key = 0) {
        this.dirty = dirty
    }

    time?: number

    result?: CookResult
    delta?: number;

    get isStatic() {
        return (this.time === undefined && this.delta === undefined)
    }

    assignFromDownstream(dependency: NodeDependency) {
        this.time = dependency.time ?? this.time
        this.delta = dependency.delta ?? this.delta
        if (!dependency.isStatic)
            this.dirty = true
    }

    static empty(input: number) {
        const result = new NodeDependency(undefined, input, 0)
        result.result = CookResult.success(new SBCollection())
        return result
    }
}