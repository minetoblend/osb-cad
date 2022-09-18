import {Node} from "@/editor/node";
import {NodeSystem} from "@/editor/node/system";
import {NodePath} from "@/editor/node/path";
import {EditorCommand} from "@/editor/ctx/editorCommand";
import {CommandHistory} from "@/editor/ctx/history";
import {CookJob} from "@/editor/node/cook";
import {ref, shallowRef, watch} from "vue";
import {WorkerPool} from "@/editor/ctx/workerPool";
import {SpriteNode} from "@/editor/node/element/sprite";
import {SBCollection} from "@/editor/objects/collection";
import {FileStore} from "@/editor/ctx/texture";
import {ExpressionDependency} from "@/editor/compile";
import {SceneNode} from "@/editor/node/element/scene";
import * as PIXI from 'pixi.js'
import {SerializedProject} from "@/editor/ctx/serialize";

export class EditorContext {

    readonly root = new SceneNode(this, 'root')
    readonly history = new CommandHistory(this)
    readonly activeNode = shallowRef<Node>()

    readonly workerPool = new WorkerPool()

    readonly time = ref(0)

    readonly currentGeometry = shallowRef<SBCollection>()

    textureStore = new FileStore()
    activePath = shallowRef(NodePath.root())

    constructor() {
        this.setupEvents()
        this.textureStore.load()

        let spriteNode = new SpriteNode(this)

        let sceneNode = new SceneNode(this)
        let sceneNode2 = new SceneNode(this)

        this.root.add(sceneNode)
        sceneNode.add(sceneNode2)
        sceneNode2.add(spriteNode)



        const ticker = PIXI.Ticker.shared
        ticker.add(() => this.runUpdate(ticker.deltaMS))

        watch(this.time, () => {
            this.root.markDependencyChanged(ExpressionDependency.Time)
        })

        console.log(this.serialize())
    }

    runUpdate(dt: number) {
        this.time.value = (this.time.value + dt) % 5000
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

    jobScheduled = false

    cookNode(node: Node) {
        this.scheduledCookJob.value = new CookJob(this, node.path)
        this.jobScheduled = true

        requestAnimationFrame(() => {
            if (this.jobScheduled) {
                this.cookJob.value?.cancel()
                if (this.scheduledCookJob.value) {
                    this.cookJob.value = this.scheduledCookJob.value
                    this.cookJob.value = this.scheduledCookJob.value
                    this.scheduledCookJob.value = undefined
                    this.cookJob.value.run()
                }
                this.jobScheduled = false
            }
        })
    }

    cookJob = shallowRef<CookJob>()
    scheduledCookJob = shallowRef<CookJob>()

    onNodeMarkedDirty(node: Node) {
        this.cookNode(node)
    }

    private serialize() : SerializedProject {
        return {
            nodes: this.root.serialize()
        }
    }
}