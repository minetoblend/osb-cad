import {NodeSystem} from "@/editor/node/system";
import {ElementNode} from "@/editor/node/element";
import {Node} from "@/editor/node";
import {SpriteWrangleNode} from "@/editor/node/element/wrangle";
import {NodePath} from "@/editor/node/path";
import {EditorCommand} from "@/editor/ctx/editorCommand";
import {CommandHistory} from "@/editor/ctx/history";
import {CookJob} from "@/editor/node/cook";
import {inject, shallowRef} from "vue";
import {WorkerPool} from "@/editor/ctx/workerPool";


export class EditorContext {

    readonly root = new NodeSystem<ElementNode>(this, 'root')
    readonly history = new CommandHistory(this)
    readonly activeNode = shallowRef<Node>()

    readonly workerPool = new WorkerPool()

    constructor() {
        this.setupEvents()

        let rootNode = new SpriteWrangleNode(this)
        rootNode.position.value.set(300, 300)
        rootNode.name.value = 'SpriteWrangle4'
        rootNode.inputs[0].multiple = true
        this.root.add(
            rootNode
        )

        for(let i = 0; i < 32; i++) {
            let node = new SpriteWrangleNode(this)
            node.position.value.set(20 + 150 * i, 150)
            node.name.value = 'Node' + (i + 1)

            this.root.add(
                node
            )
            this.root.addConnection(
                node.outputs[0],
                rootNode.inputs[0]
            )
        }







        ///this.root.outputNode.value = node2.name.value
    }

    setupEvents() {
        electronAPI.handleUndo(() => {
            this.history.undo()
        })
        electronAPI.handleRedo(() => {
            this.history.redo()
        })

        window.addEventListener('keydown', evt => {
            if (evt.ctrlKey && evt.code === 'KeyZ') {
                evt.preventDefault()
                this.history.undo()
            }
            if (evt.ctrlKey && evt.code === 'KeyY') {
                evt.preventDefault()
                this.history.redo()
            }
        })
    }

    getObject(path: string | string[] | NodePath): Node | null {
        if (typeof path === "string")
            path = path.split('/')
        if (Array.isArray(path))
            path = new NodePath(path)

        return this.root.find(path)
    }

    executeCommand(command: EditorCommand) {
        console.log(command)
        this.history.onCommandExecute(command)
        command.execute()
    }

    onNodeRemoved(system: NodeSystem<any>, node: Node) {
        if (this.activeNode.value === node)
            this.activeNode.value = undefined
    }

    cookNode(node: Node) {
        this.scheduledCookJob.value = new CookJob(this, node.path)

        requestAnimationFrame(() => {
            if(!this.cookJob.value && this.scheduledCookJob.value) {
                this.cookJob.value = this.scheduledCookJob.value
                this.cookJob.value = this.scheduledCookJob.value
                this.scheduledCookJob.value = undefined
                this.cookJob.value.run()
            }
        })
    }

    cookJob = shallowRef<CookJob>()
    scheduledCookJob = shallowRef<CookJob>()

    onNodeMarkedDirty(node: Node) {
        this.cookNode(node)
    }
}

export function useContext(): EditorContext {
    return inject<EditorContext>('ctx')!
}