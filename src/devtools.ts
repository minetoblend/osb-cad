import {DevtoolsPluginApi, setupDevtoolsPlugin} from '@vue/devtools-api'
import {App} from "vue";

let devtools: DevtoolsPluginApi<any> | undefined = undefined;

export function createOsbCadDevtools(app: App) {
    //@ts-ignore
    setupDevtoolsPlugin({
        id: 'osb-cad-devtools-plugin',
        label: 'Osb!Cad',
        packageName: 'my-awesome-plugin',
        homepage: 'https://vuejs.org',
        //@ts-ignore
        app
    }, api => {
        devtools = api

        api.addInspector({
            id: 'nodes',
            label: 'Nodes',
            icon: 'pets'
        })


    })
}


export function useDevtools() {
    return devtools
}