import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import { createMemoryHistory, createRouter } from "vue-router";

import IndexView from "./views/IndexView.vue";

const routes = [{ path: "/", component: IndexView }];

const router = createRouter({
   history: createMemoryHistory(),
   routes,
});

createApp(App).use(router).mount("#app");
