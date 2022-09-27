// @ts-ignore
import {EssentiaWASM} from 'essentia.js/dist/essentia-wasm.es'
// @ts-ignore
import EssentiaJS from 'essentia.js/dist/essentia.js-core.es'
import type Essentia from 'essentia.js/dist/core_api'
import {WorkerMessage} from "@/editor/node/element/import/worker.message";


const essentia = new EssentiaJS(EssentiaWASM, false) as Essentia

const ctx: Worker = self as any

function handleSpectrum(msg: WorkerMessage) {
    const payload: Float32Array[] = msg.payload


    const results = payload.map(it => essentia.Spectrum(essentia.arrayToVector(it), it.length))

    const reply = msg.reply(results.map(result => essentia.vectorToArray(result.spectrum)))

    ctx.postMessage(reply)
}

ctx.onmessage = (evt) => {
    const msg: WorkerMessage = WorkerMessage.fromData(evt.data)
    switch (msg.type) {
        case 'spectrum':
            handleSpectrum(msg);
            break;
    }
}

ctx.postMessage(new WorkerMessage('ready', true))