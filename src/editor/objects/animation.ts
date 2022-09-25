import {SpriteCommand} from "@/editor/objects/command";
import {IHasMathOperations} from "@/util/math";


export class AnimatedValue<T extends IHasMathOperations<T>> {

    private commands: SpriteCommand<T>[] = []

    get hasCommands(): boolean {
        return this.commands.length > 0
    }

    get commandList(): ReadonlyArray<SpriteCommand<T>> {
        return this.commands
    }

    constructor(readonly initialValue: T) {
    }

    addCommand(command: SpriteCommand<T>) {
        this.commands.splice(this.findCommandIndex(command.startTime).index, 0, command)
    }


    valueAt(time: number, defaultValue: T = this.initialValue): T {
        if (this.commands.length === 0)
            return defaultValue

        let {index, found} = this.findCommandIndex(time)
        if (!found && index > 0)
            index--;
        return this.commands[index].valueAtTime(time)
    }

    private findCommandIndex(time: number): { found: boolean, index: number } {
        let index = 0
        let left = 0;
        let right = this.commands.length - 1;
        while (left <= right) {
            index = left + ((right - left) >> 1);
            let commandTime = this.commands[index].startTime;
            if (commandTime == time)
                return {found: true, index};
            else if (commandTime < time)
                left = index + 1;
            else right = index - 1;
        }
        index = left;
        return {found: false, index};
    }

    clone() {
        const timeline = new AnimatedValue<T>(this.initialValue.clone())
        timeline.commands = this.commands.map(it => it.clone())
        return timeline
    }

    addOffset(amount: number) {
        this.commands.forEach(it => {
            it.startTime += amount
            it.endTime += amount
        })
    }

    deleteCommandsBefore(time: number) {
        this.commands = this.commands.filter(it => it.endTime <= time)
    }

    deleteCommandsAfter(time: number) {
        this.commands = this.commands.filter(it => it.startTime >= time)
    }

    get startTime() {
        return this.commands[0]?.startTime ?? NaN
    }

    get endTime() {
        return this.commands[this.commands.length - 1]?.endTime ?? NaN
    }

}