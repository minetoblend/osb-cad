import {Color, Float, Vec2} from "@/util/math";
import {Origin} from "@/editor/objects/origin";
import {AnimatedValue} from "@/editor/objects/animation";
import {
    ColorCommand,
    FadeCommand,
    MoveCommand,
    RotateCommand,
    ScaleCommand,
    ScaleVecCommand,
    SpriteCommand
} from "@/editor/objects/command";
import {Easing} from "@/editor/objects/easing";

export class SBElement {
    constructor(pos: Vec2, origin: Origin, sprite: number, scale: Vec2) {
        this._pos = pos;
        this._origin = origin;
        this._sprite = sprite;
        this._scale = scale;
    }

    _pos: Vec2
    _rotation: number = 0
    _color: Color = Color.white
    _alpha: number = 1
    _origin: Origin
    _sprite: number
    _scale: Vec2

    private _moveTimeline?: AnimatedValue<Vec2>
    private _moveXTimeline?: AnimatedValue<Float>
    private _moveYTimeline?: AnimatedValue<Float>
    private _scaleTimeline?: AnimatedValue<Float>
    private _scaleVecTimeline?: AnimatedValue<Vec2>
    private _rotateTimeline?: AnimatedValue<Float>
    private _fadeTimeline?: AnimatedValue<Float>
    private _colorTimeline?: AnimatedValue<Color>


    get moveTimeline() {
        if (!this._moveTimeline) this._moveTimeline = new AnimatedValue<Vec2>(this._pos);
        return this._moveTimeline
    }

    get moveXTimeline() {
        if (!this._moveXTimeline) this._moveXTimeline = new AnimatedValue<Float>(new Float(this._pos.x));
        return this._moveXTimeline
    }

    get moveYTimeline() {
        if (!this._moveYTimeline) this._moveYTimeline = new AnimatedValue<Float>(new Float(this._pos.y));
        return this._moveYTimeline
    }

    get scaleTimeline() {
        if (!this._scaleTimeline) this._scaleTimeline = new AnimatedValue<Float>(new Float(this._scale.x));
        return this._scaleTimeline
    }

    get scaleVecTimeline() {
        if (!this._scaleVecTimeline) this._scaleVecTimeline = new AnimatedValue<Vec2>(this._scale);
        return this._scaleVecTimeline
    }

    get rotateTimeline() {
        if (!this._rotateTimeline) this._rotateTimeline = new AnimatedValue<Float>(new Float(0));
        return this._rotateTimeline
    }

    get fadeTimeline() {
        if (!this._fadeTimeline) this._fadeTimeline = new AnimatedValue<Float>(new Float(1));
        return this._fadeTimeline
    }

    get colorTimeline() {
        if (!this._colorTimeline) this._colorTimeline = new AnimatedValue<Color>(Color.white);
        return this._colorTimeline
    }


    clone() {
        const el = new SBElement(this._pos.clone(), this._origin, this._sprite, this._scale.clone())
        el._moveTimeline = this._moveTimeline?.clone()
        el._moveXTimeline = this._moveXTimeline?.clone()
        el._moveYTimeline = this._moveYTimeline?.clone()
        el._scaleTimeline = this._scaleTimeline?.clone()
        el._scaleVecTimeline = this._scaleVecTimeline?.clone()
        el._rotateTimeline = this._rotateTimeline?.clone()
        el._fadeTimeline = this._fadeTimeline?.clone()
        el._colorTimeline = this._colorTimeline?.clone()
        el._rotation = this._rotation
        el._color = this._color.clone()
        el._scale = this._scale.clone()
        el._alpha = this._alpha
        return el
    }

    get type(): SBElementType {

        if (this._sprite < 0)
            return SBElementType.Point
        return SBElementType.Sprite
    }

    move(easing: Easing, startTime: number, endTime: number, startPos: Vec2, endPos: Vec2): void;
    move(startTime: number, endTime: number, startPos: Vec2, endPos: Vec2): void;
    move(easing: Easing, time: number, position: Vec2): void;
    move(time: number, position: Vec2): void;

