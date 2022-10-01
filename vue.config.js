const AutoImport = require('unplugin-auto-import/webpack')
const Components = require('unplugin-vue-components/webpack')
const {ElementPlusResolver} = require('unplugin-vue-components/resolvers')
const webpack = require('webpack')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const {defineConfig} = require('@vue/cli-service')
module.exports = defineConfig({
    publicPath: './',
    chainWebpack: config =>
        config.module
            .rule('wasm')
            .test(/\.wasm$/)
            .use('wasm-loader')
            .loader('wasm-loader'),
    configureWebpack: {
        externals: {
            fs: '{}',
        },
        plugins: [
            AutoImport({
                resolvers: [ElementPlusResolver()],
            }),
            Components({
                resolvers: [ElementPlusResolver()],
            }),
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
            }),
            new webpack.ProvidePlugin({
                process: 'process/browser',
            }),
            new MonacoWebpackPlugin()
        ],
        output: {},
        module: {
            rules: [
                {
                    test: /\.txt$/i,
                    use: 'raw-loader',
                },
            ]
        }
    }
})
