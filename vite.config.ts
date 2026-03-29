import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import vueRouter from "vue-router/vite";

export default defineConfig({
  plugins: [
    vueRouter({
      dts: "src/route-map.d.ts",
    }),
    vue(),
  ],
  css: {
    transformer: "lightningcss",
  },
  build: {
    cssMinify: "lightningcss",
  },
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
});
