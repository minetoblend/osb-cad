const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {

    handleUndo: (handler) => ipcRenderer.on('undo', handler),
    handleRedo: (handler) => ipcRenderer.on('redo', handler),

})

