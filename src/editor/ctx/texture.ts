import * as PIXI from 'pixi.js'
import {ALPHA_MODES, MIPMAP_MODES, MSAA_QUALITY, SCALE_MODES, WRAP_MODES} from 'pixi.js'

export class FileStore {

    textures: { name: string, texture: PIXI.Texture, url: string }[] = []

    load() {
        const path = './test'
        const {images} = electronAPI.loadBeatmapFiles(path)
        images.map(it => {
            const blob = new Blob([it.data])
            const url = URL.createObjectURL(blob)
            const texture = PIXI.Texture.from(url, {
                scaleMode: SCALE_MODES.NEAREST,
                mipmap: MIPMAP_MODES.OFF,
                wrapMode: WRAP_MODES.MIRRORED_REPEAT,
                multisample: MSAA_QUALITY.NONE,
                alphaMode: ALPHA_MODES.PREMULTIPLIED_ALPHA,
            })
            this.textures.push({
                name: it.filename,
                texture,
                url,
            })
        })
    }

}