import {computed, reactive, shallowRef, watch} from "vue";
import gsap from 'gsap'
import {EditorContext} from "@/editor/ctx/context";
import {NodeDependencyType} from "@/editor/compile";
import {Sound} from "@/editor/audio";
import * as PIXI from 'pixi.js'
import {clamp} from "@/util/math";

export class EditorClock {
    constructor(private readonly ctx: EditorContext) {
        watch(this.time, () => ctx.markDependencyChanged(NodeDependencyType.Time))

        PIXI.Ticker.shared.add(() => {
            if (this.isPlaying) {
                const time = this.sound.value!.currentTime * 1000
                this._time.actual = time
                this._time.animated = time
            }
        })
    }

    sound = shallowRef<Sound>()

    private _tween?: gsap.core.Tween
    private _time = reactive({
        actual: 0,
        animated: 0,
    })

    seek(time: number, animated = false) {
        this.stopAnimation()
        if (time < 0)
            time = 0
        if (this.sound.value && time > this.sound.value.duration * 1000) {
            time = this.sound.value.duration * 1000
        }

        this._time.actual = time
        if (animated) {
            this._tween = gsap.to(this._time, {
                duration: 0.12,
                animated: time
            })
            if (!this.isPlaying) {
                this.scrub(time)
            }
        } else {
            this._time.animated = time
        }
        if (this.sound.value)
            this.sound.value.currentTime = time / 1000
    }

    seekAnimated(time: number) {
        this.seek(time, true)
    }

    private stopAnimation() {
        if (this._tween) {
            this._tween.kill()
            this._tween = undefined
        }
    }

    readonly time = computed(() => Math.floor(this._time.actual))
    readonly animatedTime = computed(() => Math.floor(this._time.animated))

    setSound(sound?: Sound) {
        if (this.sound.value) {
            this.sound.value.destroy()
        }
        if (sound) {
            sound.currentTime = clamp(this.time.value / 1000, 0, sound.duration)
        }
        this.sound.value = sound
        this.ctx.markDependencyChanged(NodeDependencyType.Audio)
    }

    get isPlaying() {
        return !!(this.sound.value?.isPlaying.value && !this.scrubbing)
    }

    start() {
        this.sound?.value?.play()
    }

    pause() {
        this.sound?.value?.pause()
    }

    togglePlaying() {
        if (this.isPlaying)
            this.pause()
        else
            this.start()
    }

    scrubbing = false

    private scrub(time: number) {
        if (!this.scrubbing && this.sound.value && !this.isPlaying) {
            this.scrubbing = true
            this.sound.value.currentTime = time / 1000

            this.sound.value.play()
            setTimeout(() => {
                if (this.sound.value) {
                    this.sound.value.stop()
                    this.sound.value.currentTime = time / 1000
                }
                this.scrubbing = false
            }, 100)
        }
    }

    get isLoaded() {
        return !!this.sound.value
    }

    get duration() {
        return (this.sound.value?.duration ?? 0) * 1000
    }
}