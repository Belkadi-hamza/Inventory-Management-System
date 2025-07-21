import React, { useMemo, useState } from 'react';
import { Calendar, Download, FileText } from 'lucide-react';
import { StockTransaction } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface WeeklyReportProps {
  transactions: StockTransaction[];
}

export const WeeklyReport: React.FC<WeeklyReportProps> = ({ transactions }) => {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return startOfWeek.toISOString().split('T')[0];
  });

  const weeklyTransactions = useMemo(() => {
    const weekStart = new Date(selectedWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= weekStart && transactionDate <= weekEnd;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedWeek]);

  const generateReport = () => {
    const weekStart = new Date(selectedWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const reportData = {
      weekStart: weekStart.toLocaleDateString(),
      weekEnd: weekEnd.toLocaleDateString(),
      transactions: weeklyTransactions.map(t => ({
        itemName: t.itemName,
        sku: t.itemSku || 'N/A',
        category: t.itemCategory || 'N/A',
        price: t.itemPrice || 0,
        operation: t.type === 'add' ? '+' : '-',
        quantity: t.quantity,
        date: new Date(t.date).toLocaleDateString(),
      })),
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-transactions-${weekStart.toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generatePDFReport = async () => {
    try {
      const weekStart = new Date(selectedWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const itemsPerPage = 15;
      const totalPages = Math.ceil(weeklyTransactions.length / itemsPerPage);

      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const startIndex = pageIndex * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, weeklyTransactions.length);
        const pageTransactions = weeklyTransactions.slice(startIndex, endIndex);

        if (pageIndex > 0) {
          pdf.addPage();
        }

      // Create a temporary div for PDF content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';

      tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin-bottom: 10px;">Inventory Transactions Report</h1>
          <h2 style="color: #6b7280; font-weight: normal;">Week of ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}</h2>
          <p style="color: #6b7280; margin-top: 10px;">Page ${pageIndex + 1} of ${totalPages} - ${pageTransactions.length} transaction${pageTransactions.length !== 1 ? 's' : ''} on this page</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-weight: 600; color: #374151;">Item Name</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-weight: 600; color: #374151;">SKU</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-weight: 600; color: #374151;">Price</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-weight: 600; color: #374151;">Quantity</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-weight: 600; color: #374151;">Operation</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-weight: 600; color: #374151;">Total Price</th>
              <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-weight: 600; color: #374151;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${pageTransactions.map(transaction => `
              <tr>
                <td style="border: 1px solid #e5e7eb; padding: 12px; color: #1f2937;">${transaction.itemName}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px; color: #6b7280;">${transaction.itemSku || 'N/A'}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px; color: #6b7280;">${(transaction.itemPrice || 0).toFixed(2)} DH</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px; color: #1f2937;">${transaction.quantity}</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px;">
                  <span style="padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; ${
                    transaction.type === 'add' 
                      ? 'color: #166534;' 
                      : 'color: #dc2626;'
                  }">
                    ${transaction.type === 'add' ? '+ Add' : '- Remove'}
                  </span>
                </td>
                <td style="border: 1px solid #e5e7eb; padding: 12px; color: #1f2937; font-weight: 600;">${((transaction.itemPrice || 0) * transaction.quantity).toFixed(2)} DH</td>
                <td style="border: 1px solid #e5e7eb; padding: 12px; color: #6b7280;">${new Date(transaction.date).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      `;

      document.body.appendChild(tempDiv);

      // Generate canvas from the temporary div
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }

      pdf.save(`inventory-transactions-${weekStart.toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Transactions Report</h2>
        <div className="flex gap-4">
          <input
            type="date"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={generateReport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <button
            onClick={generatePDFReport}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Week of {new Date(selectedWeek).toLocaleDateString()} - {new Date(new Date(selectedWeek).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {weeklyTransactions.length} transaction{weeklyTransactions.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {weeklyTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600 mb-2">No transactions found</p>
            <p className="text-gray-500">No inventory transactions recorded for this week.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {weeklyTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.itemSku || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.itemCategory || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(transaction.itemPrice || 0).toFixed(2)} DH
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'add' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'add' ? '+ Add' : '- Remove'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {((transaction.itemPrice || 0) * transaction.quantity).toFixed(2)} DH
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};