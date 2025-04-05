import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
const domain = process.env.DOMAIN_NAME || "my.website";

// https://astro.build/config
export default defineConfig({
  i18n: {
    locales: ["en", "fr"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: true,
    },
  },
  integrations: [
    react(),
    tailwind(),
    sitemap({
      filter: (page) =>
        page !== `https://${domain}/docs/` && page !== `https://${domain}/api/`,
    }),
    (await import("@playform/compress")).default(),
  ],
  output: "server",
  site: `https://${domain}`,
  trailingSlash: "never",
  adapter: vercel({
    includeFiles: [
      "public/assets/fonts/DMSans-Bold.ttf",
      "public/assets/fonts/DMSans-Regular.ttf",
    ],
  }),
  build: {
    assets: "_assets",
  },
});
