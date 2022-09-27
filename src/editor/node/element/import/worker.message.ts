import {v4 as uuid} from 'uuid'

export class WorkerMessage {

    constructor(
        readonly type: string,
        readonly payload: any,
        readonly id: string = uuid(),
    ) {
    }

    static fromData(data: SerializedWorkerMessage) {
        return new WorkerMessage(data.type, data.payload, data.id)
    }

    reply(payload: any) {
        return new WorkerMessage(
            'reply',
            payload,
            this.id,
        )
    }

    get isReply() {
        return this.type === 'reply'
    }
}

interface SerializedWorkerMessage {
    payload: any
    type: string
    id: string
}