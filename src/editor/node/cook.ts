import {EditorContext} from "@/editor/ctx/context";
import {NodePath} from "@/editor/node/path";
import {CircularDependencyError, NodeError} from "@/editor/node/error";
import {Node, NodeStatus} from "@/editor/node/index";

export class CookJob {
    private nodes: Node[] = [];

    constructor(readonly ctx: EditorContext, readonly path: NodePath) {
    }

    canceled = false

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
        this.runScheduledJob()
    }

    private async cookNode(node: Node) {
        const connections = node.parent?.getConnectionsLeadingTo(node)
        connections?.forEach(connection => connection.circular.value = false)

        try {
            await this.ctx.workerPool.cookNode(node, () => {
                node.status.value = NodeStatus.Cooking
            })
            if (!this.canceled) {
                node.status.value = NodeStatus.Cooked
            }
        } catch (e) {
            node.status.value = NodeStatus.Error
        }
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
        if (this.nodes.length === 0)
            return resolve()

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