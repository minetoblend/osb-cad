import {dorchadas} from "@/icon";

import {createApp} from 'vue'
import App from './App.vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
import {library} from "@fortawesome/fontawesome-svg-core";
import {fas} from "@fortawesome/free-solid-svg-icons";
import {far} from "@fortawesome/free-regular-svg-icons";

import 'splitpanes/dist/splitpanes.css'
import "vue-dock-menu/dist/vue-dock-menu.css";
import 'vfonts/OpenSans.css'

import './style.scss'

library.add(fas, far, dorchadas)

const app = createApp(App)
    .use(ElementPlus)
    .component('icon', FontAwesomeIcon)


app.mount('#app');


