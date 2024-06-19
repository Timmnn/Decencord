import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import { createWebHistory, createRouter } from "vue-router";
import { createPinia } from "pinia";

import TextChannelView from "./views/TextChannelView.vue";
import IndexView from "./views/IndexView.vue";
import VoiceChannelView from "./views/VoiceChannelView.vue";
import LoginView from "./views/LoginView.vue";

import AppLayout from "./layouts/AppLayout.vue";
import EmptyLayout from "./layouts/EmptyLayout.vue";

let routes = [
   {
      path: "/channels/v/:channel_id",
      component: VoiceChannelView,
      meta: {
         layout: AppLayout,
      },
   },
   {
      path: "/channels/t/:channel_id",
      component: TextChannelView,
      meta: {
         layout: AppLayout,
      },
   },
   {
      path: "/login",
      component: LoginView,
   },
   {
      path: "/",
      component: IndexView,
      meta: {
         layout: AppLayout,
      },
   },
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

pinia.use(ctx => {
   ctx.store.$router = router;
});

const router = createRouter({
   history: createWebHistory(),
   routes,
});

createApp(App).use(router).use(pinia).mount("#app");
