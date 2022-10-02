import {BlockStatement, Identifier} from "@babel/types";
import {NodePath} from "@babel/core";
import template from "@babel/template";


const createBitsetTemplate = template.statement('const %%name%% = new %%ctx%%.utils.BitSet()')
const addToBitsetTemplate = template.expression('%%bitset%%.add(%%index%%)')
const deleteSpritesTemplate = template.statement('%%geo%%.deleteIndices(%%bitset%%)')

export function transformDeleteSprite(path: NodePath<BlockStatement>, ctxIdentifier: Identifier, geoIdentifier: Identifier) {

    const bitsetIdentifier = path.scope.generateUidIdentifier('deleted')

    let hasDelete = false

    path.traverse({
        CallExpression: path => {
            if (path.node.callee.type === 'Identifier') {
                const node = path.node.callee as Identifier
                if (node.name === 'deleteSprite') {
                    hasDelete = true
                    if (path.node.arguments.length !== 1) {
                        throw new Error("Invalid arguments")
                    }

                    path.replaceWith(addToBitsetTemplate({
                        bitset: bitsetIdentifier,
                        index: path.node.arguments[0]
                    }))
                }
            }
        }
    })

    if (hasDelete) {
        path.unshiftContainer('body', [
            createBitsetTemplate({
                name: bitsetIdentifier,
                ctx: ctxIdentifier
            })
        ])
        path.pushContainer('body', [
            deleteSpritesTemplate({
                geo: geoIdentifier,
                bitset: bitsetIdentifier,
            })
        ])
    }

}
