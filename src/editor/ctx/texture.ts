import * as PIXI from 'pixi.js'
import {ALPHA_MODES, MIPMAP_MODES, MSAA_QUALITY, SCALE_MODES, WRAP_MODES} from 'pixi.js'
import {EditorContext} from "@/editor/ctx/context";
import {NodeDependencyType} from "@/editor/compile";
import * as path from "path";
import * as parser from 'osu-parser'
import {shallowRef} from "vue";

export class FileStore {

    textures: { name: string, texture: PIXI.Texture, url: string }[] = []

    textureMap = new Map<string, number>()

    beatmaps = shallowRef<BeatmapData[]>([])

    async load(ctx: EditorContext, mapsetPath: string) {
        this.textures = []
        this.textureMap.clear()
        this.beatmaps.value = []

        if (!await electronAPI.fileExists(mapsetPath))
            return;

        await this.loadDir(mapsetPath, mapsetPath)

        ctx.markDependencyChanged(NodeDependencyType.Texture, NodeDependencyType.Beatmap)
    }

    async loadDir(mapsetPath: string, dir: string) {
        const files = await electronAPI.readDir(dir)

        await Promise.all(files.map(async filename => {
            const filepath = path.join(dir, filename)

            if (filepath.endsWith('.png') || filepath.endsWith('.jpg')) {
                const data = await electronAPI.readFile(filepath)
                const url = URL.createObjectURL(new Blob([data]))

                const texture = await PIXI.Texture.fromURL(url, {
                    scaleMode: SCALE_MODES.NEAREST,
                    mipmap: MIPMAP_MODES.OFF,
                    wrapMode: WRAP_MODES.MIRRORED_REPEAT,
                    multisample: MSAA_QUALITY.NONE,
                    alphaMode: ALPHA_MODES.PREMULTIPLY_ALPHA,
                })

                this.textureMap.set(path.relative(mapsetPath, filepath), this.textures.length)
                this.textures.push({
                    name: path.relative(mapsetPath, filepath),
                    texture,
                    url,
                })
            }

            if (filepath.endsWith('.osu')) {
                const content = await electronAPI.readTextFile(filepath)
                const beatmap = await parser.parseContent(content);
                this.beatmaps.value.push(beatmap)
            }
        }))
    }

    getTextureId(name: string) {
        return this.textureMap.get(name) ?? -1
    }
}