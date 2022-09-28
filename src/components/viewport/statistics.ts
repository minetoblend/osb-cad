export class StoryboardStatistics {

    commandCount = 0
    overlappingCommandCount = 0
    spritesWithOverlappingCommandCount = 0
    visibleSprites = 0

    add(count: number, overlapping: number) {
        this.commandCount += count
        if (overlapping > 0) {
            this.overlappingCommandCount += overlapping
            this.spritesWithOverlappingCommandCount++
        }
    }
}