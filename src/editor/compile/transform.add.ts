import {BlockStatement, Identifier} from "@babel/types";
import {NodePath} from "@babel/core";
import template from "@babel/template";


const addSpriteTemplate = template.expression('%%geo%%.addSprite(%%arguments%%)')

export function transformAddSprite(path: NodePath<BlockStatement>, geoIdentifier: Identifier) {

    path.traverse({
        CallExpression: path => {
            if (path.node.callee.type === 'Identifier') {
                const node = path.node.callee as Identifier
                if (node.name === 'addSprite') {

                    path.replaceWith(addSpriteTemplate({
                        geo: geoIdentifier,
                        arguments: path.node.arguments
                    }))
                }
            }
        }
    })

}
