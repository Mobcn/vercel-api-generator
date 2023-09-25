import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createStyleImportPlugin, VxeTableResolve } from 'vite-plugin-style-import';
import Unocss from 'unocss/vite';
import { Plugin as importToCDN } from "vite-plugin-cdn-import";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue({
            script: {
                defineModel: true
            }
        }),
        createStyleImportPlugin({
            resolves: [VxeTableResolve()]
        }),
        Unocss(),
        importToCDN({
            modules: [
                {
                    name: 'vue',
                    var: 'Vue',
                    path: `https://cdn.staticfile.org/vue/3.3.4/vue.global.prod.min.js`
                }
            ]
        })
    ],
    base: './'
});
