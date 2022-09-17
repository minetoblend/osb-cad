export function animationFrameAsPromise(): Promise<void> {
    return new Promise(resolve => window.requestAnimationFrame(() => resolve()))
}

export function wait(time: number): Promise<void> {
    return new Promise(resolve => setTimeout(() => resolve(), time))
}