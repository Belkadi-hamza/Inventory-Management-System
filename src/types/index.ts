export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  price: number;
  sku: string;
  dateAdded: Date;
  lastUpdated: Date;
  userId: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export interface DashboardStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  categories: number;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  itemSku?: string;
  itemCategory?: string;
  itemPrice?: number;
  type: 'add' | 'take';
  quantity: number;
  reason: string;
  date: Date;
  userId: string;
}

export interface WeeklyReport {
  weekStart: Date;
  weekEnd: Date;
  totalTransactions: number;
  totalAdded: number;
  totalTaken: number;
  topItems: Array<{
    itemName: string;
    totalQuantity: number;
    type: 'add' | 'take';
  }>;
}