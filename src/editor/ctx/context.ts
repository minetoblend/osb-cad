import {Node} from "@/editor/node";

import {NodeSystem} from "@/editor/node/system";
import {NodePath} from "@/editor/node/path";
import {EditorCommand} from "@/editor/ctx/editorCommand";
import {CommandHistory} from "@/editor/ctx/history";
import {CookTask} from "@/editor/node/cook";
import {computed, reactive, ref, shallowRef, watch} from "vue";
import {WorkerPool} from "@/editor/ctx/workerPool";
import {SBCollection} from "@/editor/objects/collection";
import {FileStore} from "@/editor/ctx/texture";
import {ExpressionDependency} from "@/editor/compile";
import {SceneNode} from "@/editor/node/element";
import type {SerializedEditorLocation, SerializedProject} from "@/editor/ctx/serialize";
import {Scheduler} from "@/editor/ctx/scheduler";
import {EditorLocation} from "@/components/node/util";
import {Vec2} from "@/util/math";
import {addRecentFile} from "@/editor/files";

export class EditorContext {

    readonly history = new CommandHistory(this)
    readonly activeNode = shallowRef<Node>()
    readonly workerPool = new WorkerPool()
    readonly currentGeometry = shallowRef<SBCollection>()
    readonly mapsetPath = ref<string>('')
    readonly fileStore = new FileStore()
    readonly activePath = shallowRef(NodePath.root())
    readonly time = ref(0)
    readonly duration = ref(10_000)
    readonly projectFilepath = ref<string>()
    readonly activeNodeSystem = computed(() =>
        this.getObject(this.activePath.value) as NodeSystem<any>
    )
    readonly root = shallowRef(new SceneNode(this, 'root'))
    readonly locations = reactive(new Map<string, EditorLocation>())

    readonly scheduler = new Scheduler()
    readonly activeBeatmap = ref<string>()

    readonly currentBeatmapObject = computed(() => {
        this.markDependencyChanged(ExpressionDependency.Beatmap)
        if (this.activeBeatmap.value) {
            return this.fileStore.beatmaps.value.find(it => it.Version === this.activeBeatmap.value)
        }
        return this.fileStore.beatmaps.value[0]
    })

    constructor() {
        this.setupEvents()

        watch(this.time, () => {
            this.root.value.markDependencyChanged(ExpressionDependency.Time)
        })

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
        if (typeof path === "string") path = path.split('/')
        if (Array.isArray(path)) path = new NodePath(path)

        return this.root.value.find(path)
    }

    executeCommand(command: EditorCommand) {
        this.history.execute(command)
    }

    async save(customPath = false) {
        if (!this.projectFilepath.value || customPath) {
            const {canceled, filePath} = await electronAPI.saveFileDialog({
                filters: [
                    {name: 'osb!cad projects', extensions: ['osbcad']},
                ],
                defaultPath: this.projectFilepath.value
            })
            if (!canceled && filePath)
                this.projectFilepath.value = filePath
        }


        if (this.projectFilepath.value) {
            await electronAPI.writeFile(this.projectFilepath.value, JSON.stringify(this.serialize(), undefined, 2)).then(() => console.log('saved'))
                .catch(e => console.error(e))
            await addRecentFile(this.projectFilepath.value)
        }
    }

    onNodeRemoved(system: NodeSystem<any>, node: Node) {
        if (this.activeNode.value === node) this.activeNode.value = undefined
    }

    cookNode(node: Node) {
        this.scheduler.schedule(new CookTask(this, node.path))
    }

    serialize(): SerializedProject {
        const locations: Record<string, SerializedEditorLocation> = {}
        this.locations.forEach((location, id) => {
            locations[id] = {
                position: location.position,
                scale: location.scale
            }
        })

        return {
            mapsetPath: this.mapsetPath.value,
            nodes: this.root.value.serialize(),
            activePath: this.activePath.value.toString(),
            currentTime: this.time.value,
            activeBeatmap: this.currentBeatmapObject.value?.Version ?? null,
            locations
        }
    }

    async loadProject(project: Partial<SerializedProject>) {
        const {Deserializer} = require('./serialize')
        const deserializer = new Deserializer()


        this.mapsetPath.value = project.mapsetPath ?? ''

        if (project.locations) {
            Object.entries(project.locations).forEach(([id, serializedLocation]) => {
                const location = new EditorLocation(id)
                location.position = Vec2.from(serializedLocation.position)
                location.scale = serializedLocation.scale
                this.locations.set(id, location)
            })
        }

        if (project.nodes) {
            const root = deserializer.deserializeNode(this, project.nodes, 'element') as SceneNode

            if (root) {
                this.root.value = root
            }
        }

        if (project.activePath) {
            const path = NodePath.fromString(project.activePath)
            if (this.getObject(path))
                this.activePath.value = path
        }

        await this.load()

        if (project.activeBeatmap)
            this.activeBeatmap.value = project.activeBeatmap

        this.time.value = project.currentTime ?? 0
    }

    markDependencyChanged(...dependency: ExpressionDependency[]) {
        this.root.value.markDependencyChanged(...dependency)
        console.warn(`Global dependency changed: ${dependency.map(d => ExpressionDependency[d]).join(', ')}`)
    }

    async load() {
        await this.fileStore.load(this, this.mapsetPath.value)
    }

    destroy() {

    }
}