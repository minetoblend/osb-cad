import {NodePath, types} from "@babel/core";
import {BlockStatement, Identifier, Statement} from "@babel/types";
import template from "@babel/template";


const loopTemplate = template.statements(`
        %%setup%%
        const %%length%% = %%geo%%.length;
        for (var %%idx%% = 0; %%idx%% < %%length%%; %%idx%%++) { 
            const %%curEl%% = %%geo%%.getSprite(%%idx%%);
             %%body%%
        }
    `)

const fetchInputTemplate = template.statement('const %%geo%% = %%prefetched%%[%%index%%]')


export function transformLoop(path: NodePath<BlockStatement>,
                              idxIdentifier: Identifier,
                              prefetchedIdentifier: Identifier,
) {
    const {body} = path.node
    const currentElementIdentifier = path.scope.generateUidIdentifier('el')
    const defaultGeoIdentifier = path.scope.generateUidIdentifier('geo')

    const setup: Statement[] = []

    setup.push(fetchInputTemplate({
        prefetched: prefetchedIdentifier,
        index: types.numericLiteral(0),
        geo: defaultGeoIdentifier,
    }))


    path.replaceWith(types.blockStatement([
        ...loopTemplate({
            setup,
            length: path.scope.generateUidIdentifier('length'),
            idx: idxIdentifier,
            geo: defaultGeoIdentifier,
            body,
            curEl: currentElementIdentifier
        }),
    ]))

    const geoPath = path.get('body.0') as NodePath
    geoPath.setData('isGeo', true)

    path.traverse({
        Identifier: path => {
            if (path.node.name === 'idx') {
                path.replaceWith(idxIdentifier)
            }
        }
    })

    return {currentElementIdentifier, defaultGeoIdentifier}
}

