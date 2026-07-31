import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase.config';

import seed1 from '../../assets/seedv1.json';
import seed2 from '../../assets/seedv2.json';
import seed3 from '../../assets/seedv3.json';
import seed4 from '../../assets/seedv4.json';

export interface TransactionSeed {
  monthName: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

export async function seedAllTransactionFiles(): Promise<void> {
  const seedFiles = [
    { name: 'seedv1', data: seed1 as TransactionSeed[] },
    { name: 'seedv2', data: seed2 as TransactionSeed[] },
    { name: 'seedv3', data: seed3 as TransactionSeed[] },
    { name: 'seedv4', data: seed4 as TransactionSeed[] },
  ];

  const txRef = collection(db, 'transactions');

  for (const file of seedFiles) {
    console.log(`Uploading ${file.name} (${file.data.length} items)...`);
    const batch = writeBatch(db);

    file.data.forEach((item) => {
      const newDocRef = doc(txRef);
      batch.set(newDocRef, {
        monthName: item.monthName,
        date: item.date,
        description: item.description,
        amount: Number(item.amount),
        category: item.category,
        createdAt: new Date().toISOString(),
      });
    });

    await batch.commit();
    console.log(`Finished ${file.name}!`);
  }

  console.log('All 4 files successfully seeded to Firestore!');
}
