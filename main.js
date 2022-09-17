const {app, BrowserWindow, ipcMain, Menu} = require('electron')
const path = require("path");
const fs = require("fs");
const {promisify} = require("util");

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
    win.maximize()
    win.show()
    win.setMenu(createMenu(win))

    win.loadURL('http://localhost:8080')
}

app.whenReady().then(() => {
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

function createMenu(window) {
    const menu = Menu.buildFromTemplate([
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
                { role: 'separator' },
                { role: 'toggleDevTools' },

            ]
        }
    ])
    return menu
}