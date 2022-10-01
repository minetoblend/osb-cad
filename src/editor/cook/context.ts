import {EditorContext} from "@/editor/ctx/context";
import {EditorPath} from "@/editor/node/path";
import {Node, NodeStatus} from "@/editor/node";
import {CircularDependencyError} from "@/editor/node/error";
import {CookResult, CookResultType} from "@/editor/node/cook.context";
import {NodeInput} from "@/editor/node/input";
import {SBCollection} from "@/editor/objects/collection";
import {globalFunctions, NodeDependencyType} from "@/editor/compile";
import TypedFastBitSet from "typedfastbitset";

export class CookManager {

    constructor(readonly ctx: EditorContext) {
    }

    private readonly cooking = new Map<string, Promise<any>>()

    async cookWithContext(ctx: CookJobContext): Promise<CookResult> {
        const urlString = ctx.path.toString()


        if (this.cooking.has(urlString)) {
            return await this.cooking.get(urlString)
        }

        if (ctx.node.cook) {
            let result = ctx.node.cook(ctx);
            if (result instanceof Promise)
                result = await result

            if (result.type === CookResultType.Failure) {
                ctx.node.status.value = NodeStatus.Error
            } else if (ctx.node.status.value !== NodeStatus.Error) {
                ctx.node.status.value = NodeStatus.Cooked
                ctx.node.dependencies.clear()
                if (ctx.isStatic) {
                    result.cached = true
                }
                ctx.node.dependencies = new Set(ctx.dependencies.type)
            }

            ctx.node.cache.addResult(result)

            return result
        } else {
            return CookResult.failure()
        }

    }

    async cook(path: EditorPath): Promise<CookResult> {
        path.setQueryWeak('time', this.ctx.time.value)

        const ctx = new CookJobContext(this.ctx, this, path)


        const operationName = 'cook'
        performance.mark(operationName)
        const res = await this.cookWithContext(ctx)
        const measure = performance.measure(operationName, operationName)

        console.log(measure.duration)

        return res
    }

}

export class CookJobContext {
    constructor(
        private readonly ctx: EditorContext,
        private readonly manager: CookManager,
        readonly path: EditorPath,
        private parentChain: Set<Node> = new Set(),
        private readonly parent?: CookJobContext
    ) {
        const node = path.find(ctx.root.value)

        if (!(node instanceof Node))
            throw new Error('Path is not a node')

        if (parentChain.has(node)) {
            const path = [...parentChain]
            const index = path.indexOf(node)
            throw new CircularDependencyError(node, path.slice(index))
        }

        this.node = node

        const chain = new Set(parentChain)
        chain.add(node)
        this.chain = chain
    }

    readonly node: Node

    private readonly chain: Set<Node>
    private readonly provided = new Map<string, any>()

    private createChildContext(path: EditorPath) {
        path = path.clone()
        this.path.query.forEach((value, key) => {
            path.setQueryWeak(key, value)
        })
        return new CookJobContext(this.ctx, this.manager, path, this.chain, this)
    }

    async fetchResult(path: EditorPath): Promise<CookResult> {

        const node = path.find(this.ctx.root.value)

        if (node instanceof NodeInput) {
            if (node.connections.length > 0) {
                const childCtx = this.createChildContext(node.connections[0].from.node.path)
                path.query.forEach((value, key) => childCtx.path.withQuery(key, value))

                return this.manager.cookWithContext(childCtx)
            } else {
                return CookResult.success(new SBCollection())
            }
        }
        const childCtx = this.createChildContext(path)
        return this.manager.cookWithContext(childCtx)
    }

    async fetch(path: EditorPath, output: number = 0): Promise<SBCollection> {
        const result = await this.fetchResult(path)

        if (result.type === CookResultType.Success) {
            if (result.cached)
                return result.outputData[output].clone()
            return result.outputData[output]
        }
        return new SBCollection()
    }

    async fetchInput(input: number | NodeInput = 0): Promise<SBCollection> {
        if (typeof input === "number")
            input = this.node.inputs[input]

        if (input.connections.length > 0)
            return this.fetch(input.connections[0].from.node.path, input.connections[0].from.index)
        else
            return new SBCollection()
    }

    provide(name: string, value: any) {
        this.provided.set(name, value)
    }

    inject<T = any>(name: string): T | undefined {
        return this.provided.get(name) ?? this.parent?.inject<T>(name)
    }

    // builtin global values

    dependencies = {
        query: new Set<string>(),
        type: new Set<NodeDependencyType>()
    }

    private markQueryValueUsed(name: string) {
        this.dependencies.query.add(name)
        if (name === 'time')
            this.dependencies.type.add(NodeDependencyType.Time)
        this.parent?.markQueryValueUsed(name)
    }

    private markNodeDependencyTypeUsed(type: NodeDependencyType) {
        this.dependencies.type.add(type)
        this.parent?.markNodeDependencyTypeUsed(type)
    }

    getQueryValue(name: string): string | number | undefined {
        this.markQueryValueUsed(name)
        return this.path.query.get(name)
    }

    get time(): number {
        const value =
            this.getQueryValue('time')
        if (typeof value === 'string')
            return parseInt(value)
        if (value !== undefined)
            return value

        throw Error('no time')
    }

    get delta(): number {
        const value =
            this.getQueryValue('delta')
        if (typeof value === 'string')
            return parseFloat(value)

        return value ?? 0
    }

    readonly functions = globalFunctions

    get isStatic(): boolean {
        return this.dependencies.query.size === 0;
    }

    getTextureId(spriteName: string) {
        this.markNodeDependencyTypeUsed(NodeDependencyType.Texture)
        return this.ctx.fileStore.getTextureId(spriteName)
    }

    readonly utils = {
        BitSet: TypedFastBitSet
    }
}