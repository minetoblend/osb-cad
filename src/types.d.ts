declare const electronAPI: {
    handleUndo(handler: () => void)
    handleRedo(handler: () => void)
    writeFile(path: string, contents: string): Promise<void>
    readTextFile(path: string): Promise<string>
    readFile(path: string): Promise<Uint8Array>
    isDir(path: string): Promise<boolean>
    readDir(path: string): Promise<string[]>
    fileExists(path: string): Promise<boolean>
    getOsuSongsDirectory(): string | undefined
    selectDirectory(defaultPath?: string): Promise<{ canceled: boolean, filePaths: string[] | undefined }>
    openFileDialog(opts?: any): Promise<{ canceled: boolean, filePaths: string[] | undefined }>
    saveFileDialog(opts?: any): Promise<{ canceled: boolean, filePath: string | undefined }>

}

type IfEquals<X, Y, A = X, B = never> =
    (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? A : B;

type WritableKeys<T> = {
    [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>
}[keyof T];

type Constructor<T> = {
    new(...args: any): T
}

declare module 'osu-parser' {
    function parseContent(content: string): BeatmapData;
}

interface BeatmapData {
    Version: string
    AudioFilename: string
    hitObjects: HitObjectData[]
    timingPoints: TimingPointData[]
}

interface HitObjectData {
    position: [number, number]
    startTime: number
    objectName: 'circle' | 'slider' | 'spinner'
    duration?: number
    endPosition?: [number, number],
    repeatCount?: number
    pixelLength?: number
}

interface TimingPointData {
    beatLength: number
    bpm: number
    offset: number
    timingChange: boolean

}

type Clonable<T = any> = {
    clone(): T
}

declare module 'vue-dock-menu' {
    declare let DockMenu: any
}