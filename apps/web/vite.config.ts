import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { fileURLToPath, URL } from "url";
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
    server: {
        port: 3000,
        host: true,
        allowedHosts: ["host.docker.internal"],
    },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    plugins: [
        devtools(),
        cloudflare({ viteEnvironment: { name: 'ssr' } }),
        // this is the plugin that enables path aliases
        viteTsConfigPaths({
            projects: ["./tsconfig.json"],
        }),
        tailwindcss(),
        tanstackStart(),
        viteReact({
            babel: {
                plugins: ["babel-plugin-react-compiler"],
            },
        }),
    ],
});

export default config;
