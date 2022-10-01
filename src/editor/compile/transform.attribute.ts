import {NodePath, types} from "@babel/core";
import {AttributeMetadata} from "@/editor/compile/analyze";
import {AssignmentExpression, BlockStatement, Identifier} from "@babel/types";
import template from "@babel/template";


const getAttributeContainerTemplate = template.expression('%%geo%%.getOrCreateAttributeContainer(%%attributeName%%, %%attributeType%%)')

export function transformAttributes(path: NodePath<BlockStatement>, attributes: Map<string, AttributeMetadata>, geoIdentifier: Identifier, idxIdentifier: Identifier, currentElementIdentifier: Identifier) {
    const attributeList = [...attributes.values()].filter(it => !it.builtin)

    const attributeIdentifiers = new Map<string, Identifier>()

    const children = path.get('body')
    console.log(children)

    const geo = children.find(it => it.getData('isGeo'))

    if (geo && attributeList.length > 0) {
        geo.insertAfter([
            types.variableDeclaration('const',
                attributeList.map(attribute => buildAttributeDeclarator(path, attribute, geoIdentifier, attributeIdentifiers))
            )
        ])
    }

    path.traverse({
        Identifier: path => {
            const type = path.getData('type')
            if (type === 'attribute') {
                const attribute = path.getData('attribute') as AttributeMetadata
                const operation = path.getData('operation') as 'read' | 'write'

                if (attribute.builtin) {
                    buildBuiltinAttributeAccess(path, attribute, currentElementIdentifier)
                } else if (operation === "write") {
                    buildAttributeWrite(path, attribute, attributeIdentifiers, idxIdentifier)
                } else {
                    buildAttributeRead(path, attribute, attributeIdentifiers, idxIdentifier)
                }
            }
        }
    })
}

function buildAttributeDeclarator(path: NodePath, attribute: AttributeMetadata, geoIdentifier: Identifier, attributeIdentifiers: Map<string, Identifier>) {
    const identifier = path.scope.generateUidIdentifier(attribute.name)

    attributeIdentifiers.set(attribute.name, identifier)

    return types.variableDeclarator(identifier, getAttributeContainerTemplate({
        geo: geoIdentifier,
        attributeName: types.stringLiteral(attribute.name),
        attributeType: attribute.type ? types.stringLiteral(attribute.type) : undefined
    }))
}


function buildBuiltinAttributeAccess(path: NodePath<Identifier>, metadata: AttributeMetadata, currentElementIdentifier: Identifier) {
    path.replaceWith(types.memberExpression(currentElementIdentifier, types.identifier('_' + metadata.name)))
}

function buildAttributeWrite(path: NodePath<Identifier>, metadata: AttributeMetadata, attributeIdentifiers: Map<string, Identifier>, idxIdentifier: Identifier) {
    path.parentPath.assertAssignmentExpression()

    path.parentPath.replaceWith(types.callExpression(
        types.memberExpression(
            attributeIdentifiers.get(metadata.name)!,
            types.identifier('setValue')
        ),
        [
            idxIdentifier,
            (path.parent as AssignmentExpression).right,
        ]
    ))
}

function buildAttributeRead(path: NodePath<Identifier>, metadata: AttributeMetadata, attributeIdentifiers: Map<string, Identifier>, idxIdentifier: Identifier) {
    path.replaceWith(types.callExpression(
        types.memberExpression(
            attributeIdentifiers.get(metadata.name)!,
            types.identifier('getValue')
        ),
        [idxIdentifier]
    ))
}
