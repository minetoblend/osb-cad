const {contextBridge, ipcRenderer} = require('electron')
const fs = require('fs')
const path = require('path')
const {promisify} = require('util')
var parser = require('osu-parser');

contextBridge.exposeInMainWorld('electronAPI', {

    handleUndo: (handler) => ipcRenderer.on('undo', handler), handleRedo: (handler) => ipcRenderer.on('redo', handler),

    async fileExists(file) {
        return promisify(fs.exists)(file)
    },

    async loadBeatmapFiles(dir) {
        const ret = {
            images: [],
            beatmaps: []
        }

        async function loadDirectory(directory) {
            try {
                const files = await promisify(fs.readdir)(directory)

                await Promise.all(files.map(async filename => {
                    const currentPath = path.join(directory, filename)
                    if (fs.lstatSync(currentPath).isDirectory()) {
                        await loadDirectory(currentPath)
                    } else if (filename.endsWith('.png') || filename.endsWith('.jpg')) {
                        const data = promisify(fs.readFile)(currentPath)
                        ret.images.push({filename: path.relative(dir, currentPath), data})
                    } else if (filename.endsWith('.osu')) {
                        const beatmap = await promisify(parser.parseFile)(currentPath)
                        ret.beatmaps.push(beatmap)
                    }
                }))
            } catch (e) {
                console.log(e)
            }
        }

        await loadDirectory(dir)

        return ret
    },

    writeFile(file, contents) {
        return new Promise((resolve, reject) => {
            fs.writeFile(file, contents, (err) => {
                if (err) reject(err)
                else resolve()
            })
        })
    },

    readTextFile(file) {
        return new Promise((resolve, reject) => {
            fs.readFile(file, {encoding: 'utf-8'}, (err, data) => {
                if (err) reject(err)
                else resolve(data)
            })
        })
    },

    readFile(file) {
        return new Promise((resolve, reject) => {
            fs.readFile(file, (err, data) => {
                if (err) reject(err)
                else resolve(data)
            })
        })
    },

    isDir(file) {
        return promisify(fs.lstat)(file).then(it => it.isDirectory())
    },

    readDir(dir) {
        return promisify(fs.readdir)(dir)
    },

    async selectDirectory(defaultPath) {
        return ipcRenderer.invoke('select-directory', defaultPath)
    },
    async saveFileDialog(opts) {
        return ipcRenderer.invoke('save-file-dialog', opts || {})
    },
    async openFileDialog(opts) {
        return ipcRenderer.invoke('open-file-dialog', opts || {})
    },
    getOsuSongsDirectory() {
        switch (process.platform) {
            case 'win32':
                return path.join(process.env.LOCALAPPDATA, 'osu!', 'Songs');
            case 'darwin':
                return '';
        }
        return undefined;
    }
})



