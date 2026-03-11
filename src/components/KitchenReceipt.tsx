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
        className="bg-white text-black p-4 md:p-5 font-mono text-base max-w-[320px] mx-auto border border-gray-200 shadow-sm print:shadow-none print:border-none"
      >
        {/* Header - Order Identity */}
        <div className="text-center mb-4 border-b-2 border-black pb-2">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Order Number</div>
          <h1 className="text-2xl font-black mb-1">
            {order.order_number || (order.id ? `#${order.id.slice(-6).toUpperCase()}` : 'NEW ORDER')}
          </h1>
          
          {(order.delivery_info?.name || order.customer) && (
            <div className="mt-1 bg-black text-white px-2 py-0.5">
              <span className="text-[10px] uppercase block">Customer</span>
              <span className="text-lg font-bold uppercase">
                {order.delivery_info?.name || customers[order.customer || ''] || order.customer}
              </span>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="border-b-2 border-black pb-2 mb-4 text-base space-y-2 font-bold">
          <div className="flex justify-between items-center bg-gray-100 p-1.5">
            <span className="text-[10px] uppercase">Type</span>
            <span className="text-lg uppercase">{order.order_type.replace('_', ' ')}</span>
          </div>

          {order.order_type === 'dine_in' && (order.table_no || order.table) && (
            <div className="flex justify-between items-center bg-black text-white p-1.5">
              <span className="text-[10px] uppercase">Table</span>
              <span className="text-2xl">{order.table_no || tables[order.table || ''] || order.table}</span>
            </div>
          )}

          <div className="flex justify-between text-xs px-1 italic text-gray-700">
            <span>Time</span>
            <span>{formatDate(order.created_at)}</span>
          </div>

          {order.branch_name && (
            <div className="flex justify-between text-[10px] px-1 font-normal opacity-80 border-t border-gray-100 pt-1">
              <span>Branch</span>
              <span>{order.branch_name}</span>
            </div>
          )}

          {order.created_by && (
            <div className="flex justify-between text-[10px] px-1 font-normal opacity-80 text-black">
              <span>Staff</span>
              <span className="truncate max-w-[150px] text-right">
                {users[order.created_by] || order.created_by}
              </span>
            </div>
          )}

          {order.delivery_info && (order.delivery_info.phone || order.delivery_info.address) && (
            <div className="mt-1 pt-1 border-t border-dashed border-gray-400 text-sm font-normal text-black">
              {order.delivery_info.phone && <p>Phone: {order.delivery_info.phone}</p>}
              {order.delivery_info.address && <p className="leading-tight mt-0.5">Add: {order.delivery_info.address}</p>}
            </div>
          )}

          {order.notes && (
             <div className="mt-2 p-1.5 border border-black bg-yellow-50">
               <p className="uppercase text-[8px] font-black mb-0.5">*** SPECIAL NOTES ***</p>
               <p className="text-base font-black italic uppercase leading-tight">{order.notes}</p>
             </div>
          )}
        </div>

        {/* Items */}
        <div className="mb-4">
          <div className="flex justify-between font-black text-base border-b-2 border-black pb-1 mb-2 uppercase">
            <span>Qty</span>
            <span>Item</span>
          </div>
          <div className="space-y-2">
            {order.items.map((item, idx) => {
              // ULTIMATE PRODUCT NAME RESOLUTION
              const productId = String(item.product || '').trim();
              const mapName = products?.[productId];
              
              const cleanSnapshot = (item.product_name && item.product_name.toLowerCase().trim() !== 'string') ? item.product_name : null;
              
              const objectInfo = typeof item.product === 'object' ? (item.product as any) : null;
              const objectName = objectInfo?.name || objectInfo?.product_name || objectInfo?.title;

              const productName = mapName || cleanSnapshot || objectName || productId || 'Item';
              
              return (
                <div key={idx} className="border-b border-gray-100 pb-2 last:border-0 pt-1">
                  <div className="flex gap-3 items-start mb-1">
                    <div className="min-w-[40px] bg-black text-white text-lg font-black rounded-lg flex items-center justify-center py-1 px-1.5 shadow-sm">
                      {Number(item.quantity).toFixed(0)}x
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-black uppercase leading-tight text-black break-words">
                        {productName}
                      </p>
                    </div>
                  </div>
                  {item.notes && (
                    <div className="ml-[40px] mt-0.5 text-sm bg-yellow-100 p-1 border-l-2 border-black font-black italic uppercase">
                      * {item.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-[10px] font-bold uppercase tracking-widest border-t border-black pt-2">
          <p>*** END OF TICKET ***</p>
        </div>
      </div>
    );
  }
);

KitchenReceipt.displayName = 'KitchenReceipt';
