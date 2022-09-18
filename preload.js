const {contextBridge, ipcRenderer} = require('electron')
const fs = require('fs')
const path = require('path')

contextBridge.exposeInMainWorld('electronAPI', {

    handleUndo: (handler) => ipcRenderer.on('undo', handler),
    handleRedo: (handler) => ipcRenderer.on('redo', handler),

    loadBeatmapFiles(dir) {
        const files = fs.readdirSync(dir)
        const ret = {
            images: []
        }
        files.forEach(filename => {
            if (filename.endsWith('.png')) {
                const data = fs.readFileSync(path.join(dir, filename))
                ret.images.push({filename, data})
            }
        })
        return ret
    }
})

