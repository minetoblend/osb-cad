import {Node} from "@/editor/node";

export class WorkerPool {


    constructor() {
        this.init()
    }

    workers: Worker[] = []
    busy = new Set<Worker>()
    resolve = new Map<Worker, { resolve: Function, reject: Function, started?: Function }>()
    scheduled: { node: Node, resolve: Function, reject: Function, started?: Function }[] = []

    init() {
        const numThreads = navigator.hardwareConcurrency

        for (let i = 0; i < numThreads / 2; i++) {
            this.addWorker(new Worker(new URL('./worker.ts', import.meta.url)))
        }
    }

    addWorker(worker: Worker) {
        this.workers.push(worker)
        worker.onmessage = message => this.onMessage(worker, message)
    }

    getAvailableWorker() {
        return this.workers.find(it => !this.busy.has(it))
    }

    cookNode(node: Node, started?: Function): Promise<void> {
        return new Promise((resolve, reject) => {
            const worker = this.getAvailableWorker()
            if (worker) {
                this.runWithWorker(worker, node, resolve, reject, started)
            } else {
                this.scheduled.push({node, resolve, reject, started})
            }
        })
    }

    private runWithWorker(worker: Worker, node: Node, resolve: Function, reject: Function, started?: Function) {
        this.busy.add(worker)
        this.resolve.set(worker, {resolve, reject, started})
        worker.postMessage({
            message: 'cook',
            payload: {
                path: node.path.parts
            }
        })
        started?.();
    }

    onMessage(worker: Worker, evt: MessageEvent) {
        if (evt.data.message === 'ready')
            this.onWorkerReady(worker)
        if (evt.data.message === 'cook:finished')
            this.onWorkerFinished(worker, evt.data.payload)

    }

    onWorkerReady(worker: Worker) {
        this.workers.push(worker)
        this.runScheduledTask(worker)
    }

    runScheduledTask(worker: Worker) {
        if (this.scheduled.length) {
            const entry = this.scheduled.shift()!
            this.runWithWorker(worker, entry.node, entry.resolve, entry.reject, entry.started)
        }
    }

    onWorkerFinished(worker: Worker, data: any) {
        this.busy.delete(worker)
        this.resolve.get(worker)!.resolve(data)
        this.resolve.delete(worker)
        this.runScheduledTask(worker)
    }

}