import { defineConfig } from "cf/config";

export default defineConfig({
  accountId: "2490abe091582fd4dba33db2524550dd",
  worker: {
    name: "lab",
    compatibilityDate: "2026-03-31",
    assets: {
      notFoundHandling: "single-page-application",
    },
    domains: ["lab.naito.dev"],
  },
});
