import {Node, NodeStatus} from "@/editor/node";

import {NodeSystem} from "@/editor/node/system";
import {EditorPath} from "@/editor/node/path";
import {EditorCommand} from "@/editor/ctx/editorCommand";
import {CommandHistory} from "@/editor/ctx/history";
import {computed, reactive, ref, shallowRef, watch, watchEffect} from "vue";
import {WorkerPool} from "@/editor/ctx/workerPool";
import {SBCollection} from "@/editor/objects/collection";
import {FileStore} from "@/editor/ctx/texture";
import {NodeDependencyType} from "@/editor/compile";
import {SceneNode} from "@/editor/node/element";
import type {SerializedEditorLocation, SerializedProject} from "@/editor/ctx/serialize";
import {Scheduler} from "@/editor/ctx/scheduler";
import {EditorLocation} from "@/components/node/util";
import {Vec2} from "@/util/math";
import {addRecentFile} from "@/editor/files";
import {EditorClock} from "@/editor/ctx/clock";
import {AudioEngine} from "@/editor/audio";
import * as path from "path";
import {useDevtools} from "@/devtools";
import {CustomInspectorNode} from "@vue/devtools-api";
import {CookManager} from "@/editor/cook/context";
import {setEditorExtensionContext} from "@/lang/editor.extension";
import {serializeSBCollection} from "@/editor/objects/serialize";

export class EditorContext {

    readonly history = new CommandHistory(this)
    readonly activeNode = shallowRef<Node>()
    readonly workerPool = new WorkerPool()
    readonly currentGeometry = shallowRef<SBCollection>()
    readonly mapsetPath = ref<string>('')
    readonly fileStore = new FileStore()
    readonly activePath = shallowRef(EditorPath.root())
    readonly duration = ref(10_000)
    readonly projectFilepath = ref<string>()
    readonly activeNodeSystem = computed(() => this.getObject(this.activePath.value) as NodeSystem<any>)
    readonly root = shallowRef(new SceneNode(this, 'root'))
    readonly locations = reactive(new Map<string, EditorLocation>())
    readonly scheduler = new Scheduler()
    readonly activeBeatmap = ref<string>()
    readonly currentBeatmapObject = computed(() => {
        this.markDependencyChanged(NodeDependencyType.Beatmap)
        if (this.activeBeatmap.value) {
            return this.fileStore.beatmaps.value.find(it => it.Version === this.activeBeatmap.value)
        }
        return this.fileStore.beatmaps.value[0]
    })
    readonly audioEngine = new AudioEngine()

    readonly clock = new EditorClock(this)


    readonly time = this.clock.time


    constructor() {
        this.setupEvents()

        watch(this.currentBeatmapObject, async (beatmap, oldBeatmap) => {
            if (beatmap) {
                if (!this.clock.sound || beatmap.AudioFilename !== oldBeatmap?.AudioFilename) {
                    const audioData = await electronAPI.readFile(path.join(this.mapsetPath.value, beatmap.AudioFilename))
                    this.clock.setSound(await this.audioEngine.createSound(audioData.buffer))
                }
            } else {
                this.clock.setSound()
            }
        })
        requestAnimationFrame(() => this.update())

        this.setupDevtools()

        setEditorExtensionContext(this)
    }

    readonly lastUpdate = ref(performance.now())
    readonly delta = ref(0)

    readonly updateTimes = reactive<number[]>([])

    readonly fps = computed(() => Math.floor(1000 /
        (this.updateTimes.reduce((a, b) => a + b, 0) / this.updateTimes.length)
    ))

    update() {
        const now = performance.now()
        const delta = now - this.lastUpdate.value;
        this.delta.value = delta
        if (this.updateTimes.length > 30)
            this.updateTimes.pop()
        this.updateTimes.unshift(delta)
        this.lastUpdate.value = performance.now()

        requestAnimationFrame(() => this.update())
    }

    setupEvents() {
        watchEffect(() => {
            if (this.root.value.status.value === NodeStatus.Dirty) {
                this.cookNode(this.root.value)
            }
        })
    }

    getObject(path: string | string[] | EditorPath): Node | null {
        if (typeof path === "string") path = path.split('/')
        if (Array.isArray(path)) path = new EditorPath(path)

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
        const manager = new CookManager(this)
        manager.cook(node.path).then(result => {
            this.currentGeometry.value = result.outputData[0]
        })
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
            const path = EditorPath.fromString(project.activePath)
            if (this.getObject(path))
                this.activePath.value = path
        }

        await this.load()

        if (project.activeBeatmap)
            this.activeBeatmap.value = project.activeBeatmap

        this.clock.seek(project.currentTime ?? 0)
    }

    markDependencyChanged(...dependency: NodeDependencyType[]) {
        this.root.value.markDependencyChanged(...dependency)
    }

    async load() {
        await this.fileStore.load(this, this.mapsetPath.value)
    }

    destroy() {

    }

    private setupDevtools() {
        const devtools = useDevtools()

        if (devtools) {
            devtools.on.getInspectorTree((payload) => {
                if (payload.inspectorId === 'nodes') {
                    payload.rootNodes = [this.createInspectorNode(this.root.value)]
                }
            })
        }
    }

    private createInspectorNode(node: Node): CustomInspectorNode {

        const res: CustomInspectorNode = {
            id: node.path.toString(),
            label: node.name.value,
        }

        if (node instanceof NodeSystem) {
            res.children = [...node.nodeList].map(it => this.createInspectorNode(it))
        }

        if (node.cookDuration) {
            res.tags = [
                {
                    label: (Math.floor(node.cookDuration * 10) / 10) + 'ms',
                    textColor: 0xffffff,
                    backgroundColor: 0x000000
                },
                {
                    label: (Math.floor(node.ownCookDuration * 10) / 10) + 'ms',
                    textColor: 0xffffff,
                    backgroundColor: 0x000000
                }
            ]
        }

        return res
    }

    async exportStoryboard() {
        if (this.currentGeometry.value) {
            const lines = [...serializeSBCollection(this.currentGeometry.value, this)]
            const fileContents = lines.join('\n')

            const regex = new RegExp('^(.+ - .+ \\(.+\\)) \\[.+\\].osu', 'g')

            let exportFilename = 'storyboard.osb'

            const files = await electronAPI.readDir(this.mapsetPath.value)

            for (let filename of files) {
                if (filename.endsWith('.osu')) {
                    for (let match = null; (match = regex.exec(filename));) {
                        exportFilename = `${match[1]}.osb`
                    }
                }

            }
            await electronAPI.writeFile(path.join(this.mapsetPath.value, exportFilename), fileContents)
        }
    }
}