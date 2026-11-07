import { defineConfig } from "@vizejs/vite-plugin/vite-plus";
import { lazyPlugins } from "vite-plus";
import vueRouter from "vue-router/vite";

export default defineConfig({
  plugins: [
    vueRouter({
      routesFolder: "lab/pages",
      dts: "lab/route-map.d.ts",
      filePatterns: ["**/index"],
    }),
    // The Cloudflare plugin wipes .cloudflare/output whenever the config resolves
    // as a build, which vp lint / fmt / run do just to read their config blocks.
    lazyPlugins(async () => {
      const { cloudflare } = await import("@cloudflare/vite-plugin");
      return [cloudflare()];
    }),
  ],
  css: {
    transformer: "lightningcss",
  },
  build: {
    cssMinify: "lightningcss",
  },
  // in-source tests: `if (import.meta.vitest)` blocks run under vp test, drop out of builds
  define: {
    "import.meta.vitest": "undefined",
  },
  test: {
    includeSource: ["lab/**/*.ts"],
  },
  fmt: { ignorePatterns: ["lab/route-map.d.ts"] },
  lint: { options: { typeAware: true } },
  run: {
    tasks: {
      typecheck: "tsrs --runExternalCode --noEmit -p tsconfig.json",
    },
  },
}).withVue({});
