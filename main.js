const {app, BrowserWindow, ipcMain, Menu, session, dialog} = require('electron')
const path = require("path");
const fs = require("fs");
const {promisify} = require("util");

let mainWindow;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1920,
        height: 1080,
        show: false,
        title: 'osb!cad',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            devTools: true,
            preload: path.join(__dirname, 'preload.js')
        },
    })
    mainWindow = win;

    win.maximize()
    win.show()
    win.setMenu(createMenu(win))


    win.loadURL('http://localhost:8080')
    //win.loadFile(path.join(__dirname, 'dist/index.html'), )
}

app.whenReady().then(async () => {
    if (fs.existsSync(path.join(__dirname, 'vue-devtools')))
        await session.defaultSession.loadExtension(path.join(__dirname, 'vue-devtools'))
    createWindow()
})

ipcMain.on('loadProject', async (evt, path) => {

    try {
        const contents = await promisify(fs.readFile)(path, {
            encoding: 'UTF-8'
        })

        const project = JSON.parse(contents)

        evt.sender.send('projectLoaded', {
            project,
        })


    } catch (e) {

    }
})

ipcMain.handle('select-directory', (evt, defaultPath) => {
    return dialog.showOpenDialog(mainWindow, {
        defaultPath,
        properties: ['openDirectory']
    })
})

ipcMain.handle('open-file-dialog', (evt, opts) => {
    return dialog.showOpenDialog(mainWindow, {
        ...opts,
        properties: ['openFile']
    })
})


ipcMain.handle('save-file-dialog', (evt, opts) => {
    return dialog.showSaveDialog(mainWindow, {
        ...opts
    })
})


function createMenu(window) {
    return Menu.buildFromTemplate([
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'ctrl+z',
                    click: () => window.webContents.send('undo')
                },
                {
                    label: 'Redo',
                    accelerator: 'ctrl+y',
                    click: () => window.webContents.send('redo')
                },
                {role: 'separator'},
                {role: 'toggleDevTools'},

            ]
        }
    ])
}