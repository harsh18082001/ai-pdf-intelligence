import { prisma } from './db.js';

async function main() {
  console.log('=== CHECKING ALL DOCUMENTS IN DATABASE ===');
  const docs = await prisma.document.findMany({
    orderBy: { id: 'asc' },
  });

  console.log(`Total documents found: ${docs.length}`);
  for (const doc of docs) {
    console.log(`Doc ID: ${doc.id} | Title: "${doc.title}" | clientId: "${doc.clientId}"`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
