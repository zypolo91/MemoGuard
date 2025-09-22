import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";

import App from "./App.vue";
import router from "./router";
import zhCN from "./locales/zh-CN.json";

import "./assets/styles/tailwind.css";

const pinia = createPinia();

const i18n = createI18n({
  legacy: false,
  locale: "zh-CN",
  fallbackLocale: "zh-CN",
  messages: {
    "zh-CN": zhCN
  }
});

createApp(App).use(pinia).use(router).use(i18n).mount("#app");