    move(...args:
             [Easing, number, number, Vec2, Vec2] |
             [number, number, Vec2, Vec2] |
             [Easing, number, Vec2] |
             [number, Vec2]
    ) {
        let startPos, endPos: Vec2;
        let startTime, endTime: number;
        let easing: Easing;

        switch (args.length) {
            case 2:
                endTime = args[0];
                startTime = this._moveTimeline?.lastCommand?.endTime ?? endTime;
                endPos = args[1];
                startPos = (this._moveTimeline?.lastCommand as MoveCommand | undefined)?.endPos ?? endPos;
                easing = Easing.Linear;
                break;
            case 3:
                endTime = args[1];
                startTime = this._moveTimeline?.lastCommand?.endTime ?? endTime;
                endPos = args[2];
                startPos = (this._moveTimeline?.lastCommand as MoveCommand | undefined)?.endPos ?? endPos;
                easing = args[0];
                break;
            case 4:
                startTime = args[0];
                endTime = args[1];
                startPos = args[2];
                endPos = args[3];
                easing = Easing.Linear;
                break;
            case 5:
                easing = args[0];
                startTime = args[1];
                endTime = args[2];
                startPos = args[3];
                endPos = args[4];
                break;
            default:
                throw Error('Incorrect number of arguments')
        }

        this.moveTimeline.addCommand(new MoveCommand(easing, startTime, endTime, startPos, endPos))
    }

    scale(easing: Easing, startTime: number, endTime: number, startScale: number, endScale: number): void;
    scale(startTime: number, endTime: number, startScale: number, endScale: number): void;
    scale(easing: Easing, time: number, position: number): void;
    scale(time: number, position: number): void;

    scale(...args:
              [Easing, number, number, number, number] |
              [number, number, number, number] |
              [Easing, number, number] |
              [number, number]
    ) {
        let startScale, endScale: Float;
        let startTime, endTime: number;
        let easing: Easing;

        switch (args.length) {
            case 2:
                endTime = args[0];
                startTime = this._scaleTimeline?.lastCommand?.endTime ?? endTime;
                endScale = new Float(args[1]);
                startScale = (this._scaleTimeline?.lastCommand as ScaleCommand | undefined)?.endScale ?? endScale;
                easing = Easing.Linear;
                break;
            case 3:
                endTime = args[1];
                startTime = this._scaleTimeline?.lastCommand?.endTime ?? endTime;
                endScale = new Float(args[2]);
                startScale = (this._scaleTimeline?.lastCommand as ScaleCommand | undefined)?.endScale ?? endScale;
                easing = args[0];
                break;
            case 4:
                startTime = args[0];
                endTime = args[1];
                startScale = new Float(args[2]);
                endScale = new Float(args[3]);
                easing = Easing.Linear;
                break;
            case 5:
                easing = args[0];
                startTime = args[1];
                endTime = args[2];
                startScale = new Float(args[3]);
                endScale = new Float(args[4]);
                break;
            default:
                throw Error('Incorrect number of arguments')
        }

        this.scaleTimeline.addCommand(new ScaleCommand(easing, startTime, endTime, startScale, endScale))
    }

    scaleVec(easing: Easing, startTime: number, endTime: number, startScale: Vec2, endScale: Vec2): void;
    scaleVec(startTime: number, endTime: number, startScale: Vec2, endScale: Vec2): void;
    scaleVec(easing: Easing, time: number, position: Vec2): void;
    scaleVec(time: number, position: Vec2): void;

    scaleVec(...args:
                 [Easing, number, number, Vec2, Vec2] |
                 [number, number, Vec2, Vec2] |
                 [Easing, number, Vec2] |
                 [number, Vec2]
    ) {
        let startScale, endScale: Vec2;
        let startTime, endTime: number;
        let easing: Easing;

        switch (args.length) {
            case 2:
                endTime = args[0];
                startTime = this._scaleVecTimeline?.lastCommand?.endTime ?? endTime;
                endScale = args[1];
                startScale = (this._scaleVecTimeline?.lastCommand as ScaleVecCommand | undefined)?.endScale ?? endScale;
                easing = Easing.Linear;
                break;
            case 3:
                endTime = args[1];
                startTime = this._scaleVecTimeline?.lastCommand?.endTime ?? endTime;
                endScale = args[2];
                startScale = (this._scaleVecTimeline?.lastCommand as ScaleVecCommand | undefined)?.endScale ?? endScale;
                easing = args[0];
                break;
            case 4:
                startTime = args[0];
                endTime = args[1];
                startScale = args[2];
                endScale = args[3];
                easing = Easing.Linear;
                break;
            case 5:
                easing = args[0];
                startTime = args[1];
                endTime = args[2];
                startScale = args[3];
                endScale = args[4];
                break;
            default:
                throw Error('Incorrect number of arguments')
        }

        this.scaleVecTimeline.addCommand(new ScaleVecCommand(easing, startTime, endTime, startScale, endScale))
    }

