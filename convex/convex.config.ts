import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";
import lumail from "@lumail/convex/convex.config.js";

const app = defineApp();
app.use(betterAuth);
app.use(lumail);

export default app;
