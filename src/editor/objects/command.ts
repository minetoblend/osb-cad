import {clamp, Color, Float, Vec2} from "@/util/math";
import {Easing, easingFunctions} from "@/editor/objects/easing";

export abstract class SpriteCommand<T> {

    protected constructor(public startTime: number, public endTime: number) {
    }

    abstract clone(): SpriteCommand<T>

    abstract valueAtTime(time: number): T
}

export class MoveCommand extends SpriteCommand<Vec2> {

    constructor(public easing: Easing, startTime: number, endTime: number, public startPos: Vec2, public endPos: Vec2) {
        super(startTime, endTime);
    }


    clone(): SpriteCommand<Vec2> {
        return new MoveCommand(this.easing, this.startTime, this.endTime, this.startPos.clone(), this.endPos.clone());
    }

    valueAtTime(time: number): Vec2 {
        time = clamp(time, this.startTime, this.endTime);


        let f = (time - this.startTime) / (this.endTime - this.startTime)
        if (this.startTime === this.endTime)
            f = 1;

        f = easingFunctions[this.easing](f)

        return this.startPos.lerp(this.endPos, f);
    }
}

export class ScaleCommand extends SpriteCommand<Float> {

    constructor(public easing: Easing, startTime: number, endTime: number, public startScale: Float, public endScale: Float) {
        super(startTime, endTime);
    }

    clone(): SpriteCommand<Float> {
        return new ScaleCommand(this.easing, this.startTime, this.endTime, this.startScale.clone(), this.endScale.clone());
    }

    valueAtTime(time: number): Float {
        time = clamp(time, this.startTime, this.endTime);

        let f = (time - this.startTime) / (this.endTime - this.startTime)
        if (this.startTime === this.endTime)
            f = 1;

        f = easingFunctions[this.easing](f)

        return this.startScale.lerp(this.endScale, f);
    }
}

export class RotateCommand extends SpriteCommand<Float> {

    constructor(public easing: Easing, startTime: number, endTime: number, public startAngle: Float, public endAngle: Float) {
        super(startTime, endTime);
    }

    clone(): SpriteCommand<Float> {
        return new RotateCommand(this.easing, this.startTime, this.endTime, this.startAngle.clone(), this.endAngle.clone());
    }

    valueAtTime(time: number): Float {
        time = clamp(time, this.startTime, this.endTime);

        let f = (time - this.startTime) / (this.endTime - this.startTime)
        if (this.startTime === this.endTime)
            f = 1;

        f = easingFunctions[this.easing](f)

        return this.startAngle.lerp(this.endAngle, f);
    }
}

export class FadeCommand extends SpriteCommand<Float> {

    constructor(public easing: Easing, startTime: number, endTime: number, public startAlpha: Float, public endAlpha: Float) {
        super(startTime, endTime);
    }

    clone(): SpriteCommand<Float> {
        return new FadeCommand(this.easing, this.startTime, this.endTime, this.startAlpha.clone(), this.endAlpha.clone());
    }

    valueAtTime(time: number): Float {
        time = clamp(time, this.startTime, this.endTime);

        let f = (time - this.startTime) / (this.endTime - this.startTime)
        if (this.startTime === this.endTime)
            f = 1;

        f = easingFunctions[this.easing](f)

        return this.startAlpha.lerp(this.endAlpha, f);
    }
}

export class ColorCommand extends SpriteCommand<Color> {

    constructor(public easing: Easing, startTime: number, endTime: number, public startColor: Color, public endColor: Color) {
        super(startTime, endTime);
    }

    clone(): SpriteCommand<Color> {
        return new ColorCommand(this.easing, this.startTime, this.endTime, this.startColor.clone(), this.endColor.clone());
    }

    valueAtTime(time: number): Color {
        time = clamp(time, this.startTime, this.endTime);

        let f = (time - this.startTime) / (this.endTime - this.startTime)
        if (this.startTime === this.endTime)
            f = 1;

        f = easingFunctions[this.easing](f)

        return this.startColor.lerp(this.endColor, f);
    }
}