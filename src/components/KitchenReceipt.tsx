"use client";
import React, { forwardRef } from 'react';
import { Order } from '@/src/types';

interface KitchenReceiptProps {
  order: Order;
  businessName?: string;
  products?: Record<string, string>;
  tables?: Record<string, string>;
  customers?: Record<string, string>;
  users?: Record<string, string>;
}

export const KitchenReceipt = forwardRef<HTMLDivElement, KitchenReceiptProps>(
  ({ order, businessName, products = {}, tables = {}, customers = {}, users = {} }, ref) => {
    
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
        <div className="text-center mb-4 border-b border-black pb-3">
          <h1 className="text-lg font-black uppercase tracking-widest mb-1 text-black">
            KITCHEN DOCKET
          </h1>
          <div className="text-[11px] font-bold uppercase text-black">{businessName || "Duke's POS"}</div>
        </div>

        {/* Order Details */}
        <div className="border-b border-black pb-3 mb-4 space-y-3">
          <div className="flex justify-between items-baseline text-black">
            <span className="uppercase text-[11px] font-black">Order No:</span>
            <span className="font-black text-xs">{order.order_number || order.id.slice(-6).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-baseline text-black text-[11px]">
            <span className="font-bold">Date:</span>
            <span className="font-bold">{formatDate(order.created_at)}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <div className="bg-black text-white px-4 py-1.5 text-[12px] font-black rounded-full uppercase">
              {order.order_type.replace('_', ' ')}
            </div>
            {(order.table_no || order.table) && (
              <div className="border border-black px-4 py-1.5 text-[12px] font-black rounded-full">
                Table {order.table_no || tables[order.table || ''] || order.table}
              </div>
            )}
          </div>

          {order.branch_name && (
            <div className="flex justify-between text-[11px] px-1 font-black text-black border-t-2 border-black pt-1">
              <span>Branch</span>
              <span>{order.branch_name}</span>
            </div>
          )}

          {order.created_by && (
            <div className="flex justify-between text-[11px] px-1 font-black text-black">
              <span>Staff</span>
              <span className="truncate max-w-[150px] text-right">
                {users[order.created_by] || order.created_by}
              </span>
            </div>
          )}

          {order.delivery_info && (order.delivery_info.phone || order.delivery_info.address) && (
            <div className="mt-1 pt-1 border-t-2 border-black text-sm font-black text-black">
              {order.delivery_info.phone && <p>Phone: {order.delivery_info.phone}</p>}
              {order.delivery_info.address && <p className="leading-tight mt-0.5">Add: {order.delivery_info.address}</p>}
            </div>
          )}

          {order.notes && (
             <div className="mt-2 p-2 border-2 border-black bg-white">
               <p className="uppercase text-[10px] font-black mb-1 text-black">*** SPECIAL NOTES ***</p>
               <p className="text-base font-black uppercase leading-tight text-black">{order.notes}</p>
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
                    <div className="min-w-[40px] bg-black text-white text-base font-black rounded-lg flex items-center justify-center py-1 px-1.5 shadow-sm">
                      {Number(item.quantity).toFixed(0)}x
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-black uppercase leading-tight text-black break-words">
                        {productName}
                      </p>
                    </div>
                  </div>
                  {item.notes && (
                    <div className="ml-[40px] mt-1 text-sm bg-white p-1.5 border-2 border-black font-black uppercase">
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
