"use client";
import React, { forwardRef } from 'react';
import { Order } from '@/src/types';

interface KitchenReceiptProps {
  order: Order;
  products?: Record<string, string>;
  tables?: Record<string, string>;
  customers?: Record<string, string>;
  users?: Record<string, string>;
}

export const KitchenReceipt = forwardRef<HTMLDivElement, KitchenReceiptProps>(
  ({ order, products = {}, tables = {}, customers = {}, users = {} }, ref) => {
    
    const formatDate = (dateString?: string) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-6 font-mono text-lg max-w-[400px] mx-auto border border-dashed border-gray-300"
      >
        {/* Header - Order Identity */}
        <div className="text-center mb-6 border-b-4 border-black pb-4">
          <div className="text-sm font-bold uppercase tracking-widest mb-1 opacity-70">Order Number</div>
          <h1 className="text-4xl font-black mb-2">
            {order.order_number || (order.id ? `#${order.id.slice(-6).toUpperCase()}` : 'NEW ORDER')}
          </h1>
          
          {(order.delivery_info?.name || order.customer) && (
            <div className="mt-2 bg-black text-white px-2 py-1">
              <span className="text-xs uppercase block">Customer</span>
              <span className="text-2xl font-bold uppercase">
                {order.delivery_info?.name || customers[order.customer || ''] || order.customer}
              </span>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="border-b-4 border-black pb-4 mb-6 text-xl space-y-3 font-bold">
          <div className="flex justify-between items-center bg-gray-100 p-2">
            <span className="text-sm uppercase">Type</span>
            <span className="text-2xl uppercase">{order.order_type.replace('_', ' ')}</span>
          </div>

          {order.order_type === 'dine_in' && (order.table_no || order.table) && (
            <div className="flex justify-between items-center bg-black text-white p-2">
              <span className="text-sm uppercase">Table</span>
              <span className="text-4xl">{order.table_no || tables[order.table || ''] || order.table}</span>
            </div>
          )}

          <div className="flex justify-between text-sm px-1 italic">
            <span>Time</span>
            <span>{formatDate(order.created_at)}</span>
          </div>

          {order.branch_name && (
            <div className="flex justify-between text-sm px-1 font-normal opacity-80 border-t border-gray-100 pt-1">
              <span>Branch</span>
              <span>{order.branch_name}</span>
            </div>
          )}

          {order.created_by && (
            <div className="flex justify-between text-sm px-1 font-normal opacity-80">
              <span>Staff</span>
              <span className="truncate max-w-[200px] text-right">
                {users[order.created_by] || order.created_by}
              </span>
            </div>
          )}

          {order.delivery_info && (order.delivery_info.phone || order.delivery_info.address) && (
            <div className="mt-2 pt-2 border-t-2 border-dashed border-gray-400 text-base font-normal">
              {order.delivery_info.phone && <p>Phone: {order.delivery_info.phone}</p>}
              {order.delivery_info.address && <p className="leading-tight mt-1">Add: {order.delivery_info.address}</p>}
            </div>
          )}

          {order.notes && (
             <div className="mt-4 p-2 border-2 border-black bg-yellow-50">
               <p className="uppercase text-xs font-black mb-1">*** SPECIAL NOTES ***</p>
               <p className="text-xl font-black italic uppercase leading-tight">{order.notes}</p>
             </div>
          )}
        </div>

        {/* Items */}
        <div className="mb-8">
          <div className="flex justify-between font-black text-xl border-b-4 border-black pb-2 mb-4 uppercase">
            <span>Qty</span>
            <span>Item</span>
          </div>
          <div className="space-y-4">
            {order.items.map((item, idx) => {
              const productName = item.product_name || 
                                 (typeof item.product === 'string' ? products[item.product] : (item.product as any)?.name) || 
                                 (typeof item.product === 'string' ? item.product : 'Unknown Item');
              
              return (
                <div key={idx} className="flex gap-4 text-2xl font-bold border-b border-gray-300 pb-2">
                  <div className="min-w-[50px] text-center border-r-2 border-black pr-2">
                    {Number(item.quantity).toFixed(0)}x
                  </div>
                  <div className="flex-1">
                    <p className="uppercase leading-tight">{productName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm font-bold uppercase tracking-widest border-t border-black pt-4">
          <p>*** END OF TICKET ***</p>
        </div>
      </div>
    );
  }
);

KitchenReceipt.displayName = 'KitchenReceipt';
