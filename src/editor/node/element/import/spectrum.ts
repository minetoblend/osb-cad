import {RegisterNode} from "@/editor/node/registry";
import {ElementNode} from "@/editor/node/element";
import {CookContext, CookResult} from "@/editor/node/cook.context";
import {SBCollection} from "@/editor/objects/collection";
import {NodeBuilder} from "@/editor/node";
import {EditorContext} from "@/editor/ctx/context";
import {WorkerMessage} from "@/editor/node/element/import/worker.message";
import {NodeDependencyType} from "@/editor/compile";


@RegisterNode('AudioSpectrum', ['fas', 'headphones'], 'import')
export class AudioSpectrumNode extends ElementNode {
    icon = ['fas', 'headphones'];
    private worker: Worker;

    readonly workerCallbacks = new Map<string, Function>()

    private generateAudioFrame(buffer: AudioBuffer, time: number, frameSize: number): Float32Array {
        const offset = Math.floor(time * buffer.sampleRate / 1000)

        let frame = buffer.getChannelData(0).slice(offset, offset + frameSize)

        for (let j = 1; j < buffer.numberOfChannels; j++) {
            let d = buffer.getChannelData(j)
            frame = frame.map((a, idx) => (a + d[idx + offset]) / buffer.numberOfChannels)
        }
        return frame
    }

    constructor(ctx: EditorContext, name: string) {
        super(ctx, name);
        this.worker = new Worker(new URL('./spectrum.worker.ts', import.meta.url))
        this.worker.onmessage = (evt) => this.onWorkerMessage(WorkerMessage.fromData(evt.data))
    }

    define(builder: NodeBuilder) {
        builder.outputs(1)
            .parameters(param => param
                .int('frameSize', 'Frame Size', {defaultValue: 32})
                .int('hopSize', 'HopSize', {})
                .int('subFrames', 'Sub Frames')
                .int('superSample', 'Supersampling', {defaultValue: 4})
                .int('startTime', 'Start Time')
                .int('endTime', 'End Time')
            )
    }

    async cook(ctx: CookContext): Promise<CookResult> {
        const sound = this.ctx.clock.sound.value
        if (!sound)
            return CookResult.success(new SBCollection())

        const frameSize = this.param('frameSize')!.get()
        const superSample = this.param('superSample')!.get()
        const subFrames = this.param('subFrames')!.get()
        const hopSize = this.param('hopSize')!.get()
        const spectrum: number[] = []

        const numSamples = subFrames + 1
        const frames: Float32Array[] = []
        for (let i = 0; i < numSamples; i++) {
            const time = ctx.TIME + (i / numSamples) * hopSize
            frames.push(this.generateAudioFrame(sound.buffer, time, frameSize * superSample))
        }
        const ffts: Float32Array[] = await this.sendMessageToWorker('spectrum', frames)

        ffts.forEach(fft => {
            fft.forEach((amplitude, idx) => {
                spectrum[Math.floor(idx / superSample)] = (spectrum[Math.floor(idx / superSample)] ?? 0) + amplitude
            })
        })

        const geo = new SBCollection()

        geo.grow(spectrum.length)

        const frequencyAttr = geo.addAttribute('frequency', 'number')
        const amplitudeAttr = geo.addAttribute('amplitude', 'number')

        spectrum.shift() //remove first item

        spectrum.forEach((value, index) => {
            const frequency = (index + 1) * sound.buffer.sampleRate / frameSize
            frequencyAttr.setValue(index, frequency)
            amplitudeAttr.setValue(index, value / superSample / numSamples)
        })

        return CookResult.success(geo)
    }

    private onWorkerMessage(msg: WorkerMessage) {
        if (msg.isReply) {
            const callback = this.workerCallbacks.get(msg.id)
            if (callback) {
                this.workerCallbacks.delete(msg.id)
                callback(msg.payload)
            }
        } else if (msg.type === 'ready') {
            this.markDirty()
            console.log('worker is ready')
        }
    }

    private sendMessageToWorker(type: string, payload: any): Promise<any> {
        return new Promise((resolve) => {
            const msg = new WorkerMessage(type, payload)
            this.workerCallbacks.set(msg.id, resolve)
            this.worker.postMessage(msg)
        })
    }

    destroy() {
        this.worker.terminate()
    }

    updateDependencies() {
        super.updateDependencies();
        this.dependencies.add(NodeDependencyType.Time)
        this.dependencies.add(NodeDependencyType.Audio)
    }
}