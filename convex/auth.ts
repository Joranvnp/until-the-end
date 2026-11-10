import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { requireRunMutationCtx } from "@convex-dev/better-auth/utils";
import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";
import { emailOTP } from "better-auth/plugins/email-otp";
import { expo } from "@better-auth/expo";
import { components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import {
  buildChangeEmailConfirmationEmail,
  buildChangeEmailOtpEmail,
  buildEmailVerificationEmail,
  buildEmailVerificationOtpEmail,
  buildPasswordResetOtpEmail,
  buildSignInOtpEmail,
  type MarkdownEmailContent,
} from "./emailTemplates";
import { SiteConfig } from "./siteConfig";

export const authComponent = createClient<DataModel>(components.betterAuth);

type EmailParams = {
  to: string;
  subject: string;
} & MarkdownEmailContent;

type EmailOtpKind =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

const getConfiguredAppReviewOtp = (email: string) => {
  const configuredEmail = process.env.APP_REVIEW_EMAIL?.trim().toLowerCase();
  const configuredOtp = process.env.APP_REVIEW_OTP?.trim();
  if (
    !configuredEmail ||
    !/^\d{6}$/.test(configuredOtp ?? "") ||
    email.trim().toLowerCase() !== configuredEmail
  ) {
    return null;
  }
  return configuredOtp!;
};

const isConfiguredAppReviewEmail = (email: string) =>
  getConfiguredAppReviewOtp(email) !== null;

const scheduleEmail = async (ctx: GenericCtx<DataModel>, params: EmailParams) => {
  const mutationCtx = requireRunMutationCtx(ctx);
  return mutationCtx.scheduler.runAfter(
    0,
    internal.emailActions.sendMarkdownEmail,
    params,
  );
};

const scheduleAuthEmail = async (
  ctx: GenericCtx<DataModel>,
  params: EmailParams,
) => {
  if (!process.env.LUMAIL_API_KEY) {
    throw new Error(
      "Email sending is not configured. Run: npx convex env set LUMAIL_API_KEY lum_... " +
        "(see SETUP.md > Convex Environment Variables).",
    );
  }

  await scheduleEmail(ctx, params);
};

const localDevOrigins = (ports: number[]) =>
  ports.flatMap((port) => [
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
  ]);

function buildOtpEmail(kind: EmailOtpKind, otp: string) {
  switch (kind) {
    case "forget-password":
      return {
        subject: `Reset your ${SiteConfig.title} password`,
        content: buildPasswordResetOtpEmail({ otp }),
      };
    case "email-verification":
      return {
        subject: `Verify your ${SiteConfig.title} email`,
        content: buildEmailVerificationOtpEmail({ otp }),
      };
    case "change-email":
      return {
        subject: `Confirm your ${SiteConfig.title} email change`,
        content: buildChangeEmailOtpEmail({ otp }),
      };
    case "sign-in":
      return {
        subject: `Your code to sign in to ${SiteConfig.title}`,
        content: buildSignInOtpEmail({ otp }),
      };
  }
}

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: process.env.CONVEX_SITE_URL,
    trustedOrigins: [
      ...SiteConfig.auth.trustedOrigins,
      "exp://",
      "https://appleid.apple.com",
      process.env.SITE_URL ?? "http://localhost:3999",
      // Include the repo-required web port plus legacy Vite/launcher ports.
      ...localDevOrigins([3000, 3001, 3002, 3003, 3100, 3101, 3102, 3103, 5174]),
    ],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    emailVerification: {
      async sendVerificationEmail({ user, url }) {
        if (isConfiguredAppReviewEmail(user.email)) {
          return;
        }

        await scheduleAuthEmail(ctx, {
          to: user.email,
          subject: `Verify your ${SiteConfig.title} email`,
          ...buildEmailVerificationEmail({ url }),
        });
      },
    },
    user: {
      changeEmail: {
        enabled: true,
        async sendChangeEmailConfirmation({ user, newEmail, url }) {
          if (isConfiguredAppReviewEmail(user.email)) {
            return;
          }

          await scheduleAuthEmail(ctx, {
            to: user.email,
            subject: `Confirm your ${SiteConfig.title} email change`,
            ...buildChangeEmailConfirmationEmail({ newEmail, url }),
          });
        },
      },
    },
    socialProviders: {
      apple: {
        clientId: process.env.APPLE_CLIENT_ID!,
        clientSecret: process.env.APPLE_CLIENT_SECRET!,
        appBundleIdentifier: SiteConfig.bundleId,
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    },
    plugins: [
      expo(),
      emailOTP({
        generateOTP({ email, type }) {
          const configuredOtp = getConfiguredAppReviewOtp(email);
          if (configuredOtp && type === "sign-in") {
            return configuredOtp;
          }
        },
        async sendVerificationOTP({
          email,
          otp,
          type,
        }: {
          email: string;
          otp: string;
          type: EmailOtpKind;
        }) {
          if (isConfiguredAppReviewEmail(email)) {
            return;
          }

          if (!process.env.LUMAIL_API_KEY) {
            // The email goes out through a scheduled action: without this
            // check the client sees "Code sent" while the send crashes in the
            // background and no email ever arrives.
            console.warn(
              `[AUTH] LUMAIL_API_KEY is not set on this deployment — unable to send ${type} OTP.`,
            );
            throw new Error(
              "Email sending is not configured. Run: npx convex env set LUMAIL_API_KEY lum_... " +
                "(see SETUP.md > Convex Environment Variables).",
            );
          }

          const otpEmail = buildOtpEmail(type, otp);
          await scheduleEmail(ctx, {
            to: email,
            subject: otpEmail.subject,
            ...otpEmail.content,
          });
        },
      }),
      crossDomain({ siteUrl: process.env.SITE_URL ?? "http://localhost:3999" }),
      convex({ authConfig }),
    ],
  } satisfies BetterAuthOptions);
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});

// Public: which social sign-in buttons the client should render. A provider is
// "available" only when its SiteConfig feature flag is on AND its OAuth
// credentials are set on this deployment — so we never show a button that would
// 500 with CLIENT_ID_AND_SECRET_REQUIRED. Drives both web and mobile sign-in.
export const getEnabledAuthProviders = query({
  args: {},
  handler: async () => {
    const hasGoogle = Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    );
    const hasApple = Boolean(
      process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET,
    );
    const hasGitHub = Boolean(
      process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
    );
    return {
      google: SiteConfig.features.enableGoogleSignIn && hasGoogle,
      apple: SiteConfig.features.enableAppleSignIn && hasApple,
      github: SiteConfig.features.enableGitHubSignIn && hasGitHub,
    };
  },
});
