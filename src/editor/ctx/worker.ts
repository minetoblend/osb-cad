postMessage({
    message: 'ready'
})

self.onmessage = function (evt: MessageEvent) {
    onCommand(evt.data.message, evt.data.payload)
}

function onCommand(message: string, payload: any) {

    if (message === 'cook')
        cook(payload)
}

function cook(payload: any) {

    postMessage({
        message: 'cook:finished',
        payload: {
            path: payload.path
        }
    })
}
