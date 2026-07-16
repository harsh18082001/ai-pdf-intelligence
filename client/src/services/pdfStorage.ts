import { openDB } from 'idb';

const DB_NAME = 'dociq_pdfs';
const STORE_NAME = 'pdfs';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export const savePDF = async (documentId: number, file: File): Promise<void> => {
  const db = await initDB();
  await db.put(STORE_NAME, file, documentId);
};

export const loadPDF = async (documentId: number): Promise<Blob | null> => {
  const db = await initDB();
  const file = await db.get(STORE_NAME, documentId);
  return file || null;
};

export const deletePDF = async (documentId: number): Promise<void> => {
  const db = await initDB();
  await db.delete(STORE_NAME, documentId);
};
