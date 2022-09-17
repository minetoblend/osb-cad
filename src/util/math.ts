export function lerp(a: number, b: number, f: number) {
    return a + (b - a) * f
}

export class Vec2 {
    constructor(public x: number = 0, public y: number = x) {

    }

    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    get lengthSquared() {
        return this.x * this.x + this.y * this.y;
    }

    clone() {
        return new Vec2(this.x, this.y)
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

    set(x: number, y: number) {
        this.x = x
        this.y = y
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
}

export class Line {
    constructor(public from: Vec2, public to: Vec2) {
    }
}

export function getTangentsOf2Circles(center1: Vec2, rad1: number, center2: Vec2, rad2: number) {
    const ans: Line[] = []

    let d_sq = center1.sub(center2).lengthSquared;
    if (d_sq <= (rad1 - rad2) * (rad1 - rad2)) return [];

    const d = Math.sqrt(d_sq);
    let v = center2.sub(center1).divF(d)


    for (let sign1 = +1; sign1 >= -1; sign1 -= 2) {
        let c = (rad1 - sign1 * rad2) / d;
        if (c * c > 1.0) continue;
        const h = Math.sqrt(Math.max(0.0, 1.0 - c * c));

        for (let sign2 = +1; sign2 >= -1; sign2 -= 2) {
            const nx = v.x * c - sign2 * h * v.y;
            const ny = v.y * c + sign2 * h * v.x;

            ans.push(new Line(
                new Vec2(center1.x + rad1 * nx,
                    center1.y + rad1 * ny),
                new Vec2(
                    center2.x + sign1 * rad2 * nx,
                    center2.y + sign1 * rad2 * ny
                )
            ))

        }
    }

    return ans
}