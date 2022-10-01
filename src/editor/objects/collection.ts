import {SBElement} from "@/editor/objects/index";
import {Vec2} from "@/util/math";
import {Origin} from "@/editor/objects/origin";
import {
    Attribute,
    AttributeType,
    FloatAttributeContainer,
    IntAttributeContainer,
    Vec2AttributeContainer
} from "@/editor/objects/attribute";
import TypedFastBitSet from "typedfastbitset";


export class SBCollection {

    elements: SBElement[]

    attributes = new Map<string, Attribute<any>>()

    constructor(elements: SBElement[] = [], attributes?: Map<string, Attribute<any>>) {
        this.elements = elements
        if (attributes)
            this.attributes = attributes

        this.attributes.forEach(it => it.resize(this.elements.length, false))
    }

    get length() {
        return this.elements.length
    }

    addAttribute(name: string, type: AttributeType): Attribute<any> {
        let attribute;
        switch (type) {
            case AttributeType.Float:
                attribute = new FloatAttributeContainer();
                break;
            case AttributeType.Int:
                attribute = new IntAttributeContainer();
                break;
            case AttributeType.Vec2:
                attribute = new Vec2AttributeContainer();
                break;
            default:
                throw new Error(`Unknown attribute type ${type}`)
        }
        attribute.resize(this.elements.length, false)
        this.attributes.set(name, attribute)
        return attribute;
    }

    getAttribute<T = any>(name: string, index: number, type?: AttributeType): T {
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

    getAttributeContainer<T = any>(name: string): Attribute<T> | undefined {
        return this.attributes.get(name)
    }

    getOrCreateAttributeContainer<T = any>(name: string, type?: AttributeType): Attribute<T> | undefined {
        let attr = this.attributes.get(name)
        if (attr)
            return attr
        if (!type)
            throw new Error('Tried to create attribute without known type')
        return this.addAttribute(name, type)
    }

    setAttribute<T = any>(name: string, index: number, value: T, type?: AttributeType) {
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
                    attribute = this.addAttribute(name, AttributeType.Vec2)
                else if (typeof value === "number")
                    attribute = this.addAttribute(name, AttributeType.Float)
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
        return this.addElement(el)
    }

    addElement(element: SBElement): { el: SBElement, index: number } {
        const el = element
        const index = this.elements.length
        this.elements.push(el)
        this.ensureSize()
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

    /**
     * @deprecated
     * @param index
     */
    getSprite(index: number) {
        return this.elements[index]
    }

    el(index: number) {
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
            ...geo.elements.map(it => it.clone())
        )
        geo.attributes.forEach((attr, key) => {
            const ownAttr = this.attributes.get(key)

            if (!ownAttr) {
                attr = attr.clone()

                attr.resize(this.elements.length, true)

                this.attributes.set(key, attr)
            } else {
                ownAttr.append(attr)
            }
        })
        this.ensureSize()
    }

    ensureSize() {
        this.attributes.forEach(it => it.resize(this.elements.length, false))
    }

    filter(predicate: (index: number, el: SBElement) => boolean) {
        const indices = new TypedFastBitSet()
        for (let i = 0; i < this.elements.length; i++) {
            if (predicate(i, this.elements[i])) {
                indices.add(i)
            }
        }
        this.elements = this.elements.filter((_, index) => indices.has(index))
        this.attributes.forEach(attribute => attribute.filterIndexes(indices))

        return this;
    }

    deleteIndices(indices: TypedFastBitSet) {
        const inverted = new TypedFastBitSet()
        this.elements.forEach((_, index) => {
            if (!indices.has(index))
                inverted.add(index)
        })

        this.elements = this.elements.filter((_, index) => inverted.has(index))
        this.attributes.forEach(attribute => attribute.filterIndexes(inverted))

        return this;
    }

    grow(size: number) {

        this.elements.push(...Array.from({length: size}, () => new SBElement(
            Vec2.zero(),
            Origin.TopLeft,
            -1,
            Vec2.one()
        )))
        this.ensureSize()
    }
}

