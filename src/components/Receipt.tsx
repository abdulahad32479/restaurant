import React, { forwardRef } from 'react';
import { Order } from '@/src/types';

interface ReceiptProps {
  order: Order;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  products?: Record<string, string>;
  tables?: Record<string, string>;
  customers?: Record<string, string>;
  users?: Record<string, string>;
  logoUrl?: string;
  logoUrlBottom?: string;
  paymentAccount?: string;
  deliveryPersons?: Record<string, { id: string; name: string; phone_number: string }>;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ 
    order, 
    businessName = "Duke's POS", 
    businessAddress = "123 Main St, City", 
    businessPhone = "+92 300 1234567",
    products = {},
    tables = {},
    customers = {},
    users = {},
    logoUrl,
    logoUrlBottom,
    paymentAccount,
    deliveryPersons = {}
  }, ref) => {
    
    const formatDate = (dateString?: string) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-4 md:p-6 font-mono text-[13px] leading-tight max-w-[320px] mx-auto border border-gray-200 shadow-sm print:shadow-none print:border-none"
      >
        {/* Header */}
        <div className="text-center mb-5">
          {logoUrl && (
            <div className="mb-3 flex justify-center">
              <img src={logoUrl} alt="Logo" className="max-h-16 w-auto object-contain" />
            </div>
          )}
          <h1 className="text-xl font-black uppercase tracking-widest mb-1 text-black">{businessName}</h1>
          <p className="text-xs text-black font-black">{businessAddress}</p>
          <p className="text-xs text-black font-black">{businessPhone}</p>
        </div>

        {/* Divider */}
        <div className="border-b-2 border-dashed border-black my-4" />

        {/* Order Info */}
        <div className="space-y-1.5 mb-4 font-bold">
          <div className="flex justify-between items-center text-black">
            <span className="uppercase text-xs font-bold">Order No:</span>
            <span className="font-bold text-base">{order.order_number || order.id.slice(-6).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-black text-xs">
            <span>Date:</span>
            <span>{formatDate(order.created_at)}</span>
          </div>
          <div className="flex justify-between items-center text-black text-xs mt-1">
            <span className="uppercase bg-black text-white px-2 py-0.5 font-black rounded-sm">
              {order.order_type.replace('_', ' ')}
            </span>
            {order.order_type === 'dine_in' && (order.table_no || order.table) && (
              <span className="font-black border border-black px-2 py-0.5 rounded-sm">
                Table {order.table_no || tables[order.table || ''] || order.table}
              </span>
            )}
          </div>
          
          {order.created_by && (
            <div className="flex justify-between text-black text-xs pt-1">
              <span>Cashier:</span>
              <span className="truncate max-w-[150px]">{users[order.created_by] || order.created_by}</span>
            </div>
          )}
          
          {(order.order_type === 'delivery' || order.customer) && (
            <div className="mt-2 pt-2 border-t border-black border-dotted">
              <div className="flex justify-between text-black text-xs">
                <span>Customer:</span>
                <span className="font-bold whitespace-nowrap overflow-hidden text-ellipsis pl-2">
                  {order.delivery_info?.name || customers[order.customer || ''] || order.customer}
                </span>
              </div>
              {order.delivery_info?.phone && (
                <div className="flex justify-between text-black text-xs">
                  <span>Contact:</span>
                  <span>{order.delivery_info.phone}</span>
                </div>
              )}
              {order.delivery_info?.address && (
                <div className="text-xs mt-0.5 text-black font-bold leading-snug">
                  {order.delivery_info.address}
                </div>
              )}
            </div>
          )}

          {order.order_type === 'delivery' && (order.delivery_person || order.delivery_person_name) && (
            <div className="mt-2 pt-2 border-t border-black border-dotted">
              <div className="flex justify-between text-black text-xs">
                <span>Rider:</span>
                <span className="font-bold">
                  {(() => {
                    const riderId = order.delivery_person;
                    const riderName = order.delivery_person_name;
                    // 1. Try to find by ID
                    let rider = Object.values(deliveryPersons).find(p => String(p.id).trim() === String(riderId).trim());
                    // 2. Fallback to finding by Name if ID fails
                    if (!rider && riderName) {
                      rider = Object.values(deliveryPersons).find(p => p.name === riderName);
                    }
                    return riderName || rider?.name || 'Assigned Rider';
                  })()}
                </span>
              </div>
              {/* Rider section without phone number */}
            </div>
          )}
        </div>

        <div className="border-b-2 border-black my-3" />

        {/* Items Header */}
        <div className="flex justify-between font-bold text-xs uppercase text-black mb-2 px-1">
          <span className="w-8">Qty</span>
          <span className="flex-1 text-left">Item</span>
          <span className="w-16 text-right">Total</span>
        </div>

        {/* Items List */}
        <div className="space-y-3 px-1">
          {order.items.map((item, idx) => {
            const productId = String(item.product || '').trim();
            const mapName = products?.[productId];
            const cleanSnapshot = (item.product_name && item.product_name.toLowerCase().trim() !== 'string') ? item.product_name : null;
            const objectInfo = typeof item.product === 'object' ? (item.product as any) : null;
            const objectName = objectInfo?.name || objectInfo?.product_name || objectInfo?.title;
            const productName = mapName || cleanSnapshot || objectName || productId || 'Item';
            
            const unitPrice = Number(item.unit_price || 0);
            const qty = Number(item.quantity || 0);
            const itemTotal = Number(item.total_price || (unitPrice * qty));

            return (
              <div key={idx} className="flex items-start text-black">
                <span className="w-8 font-bold">{item.quantity}</span>
                <div className="flex-1 pr-2">
                  <div className="font-bold capitalize">{productName}</div>
                  {qty > 1 && (
                    <div className="text-[10px] text-black font-black mt-0.5">
                      {item.quantity} @ Rs.{unitPrice.toFixed(2)}
                    </div>
                  )}
                </div>
                <span className="w-16 text-right font-bold mt-0.5">
                  {itemTotal.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="border-b border-black my-3" />

        {/* Totals */}
        <div className="space-y-1 text-black font-bold px-1">
          <div className="flex justify-between text-[13px]">
            <span>Subtotal</span>
            <span>Rs. {Number(order.subtotal).toFixed(2)}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-[13px]">
              <span>Discount</span>
              <span>-Rs. {Number(order.discount_amount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-[13px]">
            <span>Tax</span>
            <span>Rs. {Number(order.taxamount).toFixed(2)}</span>
          </div>
          
          <div className="border-b-2 border-dashed border-black my-2" />
          
          <div className="flex justify-between items-end mt-2 text-black">
            <span className="font-bold text-sm uppercase">Total Due</span>
            <span className="font-black text-2xl leading-none">Rs. {Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Info */}
        {order.status !== 'draft' && order.payments && order.payments.length > 0 && (
          <div className="mt-5 text-xs text-black border-2 border-black p-2 rounded-sm bg-white">
            <div className="text-center mb-1.5 font-black uppercase tracking-widest text-[10px]">Payment Summary</div>
            {order.payments.map((payment, idx) => (
              <div key={idx} className="flex justify-between items-center mb-1 last:mb-0">
                <span className="uppercase font-bold">{payment.method}</span>
                <span className="font-black">Rs. {Number(payment.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-black">
          {paymentAccount && (
            <div className="mb-5 border-t-2 border-b-2 border-dashed border-black py-3">
              <p className="font-bold uppercase tracking-widest text-[10px] mb-1">Payment / Account Details</p>
              <p className="font-black text-[13px]">{paymentAccount}</p>
            </div>
          )}
          
          <div className="mb-4 space-y-1">
            <p className="font-bold italic">Thank you for your visit!</p>
            <p className="text-xs font-bold">Please come again.</p>
          </div>

          {/* Simulated Barcode */}
          <div className="mt-6 flex flex-col items-center justify-center text-black">
            <div className="font-mono text-[8px] tracking-[0.3em] overflow-hidden whitespace-nowrap max-w-full font-black">
               ||| || ||| | || ||| || ||| | || ||| || 
            </div>
            <div className="text-[10px] mt-1 tracking-widest font-bold">
              {order.id.slice(-12).toUpperCase()}
            </div>
          </div>

          {logoUrlBottom && (
            <div className="mt-6 flex justify-center border-t border-black pt-4">
              <img src={logoUrlBottom} alt="Bottom Logo" className="max-h-12 w-auto object-contain" />
            </div>
          )}
        </div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';
