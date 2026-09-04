import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { r2Client } from '../lib/r2Client.js';
import { env } from '../config/env.js';

export async function uploadIssuePhoto(file) {
  const extension = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
  const key = `civic-issues/${randomUUID()}.${extension}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.r2BucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return `${env.r2PublicUrlBase}/${key}`;
}
