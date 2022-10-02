"use strict";

export {};

declare global {


    /**
     * Current position of the sprite
     */
    let $pos: Vec2;

    /**
     * Current scale of the sprite
     */
    let $scale: Vec2;

    /**
     * Current rotation of the sprite
     */
    let $rotation: number;

    /**
     * Current alpha of the sprite
     */
    let $alpha: number;


    /**
     * Current position of the sprite
     */
    let v$pos: Vec2;

    /**
     * Current scale of the sprite
     */
    let v$scale: Vec2;

    /**
     * Current rotation of the sprite
     */
    let f$rotation: number;

    /**
     * Current alpha of the sprite
     */
    let f$alpha: number;

    /**
     * Current time
     */
    const _time: number;

    /**
     * Duration between current frame and last frame, not guaranteed to have a value
     */
    const _delta: number | undefined;

    /**
     * Index of the current geometry.
     */
    const idx: number;

    /**
     * Fetch sprites from a given location.
     * @param geo If a number is given, tries to fetch the geometry from the corresponding input of the node. If a string is given, tries to resolve the node and get it's output.
     * @param name The name of the attribute
     * @param idx The sprite index
     */
    function getAttrib(geo: number | string, name: string, idx: number): any;

    function getAttrib(geo: number | string, name: 'pos', idx: number): Vec2;

    function getAttrib(geo: number | string, name: 'scale', idx: number): Vec2;

    function getAttrib(geo: number | string, name: 'rotation', idx: number): number;

    function getAttrib(geo: number | string, name: 'alpha', idx: number): number;


    /**
     * Deletes a sprite from the current geometry
     * @param idx the index of the sprite to delete
     */
    function deleteSprite(idx: number): void;

    /**
     * Creates a new sprite
     * @return an object containing the created sprite, and the index at which it was placed
     */
    function addSprite(position?: Vec2, origin?: Origin, sprite?: number, scale?: Vec2): { el, index };

    /**
     * Fetch sprites from a given location.
     * @param name The name of the attribute
     * @param idx The sprite index
     * @param value The value to set the attribute to
     */
    function setAttrib(name: string, idx: number, value: any): void;

    function setAttrib(name: 'pos', idx: number, value: Vec2): void;

    function setAttrib(name: 'scale', idx: number, value: Vec2): void;

    function setAttrib(name: 'rotation', idx: number, value: number): void;

    function setAttrib(name: 'alpha', idx: number, value: number): void;

    function move(easing: Easing, startTime: number, endTime: number, startPos: Vec2, endPos: Vec2): void;
    function move(startTime: number, endTime: number, startPos: Vec2, endPos: Vec2): void;
    function move(easing: Easing, time: number, position: Vec2): void;
    function move(time: number, position: Vec2): void;

    function scale(easing: Easing, startTime: number, endTime: number, startScale: number, endScale: number): void;
    function scale(startTime: number, endTime: number, startScale: number, endScale: number): void;
    function scale(easing: Easing, time: number, scale: number): void;
    function scale(time: number, scale: number): void;

    function scaleVec(easing: Easing, startTime: number, endTime: number, startScale: Vec2, endScale: Vec2): void;
    function scaleVec(startTime: number, endTime: number, startScale: Vec2, endScale: Vec2): void;
    function scaleVec(easing: Easing, time: number, scale: Vec2): void;
    function scaleVec(time: number, scale: Vec2): void;

    function rotate(easing: Easing, startTime: number, endTime: number, startRotation: number, endRotation: number): void;
    function rotate(startTime: number, endTime: number, startRotation: number, endRotation: number): void;
    function rotate(easing: Easing, time: number, rotation: number): void;
    function rotate(time: number, rotation: number): void;

    function fade(easing: Easing, startTime: number, endTime: number, startAlpha: number, endAlpha: number): void;
    function fade(startTime: number, endTime: number, startAlpha: number, endAlpha: number): void;
    function fade(easing: Easing, time: number, alpha: number): void;
    function fade(time: number, alpha: number): void;

    function vec2(x: number = 0, y: number = x): Vec2;

    class Vec2 {
        constructor(public x: number, public y: number) {
        }

        constructor(public x: number = 0, public y: number = x) {

        }

        get length() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        }

        get lengthSquared() {
            return this.x * this.x + this.y * this.y;
        }

        get normalized() {
            const l = this.length
            return this.divF(l)
        }

        static zero() {
            return new Vec2();
        }

        static one() {
            return new Vec2(1, 1);
        }

        static playfieldCentre() {
            return new Vec2(320, 240)
        }

        clone() {
            return new Vec2(this.x, this.y)
        }

        add({x, y}: Vec2) {
            return new Vec2(this.x + x, this.y + y)
        }

        sub({x, y}: Vec2) {
            return new Vec2(this.x - x, this.y - y)
        }

        mul({x, y}: Vec2) {
            return new Vec2(this.x * x, this.y * y)
        }

        div({x, y}: Vec2) {
            return new Vec2(this.x / x, this.y / y)
        }

        addF(f: number) {
            return new Vec2(this.x + f, this.y + f)
        }

        subF(f: number) {
            return new Vec2(this.x - f, this.y - f)
        }

        mulF(f: number) {
            return new Vec2(this.x * f, this.y * f)
        }

        divF(f: number) {
            return new Vec2(this.x / f, this.y / f)
        }

        rotate(angle: number) {
            const cs = Math.cos(angle)
            const sn = Math.sin(angle)
            return new Vec2(
                this.x * cs - this.y * sn,
                this.x * sn + this.y * cs,
            )
        }

        rotateDeg(angle: number) {
            const cs = Math.cos(angle / 180 * Math.PI)
            const sn = Math.sin(angle / 180 * Math.PI)
            return new Vec2(
                this.x * cs - this.y * sn,
                this.x * sn + this.y * cs,
            )
        }

        withX(x: number) {
            return new Vec2(x, this.y)
        }

        withY(y: number) {
            return new Vec2(this.x, y)
        }

        lerp({x, y}: Vec2, f: number) {
            return new Vec2(
                this.x + (x - this.x) * f,
                this.y + (y - this.y) * f
            )
        }

        set(x: number | Vec2, y?: number) {
            if (x instanceof Vec2) {
                this.x = x.x
                this.y = x.y
            } else {
                this.x = x
                this.y = y ?? this.y
            }
        }

        move(rhs: Vec2) {
            this.x += rhs.x
            this.y += rhs.y
        }

        min({x, y}: Vec2): Vec2 {
            return new Vec2(
                Math.min(this.x, x),
                Math.min(this.y, y),
            )
        }

        max({x, y}: Vec2): Vec2 {
            return new Vec2(
                Math.max(this.x, x),
                Math.max(this.y, y),
            )
        }

        toString() {
            return `(${this.x}, ${this.y})`
        }

        equals(rhs: Vec2) {
            return this.x === rhs.x && this.y === rhs.y
        }
    }

    enum Origin {
        TopLeft = 0,
        Centre = 1,
        CentreLeft = 2,
        TopRight = 3,
        BottomCentre = 4,
        TopCentre = 5,
        Custom = 6,
        CentreRight = 7,
        BottomLeft = 8,
        BottomRight = 9,
    }

    enum Easing {
        Linear = 0,

        QuadIn,
        QuadOut,
        QuadInOut,

        CubicIn,
        CubicOut,
        CubicInOut,

        QuartIn,
        QuartOut,
        QuartInOut,

        QuintIn,
        QuintOut,
        QuintInOut,

        SineIn,
        SineOut,
        SineInOut,

        ExpoIn,
        ExpoOut,
        ExpoInOut,

        CircIn,
        CircOut,
        CircInOut,

        BackIn,
        BackOut,
        BackInOut,

        BounceIn,
        BounceOut,
        BounceInOut,

        ElasticIn,
        ElasticOut,
        ElasticOutHalf,
        ElasticOutQuarter,
        ElasticInOut,
    }

    type EasingFunction = ((x: number) => number);

    function reverse(fn: EasingFunction, x: number) {
        return 1 - fn(1 - x)
    }

    function inout(fn: EasingFunction, x: number) {
        return 0.5 * (x < 0.5 ? fn(x * 2) : (2 - fn(2 - x * 2)))
    }

    const easingFunctions: { [key in Easing]: EasingFunction } = {
        [Easing.Linear]: x => x,
        [Easing.QuadIn]: x => x * x,
        [Easing.QuadOut]: x => reverse(easingFunctions[Easing.QuadIn], x),
        [Easing.QuadInOut]: x => inout(easingFunctions[Easing.QuadIn], x),

        [Easing.CubicIn]: x => x * x * x,
        [Easing.CubicOut]: x => reverse(easingFunctions[Easing.CubicIn], x),
        [Easing.CubicInOut]: x => inout(easingFunctions[Easing.CubicIn], x),

        [Easing.QuartIn]: x => x * x * x * x,
        [Easing.QuartOut]: x => reverse(easingFunctions[Easing.QuartIn], x),
        [Easing.QuartInOut]: x => inout(easingFunctions[Easing.QuartIn], x),

        [Easing.QuintIn]: x => x * x * x * x * x,
        [Easing.QuintOut]: x => reverse(easingFunctions[Easing.QuintIn], x),
        [Easing.QuintInOut]: x => inout(easingFunctions[Easing.QuintIn], x),

        [Easing.SineIn]: x => 1 - Math.cos(x * Math.PI * 0.5),
        [Easing.SineOut]: x => reverse(easingFunctions[Easing.SineIn], x),
        [Easing.SineInOut]: x => inout(easingFunctions[Easing.SineIn], x),

        [Easing.ExpoIn]: x => Math.pow(2, 10 * (x - 1)),
        [Easing.ExpoOut]: x => reverse(easingFunctions[Easing.ExpoIn], x),
        [Easing.ExpoInOut]: x => inout(easingFunctions[Easing.ExpoIn], x),

        [Easing.CircIn]: x => 1 - Math.sqrt(1 - x * x),
        [Easing.CircOut]: x => reverse(easingFunctions[Easing.CircIn], x),
        [Easing.CircInOut]: x => inout(easingFunctions[Easing.CircIn], x),

        [Easing.BackIn]: x => x * x * ((1.70158 + 1) * x - 1.70158),
        [Easing.BackOut]: x => reverse(easingFunctions[Easing.BackIn], x),
        [Easing.BackInOut]: x => inout(easingFunctions[Easing.BackIn], x),

        [Easing.BounceIn]: x => reverse(easingFunctions[Easing.BounceOut], x),
        [Easing.BounceOut]: x => x < 1 / 2.75 ? 7.5625 * x * x : x < 2 / 2.75 ? 7.5625 * (x -= (1.5 / 2.75)) * x + .75 : x < 2.5 / 2.75 ? 7.5625 * (x -= (2.25 / 2.75)) * x + .9375 : 7.5625 * (x -= (2.625 / 2.75)) * x + .984375,
        [Easing.BounceInOut]: x => inout(easingFunctions[Easing.BounceIn], x),

        [Easing.ElasticIn]: x => reverse(easingFunctions[Easing.ElasticOut], x),
        [Easing.ElasticOut]: x => Math.pow(2, -10 * x) * Math.sin((x - 0.075) * (2 * Math.PI) / .3) + 1,
        [Easing.ElasticOutHalf]: x => Math.pow(2, -10 * x) * Math.sin((0.5 * x - 0.075) * (2 * Math.PI) / .3) + 1,
        [Easing.ElasticOutQuarter]: x => Math.pow(2, -10 * x) * Math.sin((0.25 * x - 0.075) * (2 * Math.PI) / .3) + 1,
        [Easing.ElasticInOut]: x => inout(easingFunctions[Easing.ElasticIn], x),
    }

    export function color(r: number, g: number, b: number): Color

    export class Color {
        constructor(public r: number, public g: number, public b: number) {
        }

        static get white(): Color {
            return new Color(1, 1, 1);
        }

        static get black(): Color {
            return new Color(0, 0, 0);
        }

        get hex() {
            let r = clamp(this.r, 0, 1) * 255
            let g = clamp(this.g, 0, 1) * 255
            let b = clamp(this.b, 0, 1) * 255
            return (r << 16) | (g << 8) | b
        }

        add(rhs: Color): Color {
            return new Color(this.r + rhs.r, this.g + rhs.g, this.b + rhs.b);
        }

        addF(rhs: number): Color {
            return new Color(this.r + rhs, this.g + rhs, this.b + rhs);
        }

        clone(): Color {
            return new Color(this.r, this.g, this.b);
        }

        div(rhs: Color): Color {
            return new Color(this.r / rhs.r, this.g / rhs.g, this.b / rhs.b);
        }

        divF(rhs: number): Color {
            return new Color(this.r / rhs, this.g / rhs, this.b / rhs);
        }

        lerp(rhs: Color, f: number): Color {
            return new Color(
                this.r + (rhs.r - this.r) * f,
                this.g + (rhs.g - this.g) * f,
                this.b + (rhs.b - this.b) * f,
            );
        }

        mul(rhs: Color): Color {
            return new Color(this.r * rhs.r, this.g * rhs.g, this.b * rhs.b);
        }

        mulF(rhs: number): Color {
            return new Color(this.r * rhs, this.g * rhs, this.b * rhs);
        }

        sub(rhs: Color): Color {
            return new Color(this.r - rhs.r, this.g - rhs.g, this.b - rhs.b);
        }

        subF(rhs: number): Color {
            return new Color(this.r - rhs, this.g - rhs, this.b - rhs);
        }
    }

    class SBElement {
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


        clone() : SBElement;

        move(easing: Easing, startTime: number, endTime: number, startPos: Vec2, endPos: Vec2): void;
        move(startTime: number, endTime: number, startPos: Vec2, endPos: Vec2): void;
        move(easing: Easing, time: number, position: Vec2): void;
        move(time: number, position: Vec2): void;

        scale(easing: Easing, startTime: number, endTime: number, startScale: number, endScale: number): void;
        scale(startTime: number, endTime: number, startScale: number, endScale: number): void;
        scale(easing: Easing, time: number, position: number): void;
        scale(time: number, position: number): void;

        scaleVec(easing: Easing, startTime: number, endTime: number, startScale: Vec2, endScale: Vec2): void;
        scaleVec(startTime: number, endTime: number, startScale: Vec2, endScale: Vec2): void;
        scaleVec(easing: Easing, time: number, position: Vec2): void;
        scaleVec(time: number, position: Vec2): void;

        rotate(easing: Easing, startTime: number, endTime: number, startAngle: number, endAngle: number): void;
        rotate(startTime: number, endTime: number, startAngle: number, endAngle: number): void;
        rotate(easing: Easing, time: number, position: number): void;
        rotate(time: number, position: number): void;

        fade(easing: Easing, startTime: number, endTime: number, startAlpha: number, endAlpha: number): void;
        fade(startTime: number, endTime: number, startAlpha: number, endAlpha: number): void;
        fade(easing: Easing, time: number, position: number): void;
        fade(time: number, position: number): void;


        fade(easing: Easing, startTime: number, endTime: number, startAlpha: number, endAlpha: number): void;
        fade(startTime: number, endTime: number, startAlpha: number, endAlpha: number): void;
        fade(easing: Easing, time: number, position: number): void;
        fade(time: number, position: number): void;

        getPos(time: number = 0): Vec2;

        getRotation(time: number = 0): number;

        getAlpha(time: number = 0): number;

        isVisibleAt(time: number = 0): booleanl

        get hasNoAnimation(): boolean;

        getColor(time: number = 0): Color;

        getScale(time: number = 0): Vec2 ;

        moveWithCommands(delta: Vec2): void

        moveToWithCommands(to: Vec2): void

        offsetAnimation(amount: number): void

        applyAnimationFrom(el: SBElement): void

        commandCountAt(time: number): { count: number, overlapping: number };

        isActiveAt(time: number): boolean;

        get firstCommand(): any | undefined;

        get lastCommand(): any | undefined;
    }

}