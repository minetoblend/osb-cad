import TypedFastBitSet from 'typedfastbitset'
import {Vec2} from "@/util/math";

export enum AttributeType {
    Int = 'i',
    Float = 'f',
    Vec2 = 'v'
}

export abstract class Attribute<T> {

    constructor(
        readonly bytesPerElement: number,
        readonly valuesPerElement: number,
    ) {
    }

    abstract getValue(index: number): T

    abstract setValue(index: number, value: T): void

    abstract resize(size: number, prepend: boolean): void

    abstract getValues(): ArrayLike<T>

    abstract append(container: this): void

    abstract clone(): Attribute<T>

    abstract length: number

    abstract filterIndexes(bitset: TypedFastBitSet): void

    get byteLength() {
        return this.length * this.bytesPerElement
    }
}

export abstract class ArrayBufferContainer<T, I extends Float32Array | Int32Array | Uint8Array> extends Attribute<T> {
    private buffer: ArrayBuffer;
    view: I

    constructor(bytesPerElement: number, valuesPerElement: number, valuesOrSize?: ArrayLike<T> | ArrayBuffer | number) {
        super(bytesPerElement, valuesPerElement);
        if (!valuesOrSize || typeof valuesOrSize === 'number') {
            this.buffer = new ArrayBuffer((valuesOrSize ?? 0) * this.bytesPerElement)
        } else if (valuesOrSize instanceof ArrayBuffer) {
            this.buffer = valuesOrSize.slice(0)
        } else {
            this.buffer = new ArrayBuffer(valuesOrSize.length * this.bytesPerElement)
            this.set(valuesOrSize, 0)
        }
        this.view = this.createView(this.buffer)
    }

    abstract set(values: ArrayLike<T>, offset?: number): void;

    setFromView(view: I, offset: number | undefined): void {
        this.view.set(view, offset)
    }

    setBytes(values: ArrayBuffer, byteOffset?: number) {
        const ownData = new Uint8Array(this.buffer)
        const data = new Uint8Array(values)
        ownData.set(data, byteOffset)
    }

    abstract createEmptyView(length: number): I

    append(container: ArrayBufferContainer<T, I>): void {

        const byteOffset = this.byteLength
        this.resize(this.length + container.length, false)
        this.setBytes(container.buffer, byteOffset)
    }

    resize(size: number, prepend: boolean): void {
        if (size < this.length) {
            if (prepend) {
                this.setBuffer(this.buffer.slice(this.byteLength - size * this.bytesPerElement, this.byteLength))
            } else {
                this.setBuffer(this.buffer.slice(0, size * this.bytesPerElement))
            }
        } else {
            const oldView = this.view
            const emptyView = this.createEmptyView(size - this.length)
            this.setBuffer(new ArrayBuffer(size * this.bytesPerElement))

            if (prepend) {
                this.setFromView(emptyView, 0)
                this.setFromView(oldView, emptyView.length)
            } else {
                this.setFromView(oldView, 0)
                this.setFromView(emptyView, oldView.length)
            }
        }
    }

    filterIndexes(bitset: TypedFastBitSet) {
        this.setBuffer(
            this.view.filter((it, index) => bitset.has(index / this.valuesPerElement)).buffer
        )
    }

    get length() {
        return this.view.length / this.valuesPerElement
    }

    private setBuffer(buffer: ArrayBuffer) {
        this.buffer = buffer
        this.view = this.createView(buffer)
    }

    getBuffer() {
        return this.buffer
    }

    abstract createView(buffer: ArrayBuffer): I
}

export class FloatAttributeContainer extends ArrayBufferContainer<number, Float32Array> {


    constructor(valuesOrSize?: ArrayLike<number> | ArrayBuffer | number) {
        super(Float32Array.BYTES_PER_ELEMENT, 1, valuesOrSize);
    }

    createView(buffer: ArrayBuffer): Float32Array {
        return new Float32Array(buffer);
    }

    clone(): Attribute<number> {
        return new FloatAttributeContainer(this.getBuffer());
    }

    createEmptyView(length: number): Float32Array {
        return new Float32Array(length);
    }

    getValue(index: number): number {
        return this.view[index];
    }

    setValue(index: number, value: number): void {
        this.view[index] = value
    }

