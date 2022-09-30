import {Node} from "@/editor/node";
import {CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {NodeDependencyType} from "@/editor/compile";

export class NodeDependency {
    constructor(readonly node: Node | undefined, readonly input: number | undefined, readonly output: number, public dirty = !!node?.isDirty, public key?: string) {
        this.dirty = dirty

        if (node) {
            this.dependencies = new Set(node.getDependenciesDeep())
        } else {
            this.dependencies = new Set()
        }
    }

    readonly dependencies: Set<NodeDependencyType>;

    result?: CookResult

    query: Record<any, string | number> = {}

    get isStatic() {
        return Object.keys(this.query).length > 0
    }

    static empty(input?: number, key: string = 'default') {
        const result = new NodeDependency(undefined, input, 0, false, key)
        result.result = CookResult.success(new SBCollection())
        return result
    }

    setQuery(query: Record<string, number | string>) {
        this.query = {
            ...this.query,
            ...query
        }
    }
}