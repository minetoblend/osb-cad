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

}