    getValues(): ArrayLike<number> {
        return this.view;
    }

    set(values: ArrayLike<number>, offset: number | undefined): void {
        this.view.set(values, offset)
    }
}

export class IntAttributeContainer extends ArrayBufferContainer<number, Int32Array> {

    constructor(valuesOrSize?: ArrayLike<number> | ArrayBuffer | number) {
        super(Float32Array.BYTES_PER_ELEMENT, 1, valuesOrSize);
    }

    createView(buffer: ArrayBuffer): Int32Array {
        return new Int32Array(buffer);
    }

    clone(): Attribute<number> {
        return new FloatAttributeContainer(this.getBuffer());
    }

    createEmptyView(length: number): Int32Array {
        return new Int32Array(length);
    }

    getValue(index: number): number {
        return this.view[index];
    }

    setValue(index: number, value: number): void {
        this.view[index] = value
    }

    getValues(): ArrayLike<number> {
        return this.view;
    }

    set(values: ArrayLike<number>, offset: number | undefined): void {
        this.view.set(values, offset)
    }
}

export class GroupAttributeContainer extends Attribute<boolean> {
    private bitset: TypedFastBitSet
    private numBits = 0;

    constructor(values?: TypedFastBitSet) {
        super(1, 1);
        if (values)
            this.bitset = values.clone()
        else
            this.bitset = new TypedFastBitSet()
    }

    get length() {
        return this.numBits
    }

    append(container: this): void {
        const offset = this.length

        this.bitset.union(
            new TypedFastBitSet(
                Array.from(container.bitset, v => v + offset)
            )
        )
        this.numBits += container.numBits
    }

    clone(): Attribute<boolean> {
        return new GroupAttributeContainer(this.bitset);
    }

    filterIndexes(bitset: TypedFastBitSet): void {
        const newBitset = new TypedFastBitSet()
        let removed = 0;
        for (let i = 0; i < this.length; i++) {
            if (bitset.has(i)) {
                if (this.bitset.has(i))
                    newBitset.add(i - removed)
            } else {
                removed++
            }
        }

        this.bitset = newBitset
    }

    getValue(index: number): boolean {
        return this.bitset.has(index);
    }

    getValues(): ArrayLike<boolean> {
        return Array.from({length: this.length}, (_, idx) => this.bitset.has(idx));
    }

    resize(size: number, prepend: boolean): void {
        const newBitset = new TypedFastBitSet()

        if (size < this.length) {
            const offset = this.length - size
            if (prepend) {
                newBitset.union(new TypedFastBitSet(Array.from(this.bitset, (_, idx) =>
                    idx - offset
                )))
            } else
                newBitset.removeRange(size, this.length)

        } else {
            if (prepend) {
                return;
            } else {
                const offset = this.length
                newBitset.union(new TypedFastBitSet(Array.from(this.bitset, (_, idx) =>
                    idx + offset
                )))
            }
        }

        this.bitset = newBitset
    }

    setValue(index: number, value: boolean): void {
    }

}


export class Vec2AttributeContainer extends ArrayBufferContainer<Vec2, Float32Array> {

    constructor(valuesOrSize?: ArrayLike<Vec2> | ArrayBuffer | number) {
        super(Float32Array.BYTES_PER_ELEMENT * 2, 2, valuesOrSize);
    }

    createView(buffer: ArrayBuffer): Float32Array {
        return new Float32Array(buffer);
    }

    clone(): Attribute<Vec2> {
        return new Vec2AttributeContainer(this.getBuffer())
    }

    createEmptyView(length: number): Float32Array {
        return new Float32Array(length * 2);
    }

    getValue(index: number): Vec2 {
        return new Vec2(
            this.view[index * 2],
            this.view[index * 2 + 1]
        );
    }

    setValue(index: number, value: Vec2): void {
        this.view[index * 2] = value.x
        this.view[index * 2 + 1] = value.y
    }

    getValues(): Array<Vec2> {
        return Array.from({length: this.length}, (_, index) => new Vec2(
            this.view[index * 2],
            this.view[index * 2 + 1]
        ))
    }

    set(values: ArrayLike<Vec2>, offset: number | undefined): void {
        //this.view.set(values, offset)
        for (let i = 0; i < values.length; i++) {
            this.setValue(i, values[i])
        }
    }

}