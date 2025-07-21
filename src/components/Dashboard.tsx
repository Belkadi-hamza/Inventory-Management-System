import React, { useMemo, useState } from 'react';
import { Package, TrendingUp, AlertTriangle, Grid3x3, Eye, Edit2, Trash2, X, Save } from 'lucide-react';
import { InventoryItem, DashboardStats } from '../types';
import { useStockTransactions } from '../hooks/useStockTransactions';
import { useAuth } from '../hooks/useAuth';
import { InventoryChart } from './InventoryChart';

interface DashboardProps {
  items: InventoryItem[];
}

export const Dashboard: React.FC<DashboardProps> = ({ items }) => {
  const { user } = useAuth();
  const { transactions, updateTransaction, deleteTransaction } = useStockTransactions(user?.uid || null);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const stats: DashboardStats = useMemo(() => {
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const lowStockItems = items.filter(item => item.quantity < 10).length;
    const categories = new Set(items.map(item => item.category)).size;

    return { totalItems, totalValue, lowStockItems, categories };
  }, [items]);

  const categoryData = useMemo(() => {
    const categories = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(categories),
      data: Object.values(categories),
    };
  }, [items]);

  const recentTransactions = transactions.slice(0, 5);

  const handleViewTransaction = (transactionId: string) => {
    setSelectedTransaction(selectedTransaction === transactionId ? null : transactionId);
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction.id);
    setEditForm({
      itemName: transaction.itemName,
      quantity: transaction.quantity,
      reason: transaction.reason,
      type: transaction.type,
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

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = 
    ({ title, value, icon, color }) => (
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4" style={{ borderLeftColor: color }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
            {React.cloneElement(icon as React.ReactElement, { 
              className: "w-8 h-8",
              style: { color } 
            })}
          </div>
        </div>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Items"
          value={stats.totalItems}
          icon={<Package />}
          color="#3B82F6"
        />
        <StatCard
          title="Total Value"
          value={`${stats.totalValue.toLocaleString()} DH`}
          icon={<TrendingUp />}
          color="#10B981"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={<AlertTriangle />}
          color="#F59E0B"
        />
        <StatCard
          title="Categories"
          value={stats.categories}
          icon={<Grid3x3 />}
          color="#8B5CF6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Inventory by Category</h3>
          <InventoryChart data={categoryData} type="doughnut" />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Items</h3>
          <div className="space-y-4">
            {items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">Qty: {item.quantity}</p>
                  <p className="text-sm text-gray-600">{item.price.toFixed(2)} DH</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Transactions</h3>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No transactions yet</p>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
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
                          <TrendingUp className="w-5 h-5 rotate-180" />
                        )}
                      </div>
                      <div>
                        {editingTransaction === transaction.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.itemName || ''}
                              onChange={(e) => setEditForm({...editForm, itemName: e.target.value})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Item name"
                            />
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
                      <button
                        onClick={() => handleViewTransaction(transaction.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {selectedTransaction === transaction.id && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">Transaction Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Item SKU:</span>
                          <p className="font-medium">{transaction.itemSku || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Category:</span>
                          <p className="font-medium">{transaction.itemCategory || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Unit Price:</span>
                          <p className="font-medium">{(transaction.itemPrice || 0).toFixed(2)} DH</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Value:</span>
                          <p className="font-medium">{((transaction.itemPrice || 0) * transaction.quantity).toFixed(2)} DH</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Transaction ID:</span>
                          <p className="font-mono text-xs">{transaction.id}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Date & Time:</span>
                          <p className="font-medium">{transaction.date?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};