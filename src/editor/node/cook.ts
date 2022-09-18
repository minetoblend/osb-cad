import {EditorContext} from "@/editor/ctx/context";
import {NodePath} from "@/editor/node/path";
import {CircularDependencyError, NodeError} from "@/editor/node/error";
import {Node, NodeStatus} from "@/editor/node/index";
import {ElementNode} from "@/editor/node/element";
import {CookContext} from "@/editor/node/cook.context";
import {animationFrameAsPromise} from "@/util/promise";

export class CookJob {
    private nodes: Node[] = [];

    constructor(readonly ctx: EditorContext, readonly path: NodePath) {
    }

    canceled = false
    finished = false
    cooking = new Set<Node>()

    async run(): Promise<void> {
        console.error('running job')
        try {
            const node = this.ctx.getObject(this.path)
            if (!node)
                return;

            const dirtyDependencies = node.findDirtyDependenciesDeep()
            this.nodes = [
                ...dirtyDependencies,
                node,
            ]


            const start = Date.now()
            await this.runInternal()
            console.log(`Job took ${Date.now() - start}ms`)
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
        if (this.finished) {
            const node = this.ctx.getObject(this.path) as ElementNode
            this.ctx.currentGeometry.value = node.getOutput(0)
        }
        this.runScheduledJob()
    }

    private async cookNode(node: Node) {
        this.cooking.add(node)
        const connections = node.parent?.getConnectionsLeadingTo(node)
        connections?.forEach(connection => connection.circular.value = false)

        try {
            node.status.value = NodeStatus.Cooking
            await animationFrameAsPromise()

            console.log('cooking ' + node.path.toString())
            const ctx = new CookContext(node)
            const result = await node.cook(ctx)

            if (!this.canceled) {
                node.setResultCache(result.outputData)
                node.status.value = NodeStatus.Cooked
            }


        } catch (e) {
            console.log(e)
            node.status.value = NodeStatus.Error
        }
        this.cooking.delete(node)
    }

    cancel() {
        this.canceled = true
    }

    runScheduledJob() {
        this.ctx.cookJob.value = this.ctx.scheduledCookJob.value
        this.ctx.scheduledCookJob.value = undefined
        if (this.ctx.cookJob.value)
            this.ctx.cookJob.value.run()
    }

    private runInternal() {
        return new Promise((resolve) => {
            this.cookNextNode(resolve)
        })
    }


    cookNextNode(resolve: Function) {
        if (this.canceled)
            return resolve();
        if (this.nodes.length === 0 && this.cooking.size === 0) {
            this.finished = true
            return resolve()
        }
        const nodes = this.nodes
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]
            const directDependencies = node.findDirtyDependencies()

            if (directDependencies.length === 0) {
                this.nodes.splice(i, 1)
                this.cookNode(node).then(() => this.cookNextNode(resolve))
                this.cookNextNode(resolve);
                return;
            }
        }
    }
}