    rotate(easing: Easing, startTime: number, endTime: number, startAngle: number, endAngle: number): void;
    rotate(startTime: number, endTime: number, startAngle: number, endAngle: number): void;
    rotate(easing: Easing, time: number, position: number): void;
    rotate(time: number, position: number): void;

    rotate(...args:
               [Easing, number, number, number, number] |
               [number, number, number, number] |
               [Easing, number, number] |
               [number, number]
    ) {
        let startAngle, endAngle: Float;
        let startTime, endTime: number;
        let easing: Easing;

        switch (args.length) {
            case 2:
                endTime = args[0];
                startTime = this._rotateTimeline?.lastCommand?.endTime ?? endTime;
                endAngle = new Float(args[1]);
                startAngle = (this._rotateTimeline?.lastCommand as RotateCommand | undefined)?.endAngle ?? endAngle;
                easing = Easing.Linear;
                break;
            case 3:
                endTime = args[1];
                startTime = this._rotateTimeline?.lastCommand?.endTime ?? endTime;
                endAngle = new Float(args[2]);
                startAngle = (this._rotateTimeline?.lastCommand as RotateCommand | undefined)?.endAngle ?? endAngle;
                easing = args[0];
                break;
            case 4:
                startTime = args[0];
                endTime = args[1];
                startAngle = new Float(args[2]);
                endAngle = new Float(args[3]);
                easing = Easing.Linear;
                break;
            case 5:
                easing = args[0];
                startTime = args[1];
                endTime = args[2];
                startAngle = new Float(args[3]);
                endAngle = new Float(args[4]);
                break;
            default:
                throw Error('Incorrect number of arguments')
        }

        this.rotateTimeline.addCommand(new RotateCommand(easing, startTime, endTime, startAngle, endAngle))
    }

    fade(easing: Easing, startTime: number, endTime: number, startAlpha: number, endAlpha: number): void;
    fade(startTime: number, endTime: number, startAlpha: number, endAlpha: number): void;
    fade(easing: Easing, time: number, position: number): void;
    fade(time: number, position: number): void;

    fade(...args:
             [Easing, number, number, number, number] |
             [number, number, number, number] |
             [Easing, number, number] |
             [number, number]
    ) {
        let startAlpha, endAlpha: Float;
        let startTime, endTime: number;
        let easing: Easing;

        switch (args.length) {
            case 2:
                endTime = args[0];
                startTime = this._fadeTimeline?.lastCommand?.endTime ?? endTime;
                endAlpha = new Float(args[1]);
                startAlpha = (this._fadeTimeline?.lastCommand as FadeCommand | undefined)?.endAlpha ?? endAlpha;
                easing = Easing.Linear;
                break;
            case 3:
                endTime = args[1];
                startTime = this._fadeTimeline?.lastCommand?.endTime ?? endTime;
                endAlpha = new Float(args[2]);
                startAlpha = (this._fadeTimeline?.lastCommand as FadeCommand | undefined)?.endAlpha ?? endAlpha;
                easing = args[0];
                break;
            case 4:
                startTime = args[0];
                endTime = args[1];
                startAlpha = new Float(args[2]);
                endAlpha = new Float(args[3]);
                easing = Easing.Linear;
                break;
            case 5:
                easing = args[0];
                startTime = args[1];
                endTime = args[2];
                startAlpha = new Float(args[3]);
                endAlpha = new Float(args[4]);
                break;
            default:
                throw Error('Incorrect number of arguments')
        }

        this.fadeTimeline.addCommand(new FadeCommand(easing, startTime, endTime, startAlpha, endAlpha))
    }

    color(easing: Easing, startTime: number, endTime: number, startColor: Color, endColor: Color): void;
    color(startTime: number, endTime: number, startColor: Color, endColor: Color): void;
    color(easing: Easing, time: number, color: Color): void;
    color(time: number, color: Color): void;

