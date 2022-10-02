export enum Easing {
    Linear = 0,

    QuadIn = 3,
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

    ElasticIn,
    ElasticOut,
    ElasticOutHalf,
    ElasticOutQuarter,
    ElasticInOut,

    BackIn,
    BackOut,
    BackInOut,

    BounceIn,
    BounceOut,
    BounceInOut,
}

type EasingFunction = ((x: number) => number);

function reverse(fn: EasingFunction, x: number) {
    return 1 - fn(1 - x)
}

function inout(fn: EasingFunction, x: number) {
    return 0.5 * (x < 0.5 ? fn(x * 2) : (2 - fn(2 - x * 2)))
}

export const easingFunctions: { [key in Easing]: EasingFunction } = {
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