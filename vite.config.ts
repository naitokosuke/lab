import { defineConfig } from "@vizejs/vite-plugin/vite-plus";
import vueRouter from "vue-router/vite";

export default defineConfig({
  plugins: [
    vueRouter({
      routesFolder: "lab/pages",
      dts: "lab/route-map.d.ts",
      filePatterns: ["**/index"],
    }),
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
      build: { command: "vp build", dependsOn: ["typecheck"] },
    },
  },
}).withVue({});
