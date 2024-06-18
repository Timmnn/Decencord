import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import { createWebHistory, createRouter } from "vue-router";
import { createPinia } from "pinia";

import TextChannelView from "./views/TextChannelView.vue";
import IndexView from "./views/IndexView.vue";

import AppLayout from "./layouts/AppLayout.vue";
import EmptyLayout from "./layouts/EmptyLayout.vue";
import VoiceChannelView from "./views/VoiceChannelView.vue";

let routes = [
   {
      path: "/text-channel",
      component: TextChannelView,
      meta: {
         layout: AppLayout,
      },
   },
   {
      path: "/voice-channel",
      component: VoiceChannelView,
      meta: {
         layout: AppLayout,
      },
   },
   { path: "/", component: IndexView },
];

routes = routes.map(route => {
   if (route.meta?.layout) return route;
   return {
      ...route,
      meta: {
         layout: EmptyLayout,
      },
   };
});

const pinia = createPinia();

const router = createRouter({
   history: createWebHistory(),
   routes,
});

createApp(App).use(router).use(pinia).mount("#app");
