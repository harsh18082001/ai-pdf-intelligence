import { Pinecone } from '@pinecone-database/pinecone';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { prisma } from '../src/db.js';
import { env } from '../src/config/env.js';

async function wipePostgres() {
  console.log('Wiping Postgres...');
  await prisma.aIArtifact.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chunk.deleteMany();
  await prisma.document.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  console.log('Postgres wiped.');
}

async function wipePinecone() {
  console.log('Wiping Pinecone...');
  const pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY });
  const index = pinecone.index('dociq');
  const stats = await index.describeIndexStats();
  const namespaces = Object.keys(stats.namespaces || {});

  await index.deleteAll().catch(() => {});
  for (const ns of namespaces) {
    await index.namespace(ns).deleteAll().catch(() => {});
  }
  console.log(`Pinecone wiped (default namespace + ${namespaces.length} named namespaces).`);
}

async function wipeB2() {
  if (!env.B2_KEY_ID || !env.B2_APPLICATION_KEY || !env.B2_ENDPOINT) {
    console.log('B2 not configured, skipping.');
    return;
  }
  console.log('Wiping Backblaze B2...');
  const endpointUrl = env.B2_ENDPOINT.startsWith('http') ? env.B2_ENDPOINT : `https://${env.B2_ENDPOINT}`;
  const s3 = new S3Client({
    endpoint: endpointUrl,
    region: env.B2_REGION || 'eu-central-003',
    credentials: { accessKeyId: env.B2_KEY_ID, secretAccessKey: env.B2_APPLICATION_KEY },
  });
  const bucketName = env.B2_BUCKET_NAME || 'dociq-documents';

  let continuationToken: string | undefined;
  let total = 0;
  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'documents/',
        ContinuationToken: continuationToken,
      }),
    );
    const objects = (list.Contents || []).map((o) => ({ Key: o.Key! }));
    if (objects.length > 0) {
      await s3.send(new DeleteObjectsCommand({ Bucket: bucketName, Delete: { Objects: objects } }));
      total += objects.length;
    }
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`B2 wiped (${total} objects deleted).`);
}

async function main() {
  await wipePostgres();
  await wipePinecone();
  await wipeB2();
  await prisma.$disconnect();
  console.log('All persistence layers emptied.');
}

main().catch((err) => {
  console.error('Wipe failed:', err);
  process.exit(1);
});
