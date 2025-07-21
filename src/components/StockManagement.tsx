import React, { useState } from 'react';
import { Plus, Minus, Package, Clock, TrendingUp, TrendingDown, Edit2, Save, X, Trash2 } from 'lucide-react';
import { InventoryItem } from '../types';
import { useStockTransactions } from '../hooks/useStockTransactions';

interface StockManagementProps {
  items: InventoryItem[];
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  userId: string;
}

export const StockManagement: React.FC<StockManagementProps> = ({ 
  items, 
  onUpdateItem, 
  userId 
}) => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useStockTransactions(userId);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'add' | 'take'>('add');
  const [loading, setLoading] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [validationError, setValidationError] = useState<string>('');

  const handleStockTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || quantity <= 0) return;

    const item = items.find(i => i.id === selectedItem);
    if (!item) return;

    // Validate that we don't take more stock than available
    if (transactionType === 'take' && quantity > item.quantity) {
      setValidationError(`Cannot take ${quantity} items. Only ${item.quantity} available in stock.`);
      return;
    }

    setValidationError('');
    setLoading(true);
    try {
      // Calculate new quantity
      const newQuantity = transactionType === 'add' 
        ? item.quantity + quantity 
        : Math.max(0, item.quantity - quantity);

      // Update inventory item
      await onUpdateItem(selectedItem, { quantity: newQuantity });

      // Add transaction record
      await addTransaction({
        itemId: selectedItem,
        itemName: item.name,
        itemSku: item.sku,
        itemCategory: item.category,
        itemPrice: item.price,
        type: transactionType,
        quantity,
        reason,
        userId,
      });

      // Reset form
      setQuantity(1);
      setReason('');
      setSelectedItem('');
    } catch (error) {
      console.error('Error processing stock transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get selected item for validation display
  const selectedItemData = items.find(i => i.id === selectedItem);
  const maxQuantity = selectedItemData?.quantity || 0;

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction.id);
    setEditForm({
      itemName: transaction.itemName,
      itemSku: transaction.itemSku,
      itemCategory: transaction.itemCategory,
      itemPrice: transaction.itemPrice,
      type: transaction.type,
      quantity: transaction.quantity,
      reason: transaction.reason,
    });
  };

  const handleSaveTransaction = async () => {
    if (!editingTransaction) return;
    
    try {
      await updateTransaction(editingTransaction, editForm);
      setEditingTransaction(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setEditForm({});
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const recentTransactions = transactions.slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Stock Management</h2>
        
        <form onSubmit={handleStockTransaction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Item *
              </label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose an item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Current: {item.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type *
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setTransactionType('add')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    transactionType === 'add'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-700 hover:border-green-300'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType('take')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    transactionType === 'take'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 text-gray-700 hover:border-red-300'
                  }`}
                >
                  <Minus className="w-5 h-5" />
                  Take Stock
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                max={transactionType === 'take' ? maxQuantity : undefined}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {transactionType === 'take' && selectedItemData && (
                <p className="text-sm text-gray-600 mt-1">
                  Available in stock: {maxQuantity}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Restock, Sale, Damaged"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {validationError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedItem}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Package className="w-5 h-5" />
            {loading ? 'Processing...' : `${transactionType === 'add' ? 'Add' : 'Take'} Stock`}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Transactions</h3>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'add' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'add' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      {editingTransaction === transaction.id ? (
                        <div className="space-y-2">
                          <select
                            value={editForm.itemId || ''}
                            onChange={(e) => {
                              const selectedItem = items.find(item => item.id === e.target.value);
                              if (selectedItem) {
                                setEditForm({
                                  ...editForm,
                                  itemId: selectedItem.id,
                                  itemName: selectedItem.name,
                                  itemSku: selectedItem.sku,
                                  itemCategory: selectedItem.category,
                                  itemPrice: selectedItem.price
                                });
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select Item</option>
                            {items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} - {item.sku}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editForm.reason || ''}
                            onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Reason"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-gray-900">{transaction.itemName}</p>
                          <p className="text-sm text-gray-600">
                            {transaction.reason || 'No reason provided'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {editingTransaction === transaction.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editForm.type || 'add'}
                            onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="add">Add</option>
                            <option value="take">Take</option>
                          </select>
                          <input
                            type="number"
                            min="1"
                            value={editForm.quantity || 1}
                            onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 1})}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      ) : (
                        <>
                          <p className={`font-medium ${
                            transaction.type === 'add' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'add' ? '+' : '-'}{transaction.quantity}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.date?.toLocaleDateString()}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingTransaction === transaction.id ? (
                        <>
                          <button
                            onClick={handleSaveTransaction}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Save changes"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit transaction"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};