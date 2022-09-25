export class Scheduler<T = void> {

    running?: Task<T>
    scheduled?: [Task<T>, (t: TaskResult<T>) => void]

    schedule(task: Task<T>): Promise<TaskResult<T>> {
        if (this.running) {
            this.running.cancel()

            if (this.scheduled)
                this.scheduled[1]({
                    type: "skipped"
                })

            return new Promise<TaskResult<T>>(resolve => {
                this.scheduled = [task, resolve]
            })
        } else
            return this.runTask(task)
    }

    private async runTask(task: Task<T>): Promise<TaskResult<T>> {
        if (this.running)
            throw new Error('Tried to run multiple tasks at once')
        this.running = task
        try {
            const value = await task.run()
            this.running = undefined

            this.runNextTask()

            return {
                type: "finished",
                value
            }
        } catch (error) {
            console.error(error)
            return {
                type: "error",
                error
            }
        }

    }

    private runNextTask() {
        if (this.scheduled) {
            const [task, resolve] = this.scheduled
            this.scheduled = undefined

            this.runTask(task).then(resolve)
        }
    }

}

export interface Task<T = void> {

    run(): Promise<T>

    cancel(): void

    wasCanceled:  boolean

}

export interface TaskResult<T = void> {
    type: 'finished' | 'canceled' | 'skipped' | 'error'
    value?: T
    error?: any
}