    color(...args:
              [Easing, number, number, Color, Color] |
              [number, number, Color, Color] |
              [Easing, number, Color] |
              [number, Color]
    ) {
        let startColor, endColor: Color;
        let startTime, endTime: number;
        let easing: Easing;

        switch (args.length) {
            case 2:
                endTime = args[0];
                startTime = this._colorTimeline?.lastCommand?.endTime ?? endTime;
                endColor = args[1];
                startColor = (this._colorTimeline?.lastCommand as ColorCommand | undefined)?.endColor ?? endColor;
                easing = Easing.Linear;
                break;
            case 3:
                endTime = args[1];
                startTime = this._colorTimeline?.lastCommand?.endTime ?? endTime;
                endColor = args[2];
                startColor = (this._colorTimeline?.lastCommand as ColorCommand | undefined)?.endColor ?? endColor;
                easing = args[0];
                break;
            case 4:
                startTime = args[0];
                endTime = args[1];
                startColor = args[2];
                endColor = args[3];
                easing = Easing.Linear;
                break;
            case 5:
                easing = args[0];
                startTime = args[1];
                endTime = args[2];
                startColor = args[3];
                endColor = args[4];
                break;
            default:
                throw Error('Incorrect number of arguments')
        }

        this.colorTimeline.addCommand(new ColorCommand(easing, startTime, endTime, startColor, endColor))
    }

    getPos(time: number = 0): Vec2 {
        return this.moveTimeline.valueAt(time, this._pos)
    }


    getRotation(time: number = 0): number {
        return this.rotateTimeline.valueAt(time, new Float(this._rotation)).value
    }

    getAlpha(time: number = 0): number {
        if (!this.isVisibleAt(time))
            return 0;
        return this.fadeTimeline.valueAt(time, new Float(this._alpha)).value
    }

    isVisibleAt(time: number = 0) {
        if (this._sprite < 0 || this.hasNoAnimation)
            return true;
        if (this._moveTimeline && time >= this._moveTimeline.startTime && time <= this._moveTimeline.endTime)
            return true
        if (this._moveXTimeline && time >= this._moveXTimeline.startTime && time <= this._moveXTimeline.endTime)
            return true
        if (this._moveYTimeline && time >= this._moveYTimeline.startTime && time <= this._moveYTimeline.endTime)
            return true
        if (this._scaleTimeline && time >= this._scaleTimeline.startTime && time <= this._scaleTimeline.endTime)
            return true
        if (this._scaleVecTimeline && time >= this._scaleVecTimeline.startTime && time <= this._scaleVecTimeline.endTime)
            return true
        if (this._rotateTimeline && time >= this._rotateTimeline.startTime && time <= this._rotateTimeline.endTime)
            return true
        if (this._fadeTimeline && time >= this._fadeTimeline.startTime && time <= this._fadeTimeline.endTime)
            return true
        if (this._colorTimeline && time >= this._colorTimeline.startTime && time <= this._colorTimeline.endTime)
            return true
        return false
    }

    get hasNoAnimation() {
        return !this._moveTimeline?.hasCommands &&
            !this._moveXTimeline?.hasCommands &&
            !this._moveYTimeline?.hasCommands &&
            !this._scaleTimeline?.hasCommands &&
            !this._scaleVecTimeline?.hasCommands &&
            !this._rotateTimeline?.hasCommands &&
            !this._fadeTimeline?.hasCommands &&
            !this._colorTimeline?.hasCommands
    }

    getColor(time: number = 0): Color {
        return this.colorTimeline.valueAt(time, this._color ?? Color.white)
    }

    getScale(time: number = 0): Vec2 {
        if (this.scaleVecTimeline.hasCommands) {
            return this.scaleVecTimeline.valueAt(time, this._scale)
        }
        if (this.scaleTimeline.hasCommands) {
            const scale = this.scaleTimeline.valueAt(time)
            return new Vec2(scale.value, scale.value)
        }
        return this._scale
    }

    moveWithCommands(delta: Vec2) {
        this._pos.move(delta)
        if (this._moveTimeline) {
            this._moveTimeline.initialValue.move(delta)
            this._moveTimeline.commandList.forEach(it => {
                (it as MoveCommand).startPos.move(delta);
                (it as MoveCommand).endPos.move(delta);
            })
        }
    }

    moveToWithCommands(to: Vec2) {
        const delta = to.sub(this._pos)
        this.moveWithCommands(delta)
    }

    offsetAnimation(amount: number) {
        this._moveTimeline?.addOffset(amount)
        this._moveXTimeline?.addOffset(amount)
        this._moveYTimeline?.addOffset(amount)
        this._scaleTimeline?.addOffset(amount)
        this._scaleVecTimeline?.addOffset(amount)
        this._rotateTimeline?.addOffset(amount)
        this._fadeTimeline?.addOffset(amount)
        this._colorTimeline?.addOffset(amount)
    }

