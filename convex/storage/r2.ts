"use node";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { authAction } from "../functions";

export function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export function getPublicUrl(key: string): string {
  if (key.startsWith("http")) return key;
  const base = process.env.R2_PUBLIC_URL!;
  return `${base}/${key}`;
}

export const getUploadUrl = authAction({
  args: { key: v.string(), contentType: v.string() },
  handler: async (_ctx, { key, contentType }) => {
    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });
    return await getSignedUrl(client, command, { expiresIn: 3600 });
  },
});

export const internalGetUploadUrl = internalAction({
  args: { key: v.string(), contentType: v.string() },
  handler: async (_, { key, contentType }) => {
    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });
    return await getSignedUrl(client, command, { expiresIn: 3600 });
  },
});

export const internalGetDownloadUrl = internalAction({
  args: { key: v.string() },
  handler: async (_, { key }) => {
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (key.startsWith("http")) return key;
    if (publicUrl) {
      return `${publicUrl}/${key}`;
    }
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });
    return await getSignedUrl(client, command, { expiresIn: 3600 });
  },
});

export const internalUploadBuffer = internalAction({
  args: { key: v.string(), base64: v.string(), contentType: v.string() },
  handler: async (_, { key, base64, contentType }) => {
    const client = getR2Client();
    const buffer = Buffer.from(base64, "base64");
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return getPublicUrl(key);
  },
});

export const internalDeleteObject = internalAction({
  args: { key: v.string() },
  handler: async (_, { key }) => {
    const client = getR2Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    );
  },
});
