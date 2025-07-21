import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, where, orderBy, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StockTransaction } from '../types';

export const useStockTransactions = (userId: string | null) => {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'stockTransactions'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stockTransactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
      })) as StockTransaction[];

      // Sort transactions by date in descending order
      stockTransactions.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return b.date.getTime() - a.date.getTime();
      });

      setTransactions(stockTransactions);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching stock transactions:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const addTransaction = async (transaction: Omit<StockTransaction, 'id' | 'date'>) => {
    return addDoc(collection(db, 'stockTransactions'), {
      ...transaction,
      date: new Date(),
    });
  };

  const updateTransaction = async (id: string, updates: Partial<StockTransaction>) => {
    const docRef = doc(db, 'stockTransactions', id);
    return updateDoc(docRef, updates);
  };

  const deleteTransaction = async (id: string) => {
    return deleteDoc(doc(db, 'stockTransactions', id));
  };

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction };
};