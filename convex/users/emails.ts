import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { buildSignInOtpEmail } from "../emailTemplates";
import { SiteConfig } from "../siteConfig";

export const sendOtpEmail = internalAction({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, { email, code }) => {
    await ctx.runAction(internal.emailActions.sendMarkdownEmail, {
      to: email,
      subject: `Your code to sign in to ${SiteConfig.title}`,
      ...buildSignInOtpEmail({ otp: code }),
    });
  },
});
