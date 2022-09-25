import {readonly, ref} from "vue";

const recentFiles = ref<RecentFile[]>([])

interface RecentFile {
    path: string
    date: Date
}

let loaded = false;

async function load(): Promise<RecentFile[] | undefined> {
    if (await electronAPI.fileExists('./recent-files.json')) {
        const content = await electronAPI.readTextFile('./recent-files.json')
        return JSON.parse(content).map((it: any) => ({
            path: it.path,
            date: new Date(it.date)
        }))
    }
    return undefined
}

export function useRecentFiles() {

    if (!loaded) {
        load().then(files => {
            if (files)
                recentFiles.value = files
        })
    }

    return readonly(recentFiles)
}

export async function addRecentFile(path: string) {
    const index = recentFiles.value.findIndex(it => it.path === path)
    if (index >= 0)
        recentFiles.value.splice(index, 1)
    recentFiles.value.unshift({
        path,
        date: new Date()
    })
    await electronAPI.writeFile('./recent-files.json', JSON.stringify(recentFiles.value))
}
