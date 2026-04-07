import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { put } from '@vercel/blob';

const maxUploadBytes = 5 * 1024 * 1024;
const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const uploadsDir = path.resolve(currentDir, '../../uploads');

let s3Client: S3Client | null = null;

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isVercelRuntime() {
  return process.env.VERCEL === '1' || process.env.VERCEL === 'true';
}

function getS3Client() {
  if (s3Client) {
    return s3Client;
  }

  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  s3Client = new S3Client({
    region: process.env.S3_REGION ?? 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    forcePathStyle: true
  });

  return s3Client;
}

export function validateUpload(file: File) {
  if (!allowedTypes.has(file.type)) {
    throw new Error('Unsupported file type. Use PNG, JPEG, or WEBP.');
  }

  if (file.size > maxUploadBytes) {
    throw new Error('File is too large. Maximum size is 5MB.');
  }
}

export async function storeUpload(file: File, requestOrigin: string) {
  validateUpload(file);

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const objectKey = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;

  if (isBlobConfigured()) {
    const blob = await put(`bug-feedback/${objectKey}`, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type
    });

    return blob.url;
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const bucket = process.env.S3_BUCKET;
  const s3 = getS3Client();

  if (s3 && bucket) {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: file.type
      })
    );

    const publicBase = process.env.S3_PUBLIC_URL_BASE?.replace(/\/$/, '');

    return publicBase ? `${publicBase}/${objectKey}` : `${requestOrigin}/uploads/${objectKey}`;
  }

  if (isVercelRuntime()) {
    throw new Error('No upload storage is configured. Set up Vercel Blob or S3/R2 before deploying to Vercel.');
  }

  const destination = path.join(uploadsDir, objectKey);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, buffer);

  return `${requestOrigin}/uploads/${objectKey}`;
}

export function getUploadsDir() {
  return uploadsDir;
}
