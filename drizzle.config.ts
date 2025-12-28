import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "sqlite",
    schema: "./functions/api/drizzle/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ce2958c72097c2ac98fc7f0be8805e881569237f6d51821121a68c1c4a150f41.sqlite"
    }
});
