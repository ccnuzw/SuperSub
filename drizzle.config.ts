import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "sqlite",
    schema: "./functions/api/drizzle/schema.ts",
    out: "./drizzle",
});
