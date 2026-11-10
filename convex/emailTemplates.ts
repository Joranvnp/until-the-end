import { SiteConfig } from "./siteConfig";

export type MarkdownEmailContent = {
  preview: string;
  markdown: string;
  badgeLabel: string;
  badgeImageUrl?: string | null;
  badgeVariant?: "brand" | "dark";
};

export const buildSignInOtpEmail = (params: {
  otp: string;
}): MarkdownEmailContent => {
  return {
    preview: `Your ${SiteConfig.title} sign-in code is ${params.otp}`,
    badgeLabel: SiteConfig.title,
    markdown: `
      # Your sign-in code for ${SiteConfig.title}

      Enter this code in the app to securely continue.

      \`\`\`
      ${params.otp}
      \`\`\`

      If you did not request this code, you can safely ignore this email.
    `,
  };
};

export const buildPasswordResetOtpEmail = (params: {
  otp: string;
}): MarkdownEmailContent => {
  return {
    preview: `Your ${SiteConfig.title} password reset code is ${params.otp}`,
    badgeLabel: SiteConfig.title,
    markdown: `
      # Reset your ${SiteConfig.title} password

      Enter this code on the password reset page to continue.

      \`\`\`
      ${params.otp}
      \`\`\`

      If you did not request a password reset, you can safely ignore this email.
    `,
  };
};

export const buildEmailVerificationEmail = (params: {
  url: string;
}): MarkdownEmailContent => {
  return {
    preview: `Verify your ${SiteConfig.title} email address`,
    badgeLabel: SiteConfig.title,
    markdown: `
      # Verify your email for ${SiteConfig.title}

      Confirm this email address to keep your account secure.

      [Verify email](${params.url})

      If you did not request this, you can safely ignore this email.
    `,
  };
};

export const buildEmailVerificationOtpEmail = (params: {
  otp: string;
}): MarkdownEmailContent => {
  return {
    preview: `Your ${SiteConfig.title} verification code is ${params.otp}`,
    badgeLabel: SiteConfig.title,
    markdown: `
      # Verify your email for ${SiteConfig.title}

      Enter this code to confirm your email address.

      \`\`\`
      ${params.otp}
      \`\`\`

      If you did not request this code, you can safely ignore this email.
    `,
  };
};

export const buildChangeEmailConfirmationEmail = (params: {
  newEmail: string;
  url: string;
}): MarkdownEmailContent => {
  return {
    preview: `Confirm your ${SiteConfig.title} email change`,
    badgeLabel: SiteConfig.title,
    markdown: `
      # Confirm your email change

      You asked to change your ${SiteConfig.title} login email to ${params.newEmail}.

      [Confirm email change](${params.url})

      If you did not request this change, keep your current email secure and ignore this email.
    `,
  };
};

export const buildChangeEmailOtpEmail = (params: {
  otp: string;
}): MarkdownEmailContent => {
  return {
    preview: `Your ${SiteConfig.title} email change code is ${params.otp}`,
    badgeLabel: SiteConfig.title,
    markdown: `
      # Confirm your new email

      Enter this code to complete your email change.

      \`\`\`
      ${params.otp}
      \`\`\`

      If you did not request this change, you can safely ignore this email.
    `,
  };
};
