import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    tanstackStart({
      srcDirectory: "./app",
      router: {
        routesDirectory: "routes",
        generatedRouteTree: "routeTree.gen.ts",
      },
    }),
    // Nitro turns the host-agnostic TanStack Start output into a host preset.
    // It auto-detects Vercel (via the VERCEL env) and writes `.vercel/output`,
    // so SSR routes actually serve in prod. WITHOUT this plugin Vercel sees a
    // plain Vite SPA, ships only `dist/client`, and every route 404s.
    // Must come right after tanstackStart() and before react()/tailwind().
    nitro(),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./app"),
      "@convex": path.resolve(import.meta.dirname, "../convex"),
      "@site-config": path.resolve(import.meta.dirname, "../site-config"),
    },
    dedupe: ["convex", "react", "react-dom"],
  },
});
