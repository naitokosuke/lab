import { defineConfig } from "@vizejs/vite-plugin/vite-plus";
import vueRouter from "vue-router/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    vueRouter({
      routesFolder: "lab/pages",
      dts: "lab/route-map.d.ts",
      filePatterns: ["**/index"],
    }),
    cloudflare(),
  ],
  css: {
    transformer: "lightningcss",
  },
  build: {
    cssMinify: "lightningcss",
  },
  fmt: { ignorePatterns: ["lab/route-map.d.ts"] },
  lint: { options: { typeAware: true } },
  run: {
    tasks: {
      typecheck: "tsrs --runExternalCode --noEmit -p tsconfig.json",
    },
  },
}).withVue({});
