import {SBElement} from "@/editor/objects/index";
import {Vec2} from "@/util/math";
import {Origin} from "@/editor/objects/origin";


export class SBCollection {

    elements: SBElement[]

    attributes = new Map<string, AttributeContainer<any>>()

    constructor(elements: SBElement[] = [], attributes?: Map<string, AttributeContainer<any>>) {
        this.elements = elements
        if (attributes)
            this.attributes = attributes

        this.attributes.forEach(it => it.setSize(this.elements.length, false))
    }

    addAttribute(name: string, type: 'number' | 'vec2'): AttributeContainer<any> {
        let attribute;
        switch (type) {
            case "number":
                attribute = new SimpleAttributeContainer(0);
                break;
            case "vec2":
                attribute = new CloneableAttributeContainer(new Vec2());
                break;
            default:
                throw new Error(`Unknown attribute type ${type}`)
        }
        attribute.setSize(this.elements.length, false)
        this.attributes.set(name, attribute)
        return attribute;
    }

    getAttribute<T = any>(name: string, index: number, type?: 'number' | 'vec2'): T {
        if (name === 'pos')
            return this.getSprite(index)?._pos as unknown as T
        if (name === 'scale')
            return this.getSprite(index)?._scale as unknown as T
        if (name === 'rotation')
            return this.getSprite(index)?._rotation as unknown as T
        let attribute = this.attributes.get(name)
        if (!attribute) {
            if (type)
                attribute = this.addAttribute(name, type)
            else
                throw new Error("Unknown attribute type")
        }
        return attribute!.getValue(index) as T
    }

    getAttributeContainer<T = any>(name: string): AttributeContainer<T> | undefined {
        return this.attributes.get(name)
    }

    setAttribute<T = any>(name: string, index: number, value: T, type?: 'number' | 'vec2') {
        if (name === 'pos')
            this.getSprite(index)!._pos = value as unknown as Vec2
        else if (name === 'rotation')
            this.getSprite(index)!._rotation = value as unknown as number
        else if (name === 'scale') {
            if (typeof value === "number")
                value = new Vec2(value, value) as unknown as T
            this.getSprite(index)!._scale = value as unknown as Vec2
        } else {
            let attribute = this.attributes.get(name)
            if (!attribute) {
                if (type)
                    attribute = this.addAttribute(name, type)
                else if (value instanceof Vec2)
                    attribute = this.addAttribute(name, 'vec2')
                else if (typeof value === "number")
                    attribute = this.addAttribute(name, 'number')
                else
                    throw Error(`Invalid attribute type for ${value}, allowed types are number and Vec2`)
            }
            attribute!.setValue(index, value)
        }
    }

    hasAttribute(attribute: string) {
        return this.attributes.has(attribute)
    }

    addSprite(
        pos: Vec2 = Vec2.zero(),
        origin: Origin = Origin.Centre,
        sprite: number = -1,
        scale: Vec2 = Vec2.one()
    ): { el: SBElement, index: number } {
        const el = new SBElement(pos, origin, sprite, scale)
        const index = this.elements.length
        this.elements.push(el)
        return {el, index}
    }

    addElement(element: SBElement): { el: SBElement, index: number } {
        const el = element
        const index = this.elements.length
        this.elements.push(el)
        return {el, index}
    }

    clone() {
        return new SBCollection(
            this.elements.map(it => it.clone()),
            new Map(
                Array.from(this.attributes, ([key, value]) => [key, value.clone()])
            )
        )
    }

    getSprite(index: number) {
        return this.elements[index]
    }

    forEach(run: (index: number, el: SBElement) => void) {
        for (let i = 0; i < this.elements.length; i++) {
            run(i, this.elements[i])
        }
        return this;
    }

    append(geo: SBCollection) {
        this.elements.push(
            ...geo.elements
        )
        geo.attributes.forEach((attr, key) => {
            const ownAttr = this.attributes.get(key)

            if (!ownAttr) {
                attr = attr.clone()
                attr.setSize(this.elements.length, true)
                this.attributes.set(key, attr)
            } else {
                ownAttr.append(attr)
            }
        })
        this.ensureSize()
    }

    ensureSize() {
        this.attributes.forEach(it => it.setSize(this.elements.length, false))
    }

    filter(predicate: (index: number, el: SBElement) => boolean) {
        let indexes = new Set<number>()
        for (let i = 0; i < this.elements.length; i++) {
            if (predicate(i, this.elements[i]))
                indexes.add(i)
        }
        this.elements = this.elements.filter((it, index) => indexes.has(index))
        this.attributes.forEach(attribute => attribute.keepIndexes(indexes))

        return this;
    }
}

export abstract class AttributeContainer<T> {

    abstract getValue(index: number): T

    abstract setValue(index: number, value: T): void

    abstract setSize(size: number, prepend: boolean): void

    abstract getValues(): T[]

    abstract append(container: AttributeContainer<T>): void

    abstract clone(): AttributeContainer<T>

    abstract length: number

    abstract keepIndexes(indexes: Set<number>): void
}

export abstract class ArrayAttributeContainer<T> extends AttributeContainer<T> {

    protected values: T[] = []

    constructor(protected readonly defaultValue: T, values: T[] = []) {
        super();
        this.values = values;
    }

    getValue(index: number): T {
        return this.values[index];
    }

    setSize(size: number, prepend: boolean): void {
        if (size < this.values.length) {
            if (prepend)
                this.values.splice(0, this.values.length - size)
            else
                this.values.splice(size)
        } else {
            if (prepend)
                this.values.unshift(
                    ...Array(size - this.length).fill(this.defaultValue)
                )
            else
                this.values.push(
                    ...Array(size - this.length).fill(this.defaultValue)
                )
        }
    }

    setValue(index: number, value: T): void {
        this.values[index] = value
    }

    getValues(): T[] {
        return this.values;
    }

    get length() {
        return this.values.length;
    }

    keepIndexes(indexes: Set<number>) {
        this.values = this.values.filter((value, index) => indexes.has(index))
    }

}

export class SimpleAttributeContainer<T> extends ArrayAttributeContainer<T> {
    clone(): AttributeContainer<T> {
        return new SimpleAttributeContainer(this.defaultValue, [...this.values]);
    }

    append(container: AttributeContainer<T>): void {
        this.values.push(...container.getValues())
    }
}

export class CloneableAttributeContainer<T extends Clonable> extends ArrayAttributeContainer<T> {
    clone(): AttributeContainer<T> {
        return new SimpleAttributeContainer(this.defaultValue, this.values.map(it => it.clone()));
    }

    append(container: AttributeContainer<T>): void {
        this.values.push(...container.getValues().map(it => it.clone()))
    }
}