import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { InventoryItem } from '../types';

export const useInventory = (userId: string | null) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'inventory'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateAdded: doc.data().dateAdded?.toDate(),
        lastUpdated: doc.data().lastUpdated?.toDate(),
      })) as InventoryItem[];

      // Sort items by lastUpdated in descending order on the client side
      inventoryItems.sort((a, b) => {
        if (!a.lastUpdated || !b.lastUpdated) return 0;
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      });

      setItems(inventoryItems);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const addItem = async (item: Omit<InventoryItem, 'id' | 'dateAdded' | 'lastUpdated'>) => {
    const now = new Date();
    return addDoc(collection(db, 'inventory'), {
      ...item,
      quantity: 0, // Initialize with 0 quantity
      dateAdded: now,
      lastUpdated: now,
    });
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    const docRef = doc(db, 'inventory', id);
    return updateDoc(docRef, {
      ...updates,
      lastUpdated: new Date(),
    });
  };

  const deleteItem = async (id: string) => {
    return deleteDoc(doc(db, 'inventory', id));
  };

  return { items, loading, addItem, updateItem, deleteItem };
};