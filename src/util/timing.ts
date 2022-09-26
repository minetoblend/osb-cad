export function* generateTicks(timingPoints: TimingPointData[], startTime: number, endTime: number, divisor: number) {
    timingPoints = timingPoints.filter(it => it.timingChange)

    let {index, found} = findTimingPointIndex(timingPoints, startTime)
    if (!found && index > 0)
        index--;

    let sectionStartTime = startTime
    do {
        const timingPoint = timingPoints[index]
        let sectionEndTime = Math.min(endTime, timingPoints[index + 1]?.offset ?? endTime)

        yield* generateTicksForTimingPoint(timingPoint.offset, timingPoint.beatLength, sectionStartTime, sectionEndTime, divisor)

        index++
        sectionStartTime = sectionEndTime
    } while ((timingPoints[index] && timingPoints[index].offset < endTime))
}

export function findTimingPointIndex(timingPoints: TimingPointData[], time: number) {
    let index = 0
    let left = 0;
    let right = timingPoints.length - 1;
    while (left <= right) {
        index = left + ((right - left) >> 1);
        let commandTime = timingPoints[index].offset;
        if (commandTime == time)
            return {found: true, index};
        else if (commandTime < time)
            left = index + 1;
        else right = index - 1;
    }
    index = left;
    return {found: false, index};
}

export function findCurrentTimingPoint(timingPoints: TimingPointData[], time: number): TimingPointData | undefined {
    timingPoints = timingPoints.filter(it => it.timingChange)
    let {index, found} = findTimingPointIndex(timingPoints, time)
    if (!found && index > 0)
        index--;
    return timingPoints[index]
}

export function snapTime(timingPoints: TimingPointData[], time: number, divisor: number): number {
    const timingPoint = findCurrentTimingPoint(timingPoints, time)
    if (!timingPoint)
        return time
    const snapLength = timingPoint.beatLength / divisor

    let differenceInBeats = (time - timingPoint.offset) / snapLength
    return timingPoint.offset + Math.round(differenceInBeats) * snapLength

}


export function* generateTicksForTimingPoint(offset: number, beatLength: number, startTime: number, endTime: number, divisor: number): Generator<TimingTick> {
    let time = startTime + (offset - startTime) % beatLength - beatLength

    let i = 0
    while (time < endTime) {
        const t = i * 12 / divisor

        let type: TimingTickType;
        if (t === 0) {
            type = TimingTickType.Full
        } else if (t === 6) {
            type = TimingTickType.Half
        } else if (t % 4 === 0) {
            type = TimingTickType.Third
        } else if (t % 3 === 0) {
            type = TimingTickType.Quarter
        } else if (t % 2 === 0) {
            type = TimingTickType.Sixth
        } else {
            type = TimingTickType.Other
        }
        yield {
            time: Math.floor(time),
            type,
        }

        time += beatLength / divisor
        i = (i + 1) % divisor
    }
}

export interface TimingTick {
    time: number
    type: TimingTickType
}

export enum TimingTickType {
    Full,
    Half,
    Third,
    Quarter,
    Sixth,
    Other,
}