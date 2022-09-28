import {EditorContext} from "@/editor/ctx/context";
import {NodePath} from "@/editor/node/path";
import {CircularDependencyError, NodeError} from "@/editor/node/error";
import {Node, NodeStatus} from "@/editor/node/index";
import {CookContext, CookError, CookResult, CookResultType} from "@/editor/node/cook.context";
import {animationFrameAsPromise, nextTickAsPromise} from "@/util/promise";
import {Task} from "@/editor/ctx/scheduler";
import {NodeDependency} from "@/editor/node/dependency";
import {SBCollection} from "@/editor/objects/collection";

export class CookTask implements Task {

    constructor(readonly ctx: EditorContext, readonly path: NodePath) {

    }

    wasCanceled = false
    finished = false
    cooking = new Set<Node>()

    async run(): Promise<void> {
        //console.warn('running cook job for ' + this.path.toString())
        try {
            const node = this.ctx.getObject(this.path)
            if (!node)
                return;

            console.time('cook job')
            const result = await this.runInternal(node)
            console.timeEnd('cook job')
            if (result && result.type === CookResultType.Success && this.finished) {
                this.ctx.currentGeometry.value = result.outputData[0]
            }

            //console.warn(`cook job for ${this.path.toString()} took ${Date.now() - start}ms`)
        } catch (e) {
            console.error(e)
            if (e instanceof NodeError) {
                e.node.status.value = NodeStatus.Error
                e.node.errors.value = [
                    e
                ]
            }

            if (e instanceof CircularDependencyError) {
                e.path.forEach((current, index, path) => {
                    const next = path[index + 1] ?? path[0]
                    const connections = current.parent?.getConnectionsBetween(next, current)
                    connections?.forEach(connection => connection.circular.value = true)
                })
            }
        }
    }

    lastUpdate = 0

    private async cookNode(node: Node, dependency: NodeDependency): Promise<void> {
        if (this.wasCanceled)
            return;

        let result = CookResult.failure([new CookError(node, "Did not cook")]);
        try {

            if (dependency && !dependency.dirty && !node.isDirty && node.resultCache) {
                dependency.result = CookResult.success(...node.resultCache)
                return;
            }

            const dependencies = node.findDependenciesForCooking()
            if (!dependency.isStatic) {
                dependencies.forEach(it => it.assignFromDownstream(dependency))
            }

            await Promise.all(dependencies.filter(it => it.node).map(dependency => this.cookNode(dependency.node!, dependency)))

            const failedDependencies = dependencies.filter(it => it.result && it.result.type === CookResultType.Failure)
            if (failedDependencies.length > 0) {
                const upstreamErrors: CookError[] = []
                failedDependencies.forEach(it => upstreamErrors.push(
                    ...it.result?.errors ?? []
                ))
                failedDependencies.forEach(it => upstreamErrors.push(
                    ...it.result?.upstreamErrors ?? []
                ))
                dependency.result = CookResult.failure([], upstreamErrors)
                return;
            }


            node.isCooking.value = true

            if (performance.now() - this.lastUpdate > 50) {
                console.log('wait')
                await animationFrameAsPromise()
                this.lastUpdate = performance.now()
            }

            await nextTickAsPromise()

            if (this.wasCanceled)
                return;

            const ctx = new CookContext(this.ctx, dependencies, dependency, () => new SBCollection())

            console.time(`cook ${node.path.toString()} (${ctx.TIME})`)
            result = await node.cook(ctx)
            console.timeEnd(`cook ${node.path.toString()} (${ctx.TIME})`)

            dependency.result = result

            if (result.type === CookResultType.Success) {
                if (!this.wasCanceled && dependency?.isStatic) {
                    node.resultCache = result.outputData
                } else {
                    node.resultCache = null
                }
                node.status.value = NodeStatus.Cooked
            } else if (result.type === CookResultType.Failure) {
                if (!this.wasCanceled && dependency?.isStatic) {
                    node.resultCache = result.outputData
                }
                node.status.value = NodeStatus.Error
            }
        } catch (e) {
            console.log(e)
            node.status.value = NodeStatus.Error
        } finally {
            node.isCooking.value = false
        }


    }

    cancel() {
        this.wasCanceled = true
    }

    async runInternal(node: Node): Promise<CookResult | undefined> {
        this.lastUpdate = performance.now()
        const rootDependency = new NodeDependency(node, 0, 0)
        await this.cookNode(node, rootDependency)
        if (!this.wasCanceled && rootDependency.result && rootDependency.result.type === CookResultType.Success)
            this.finished = true
        return rootDependency.result
    }
}