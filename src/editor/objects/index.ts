import {Color, Float, Vec2} from "@/util/math";
import {Origin} from "@/editor/objects/origin";
import {AnimatedValue} from "@/editor/objects/animation";
import {
    ColorCommand,
    FadeCommand,
    MoveCommand,
    RotateCommand,
    ScaleCommand,
    ScaleVecCommand
} from "@/editor/objects/command";
import {Easing} from "@/editor/objects/easing";
import {Matrix} from "pixi.js";

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

    move(opts: MoveOptions) {
        const endTime = opts.endTime
        const startTime = opts.startTime ?? endTime

        const endPos = opts.endPos
        const startPos = opts.startPos ?? endPos

        const easing = opts.easing ?? Easing.Linear;

        this.moveTimeline.addCommand(new MoveCommand(easing, startTime, endTime, startPos, endPos))
    }

    scale(opts: ScaleOptions) {
        const endTime = opts.endTime
        const startTime = opts.startTime ?? endTime

        const endScale = opts.endScale
        const startScale = opts.startScale ?? endScale

        const easing = opts.easing ?? Easing.Linear;

        this.scaleTimeline.addCommand(new ScaleCommand(easing, startTime, endTime, new Float(startScale), new Float(endScale)))
    }

    scaleVec(opts: ScaleVecOptions) {
        const endTime = opts.endTime
        const startTime = opts.startTime ?? endTime

        const endScale = opts.endScale
        const startScale = opts.startScale ?? endScale

        const easing = opts.easing ?? Easing.Linear;

        this.scaleVecTimeline.addCommand(new ScaleVecCommand(easing, startTime, endTime, startScale, endScale))
    }

    rotate(opts: RotateOptions) {
        const endTime = opts.endTime
        const startTime = opts.startTime ?? endTime

        const endAngle = opts.endAngle
        const startAngle = opts.startAngle ?? endAngle

        const easing = opts.easing ?? Easing.Linear;

        this.rotateTimeline.addCommand(new RotateCommand(easing, startTime, endTime, new Float(startAngle), new Float(endAngle)))
    }

    fade(opts: FadeOptions) {
        const endTime = opts.endTime
        const startTime = opts.startTime ?? endTime

        const endAlpha = opts.endAlpha
        const startAlpha = opts.startAlpha ?? endAlpha

        const easing = opts.easing ?? Easing.Linear;

        this.fadeTimeline.addCommand(new FadeCommand(easing, startTime, endTime, new Float(startAlpha), new Float(endAlpha)))
    }

    color(opts: ColorOptions) {
        const endTime = opts.endTime
        const startTime = opts.startTime ?? endTime

        const endColor = opts.endColor
        const startColor = opts.startColor ?? endColor

        const easing = opts.easing ?? Easing.Linear;

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
        if (time >= this.moveTimeline.startTime && time <= this.moveTimeline.endTime)
            return true
        if (time >= this.moveXTimeline.startTime && time <= this.moveXTimeline.endTime)
            return true
        if (time >= this.moveYTimeline.startTime && time <= this.moveYTimeline.endTime)
            return true
        if (time >= this.scaleTimeline.startTime && time <= this.scaleTimeline.endTime)
            return true
        if (time >= this.scaleVecTimeline.startTime && time <= this.scaleVecTimeline.endTime)
            return true
        if (time >= this.rotateTimeline.startTime && time <= this.rotateTimeline.endTime)
            return true
        if (time >= this.fadeTimeline.startTime && time <= this.fadeTimeline.endTime)
            return true
        if (time >= this.colorTimeline.startTime && time <= this.colorTimeline.endTime)
            return true
        return false
    }

    get hasNoAnimation() {
        return !this.moveTimeline.hasCommands &&
            !this.moveXTimeline.hasCommands &&
            !this.moveYTimeline.hasCommands &&
            !this.scaleTimeline.hasCommands &&
            !this.scaleVecTimeline.hasCommands &&
            !this.rotateTimeline.hasCommands &&
            !this.fadeTimeline.hasCommands &&
            !this.colorTimeline.hasCommands
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
        this.moveTimeline.addOffset(amount)
        this.moveXTimeline.addOffset(amount)
        this.moveYTimeline.addOffset(amount)
        this.scaleTimeline.addOffset(amount)
        this.scaleVecTimeline.addOffset(amount)
        this.rotateTimeline.addOffset(amount)
        this.fadeTimeline.addOffset(amount)
        this.colorTimeline.addOffset(amount)
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

    getTransform(time: number) {
        const transform = new Matrix().identity()

        const pos = this.getPos(time)
        const scale = this.getScale(time)
        transform.scale(scale.x, scale.y)
        transform.rotate(this.getRotation(time))
        transform.translate(pos.x, pos.y)

        return transform
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
}

export enum SBElementType {
    Point,
    Sprite,
    Animation,
}

interface MoveOptions {
    easing?: Easing
    startTime?: number
    endTime: number
    startPos?: Vec2
    endPos: Vec2
}

interface ScaleOptions {
    easing?: Easing
    startTime?: number
    endTime: number
    startScale?: number
    endScale: number
}

interface ScaleVecOptions {
    easing?: Easing
    startTime?: number
    endTime: number
    startScale?: Vec2
    endScale: Vec2
}

interface RotateOptions {
    easing?: Easing
    startTime?: number
    endTime: number
    startAngle?: number
    endAngle: number
}


interface FadeOptions {
    easing?: Easing
    startTime?: number
    endTime: number
    startAlpha?: number
    endAlpha: number
}

interface ColorOptions {
    easing?: Easing
    startTime?: number
    endTime: number
    startColor?: Color
    endColor: Color
}