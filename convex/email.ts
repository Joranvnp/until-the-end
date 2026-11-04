import { Lumail } from "@lumail/convex";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { SiteConfig } from "./siteConfig";

const buildFromAddress = (emailFrom: string) => {
  const trimmed = emailFrom.trim();
  if (trimmed.includes("<") && trimmed.includes(">")) return trimmed;
  return `${SiteConfig.team.name} from ${SiteConfig.title} <${trimmed}>`;
};

const emailFrom = buildFromAddress(
  process.env.EMAIL_FROM ?? SiteConfig.company.contactEmail,
);

export const lumail = new Lumail(components.lumail, {
  testMode: false,
});

export const sendEmail = internalMutation({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    from: v.optional(v.string()),
    replyTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await lumail.sendEmail(ctx, {
      from: args.from ?? emailFrom,
      to: args.to,
      subject: args.subject,
      html: args.html,
      transactional: true,
      ...(args.replyTo ? { replyTo: args.replyTo } : {}),
    });
  },
});

export const upsertSubscriber = internalMutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    removeTags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim();
    if (!email) return;

    await lumail.upsertSubscriber(ctx, {
      email,
      name: args.name,
      tags: args.tags,
      removeTags: args.removeTags,
      triggerWorkflows: true,
    });
  },
});
