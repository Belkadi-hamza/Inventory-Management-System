import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useInventory } from './hooks/useInventory';
import { useStockTransactions } from './hooks/useStockTransactions';
import { AuthForm } from './components/AuthForm';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { InventoryList } from './components/InventoryList';
import { StockManagement } from './components/StockManagement';
import { WeeklyReport } from './components/WeeklyReport';
import { ItemForm } from './components/ItemForm';
import { InventoryItem } from './types';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading: inventoryLoading, addItem, updateItem, deleteItem } = useInventory(user?.uid || null);
  const { transactions, updateTransaction, deleteTransaction } = useStockTransactions(user?.uid || null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'stock' | 'reports'>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const handleAddItem = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSaveItem = async (itemData: Omit<InventoryItem, 'id' | 'dateAdded' | 'lastUpdated'>) => {
    try {
      if (editingItem) {
        await updateItem(editingItem.id, itemData);
      } else {
        await addItem(itemData);
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id);
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !user.emailVerified) {
    return <AuthForm />;
  }

  return (
    <>
      {user && !user.emailVerified && <EmailVerificationBanner />}
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {inventoryLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard items={items} />}
            {activeTab === 'inventory' && (
              <InventoryList
                items={items}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onAdd={handleAddItem}
              />
            )}
            {activeTab === 'stock' && (
              <StockManagement
                items={items}
                onUpdateItem={updateItem}
                userId={user.uid}
              />
            )}
            {activeTab === 'reports' && (
              <WeeklyReport transactions={transactions} />
            )}
          </>
        )}
      </Layout>

      {showForm && (
        <ItemForm
          item={editingItem}
          onSave={handleSaveItem}
          onCancel={handleCancelForm}
          userId={user.uid}
        />
      )}
    </>
  );
}

export default App;