import {Color, Float, Vec2} from "@/util/math";
import {Origin} from "@/editor/objects/origin";
import {AnimatedValue} from "@/editor/objects/animation";
import {ColorCommand, FadeCommand, MoveCommand, RotateCommand, ScaleCommand} from "@/editor/objects/command";
import {Easing} from "@/editor/objects/easing";


export class SBElement {
    constructor(pos: Vec2, origin: Origin, sprite: number, scale: Vec2) {
        this.pos = pos;
        this._origin = origin;
        this._sprite = sprite;
        this._scale = scale;
        this.moveTimeline = new AnimatedValue<Vec2>(this.pos)
        this.moveXTimeline = new AnimatedValue<Float>(new Float(this.pos.x))
        this.moveYTimeline = new AnimatedValue<Float>(new Float(this.pos.y))
        this.scaleTimeline = new AnimatedValue<Float>(new Float(this._scale.x))
        this.scaleVecTimeline = new AnimatedValue<Vec2>(this._scale)
        this.rotateTimeline = new AnimatedValue<Float>(new Float(0))
        this.fadeTimeline = new AnimatedValue<Float>(new Float(1))
        this.colorTimeline = new AnimatedValue<Color>(Color.white)
    }

    pos: Vec2
    _origin: Origin
    _sprite: number
    _scale: Vec2

    private moveTimeline: AnimatedValue<Vec2>
    private moveXTimeline: AnimatedValue<Float>
    private moveYTimeline: AnimatedValue<Float>
    private scaleTimeline: AnimatedValue<Float>
    private scaleVecTimeline: AnimatedValue<Vec2>
    private rotateTimeline: AnimatedValue<Float>
    private fadeTimeline: AnimatedValue<Float>
    private colorTimeline: AnimatedValue<Color>


    clone() {
        const el = new SBElement(this.pos.clone(), this._origin, this._sprite, this._scale.clone())
        el.moveTimeline = this.moveTimeline.clone()
        el.moveXTimeline = this.moveXTimeline.clone()
        el.moveYTimeline = this.moveYTimeline.clone()
        el.scaleTimeline = this.scaleTimeline.clone()
        el.rotateTimeline = this.rotateTimeline.clone()
        el.fadeTimeline = this.fadeTimeline.clone()
        el.colorTimeline = this.colorTimeline.clone()
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
        if (!this.moveTimeline.hasCommands)
            return this.pos
        return this.moveTimeline.valueAt(time)
    }


    getRotation(time: number = 0): number {
        return this.rotateTimeline.valueAt(time).value
    }

    getAlpha(time: number = 0): number {
        return this.fadeTimeline.valueAt(time).value
    }

    getColor(time: number = 0): Color {
        return this.colorTimeline.valueAt(time)
    }

    getScale(time: number = 0): Vec2 {
        if (this.scaleVecTimeline.hasCommands) {
            return this.scaleVecTimeline.valueAt(time)
        }
        const scale = this.scaleTimeline.valueAt(time)
        return new Vec2(scale.value, scale.value)
    }

    moveWithCommands(delta: Vec2) {
        this.pos.move(delta)
        this.moveTimeline.initialValue.move(delta)
        this.moveTimeline.commandList.forEach(it => {
            (it as MoveCommand).startPos.move(delta);
            (it as MoveCommand).endPos.move(delta);
        })
    }

    moveToWithCommands(to: Vec2) {
        const delta = to.sub(this.pos)
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