    applyAnimationFrom(el: SBElement) {
        if (el._moveTimeline)
            el.moveTimeline.commandList.forEach(command => this.moveTimeline.addCommand(command))
        if (el._moveXTimeline)
            el.moveXTimeline.commandList.forEach(command => this.moveXTimeline.addCommand(command))
        if (el._moveYTimeline)
            el.moveYTimeline.commandList.forEach(command => this.moveYTimeline.addCommand(command))
        if (el._scaleTimeline)
            el.scaleTimeline.commandList.forEach(command => this.scaleTimeline.addCommand(command))
        if (el._scaleVecTimeline)
            el.scaleVecTimeline.commandList.forEach(command => this.scaleVecTimeline.addCommand(command))
        if (el._rotateTimeline)
            el.rotateTimeline.commandList.forEach(command => this.rotateTimeline.addCommand(command))
        if (el._fadeTimeline)
            el.fadeTimeline.commandList.forEach(command => this.fadeTimeline.addCommand(command))
        if (el._colorTimeline)
            el.colorTimeline.commandList.forEach(command => this.colorTimeline.addCommand(command))
    }


    commandCountAt(time: number) {
        let count = 0
        let overlapping = 0

        if (this._moveTimeline) {
            const c = this._moveTimeline.commandCountAt(time)
            count += c
            if (c > 1)
                overlapping += c
        }
        if (this._moveXTimeline) {
            const c = this._moveXTimeline.commandCountAt(time)
            count += c
            if (c > 1)
                overlapping += c
        }
        if (this._moveYTimeline) {
            const c = this._moveYTimeline.commandCountAt(time)
            count += c
            if (c > 1)
                overlapping += c
        }
        if (this._scaleTimeline) {
            const c = this._scaleTimeline.commandCountAt(time)
            count += c
            if (c > 1)
                overlapping += c
        }
        if (this._scaleVecTimeline) {
            const c = this._scaleVecTimeline.commandCountAt(time)
            count += c
            if (c > 1)
                overlapping += c
        }
        if (this._rotateTimeline) {
            const c = this._rotateTimeline.commandCountAt(time)
            count += c
            if (c > 1)
                overlapping += c
        }
        if (this._fadeTimeline) {
            const c = this._fadeTimeline.commandCountAt(time)
            count += c
            if (c > 1)
                overlapping += c
        }

        if (this._colorTimeline) {
            const c = this._colorTimeline.commandCountAt(time)
            count += c
            if (c > 1)
                overlapping += c
        }

        return {count, overlapping}
    }

    isActiveAt(time: number) {
        const firstCommand = this.firstCommand
        if (!firstCommand || time < firstCommand.startTime)
            return false
        const lastCommand = this.lastCommand
        if (!lastCommand || time > lastCommand.endTime)
            return false
        return true
    }

    get firstCommand(): SpriteCommand<any> | undefined {
        let minCommand: SpriteCommand<any> | undefined = undefined;

        for (const timeline of this.timelines) {
            const command = timeline.firstCommand as SpriteCommand<any>
            if (!minCommand || command && (command.startTime < minCommand.startTime)) {
                minCommand = command
            }
        }

        return minCommand
    }

    get lastCommand(): SpriteCommand<any> | undefined {
        let maxCommand: SpriteCommand<any> | undefined = undefined;

        for (const timeline of this.timelines) {
            const command = timeline.lastCommand as SpriteCommand<any>
            if (!maxCommand || command && (command.endTime > maxCommand.endTime)) {
                maxCommand = command
            }
        }

        return maxCommand
    }

    get timelines() {
        return {
            s: this,
            * [Symbol.iterator]() {
                if (this.s._moveTimeline) yield this.s._moveTimeline
                if (this.s._moveXTimeline) yield this.s._moveXTimeline
                if (this.s._moveYTimeline) yield this.s._moveYTimeline
                if (this.s._scaleTimeline) yield this.s._scaleTimeline
                if (this.s._scaleVecTimeline) yield this.s._scaleVecTimeline
                if (this.s._rotateTimeline) yield this.s._rotateTimeline
                if (this.s._fadeTimeline) yield this.s._fadeTimeline
                if (this.s._colorTimeline) yield this.s._colorTimeline
            }
        }
    }

    get layer() {
        return 0;
    }

    getAllCommands() {
        const commands: SpriteCommand<any>[] = []

        for (const timeline of this.timelines) {
            commands.push(...timeline.commandList)
        }

        return commands
    }
}

export enum SBElementType {
    Point,
    Sprite,
    Animation,
}