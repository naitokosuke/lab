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
  lint: {
    options: { typeAware: true },
    vue: {
      typeAware: true,
      rules: {
        "type/strict-boolean-expressions": "error",
        // a component's directory says what it is for (lab/components/Fieldset.vue); no prefix needed
        "vue/multi-word-component-names": "off",
      },
      ruleOptions: { "type/strict-boolean-expressions": { allowNullableObject: false } },
    },
  },
  run: {
    tasks: {
      typecheck: "tsrs --runExternalCode --noEmit -p tsconfig.json",
      // vp check misses Vize's template rules (a11y, unsafe URLs, attribute order); keep them at zero
      "lint-vue": "vize lint lab design --max-warnings 0",
    },
  },
}).withVue({});
