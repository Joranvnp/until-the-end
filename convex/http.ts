import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { EMAIL_LOGO_PNG_BASE64 } from "./emails/logoAsset";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

http.route({
  path: "/brand/logo.png",
  method: "GET",
  handler: httpAction(async () => {
    const bytes = Uint8Array.from(atob(EMAIL_LOGO_PNG_BASE64), (char) =>
      char.charCodeAt(0),
    );
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }),
});

export default http;
