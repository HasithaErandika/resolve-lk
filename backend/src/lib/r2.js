import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL_BASE,
} = process.env;

let client = null;

function getClient() {
  if (client) return client;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('Missing R2 credentials in the environment.');
  }
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

/**
 * Uploads a photo buffer to the R2 bucket and returns its public URL.
 * The bucket must have public read access enabled (see docs/srs/05-data-model.md).
 */
export async function uploadIssuePhoto(file) {
  if (!R2_BUCKET_NAME || !R2_PUBLIC_URL_BASE) {
    throw new Error('Missing R2_BUCKET_NAME or R2_PUBLIC_URL_BASE in the environment.');
  }

  const extension = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
  const key = `civic-issues/${randomUUID()}.${extension}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return `${R2_PUBLIC_URL_BASE.replace(/\/$/, '')}/${key}`;
}
