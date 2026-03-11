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
    users = {}
  }, ref) => {
    
    const formatDate = (dateString?: string) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-6 font-mono text-sm max-w-[350px] mx-auto border border-dashed border-gray-300"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase mb-1">{businessName}</h1>
          <p className="text-xs mb-1">{businessAddress}</p>
          <p className="text-xs">{businessPhone}</p>
        </div>

        {/* Order Info */}
        <div className="border-y border-dashed border-gray-400 py-3 mb-4 space-y-1">
          <div className="flex justify-between">
            <span>Order #</span>
            <span className="font-bold">{order.order_number || order.id.slice(-6).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span>{formatDate(order.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Type</span>
            <span className="uppercase">{order.order_type.replace('_', ' ')}</span>
          </div>
          {order.order_type === 'dine_in' && (order.table_no || order.table) && (
            <div className="flex justify-between">
              <span>Table</span>
              <span className="font-bold">{order.table_no || tables[order.table || ''] || order.table}</span>
            </div>
          )}
          {order.created_by && (
            <div className="flex justify-between">
              <span>Staff</span>
              <span className="truncate max-w-[150px]">{users[order.created_by] || order.created_by}</span>
            </div>
          )}
          {order.branch_name && (
            <div className="flex justify-between">
              <span>Branch</span>
              <span className="truncate max-w-[150px]">{order.branch_name}</span>
            </div>
          )}
          {(order.order_type === 'delivery' || order.customer) && (
            <>
              <div className="flex justify-between">
                <span>Customer</span>
                <span className="font-bold">
                  {order.delivery_info?.name || customers[order.customer || ''] || order.customer}
                </span>
              </div>
              {order.delivery_info?.phone && (
                <div className="flex justify-between">
                  <span>Contact</span>
                  <span>{order.delivery_info.phone}</span>
                </div>
              )}
              {order.delivery_info?.address && (
                <div className="text-xs mt-1">
                  {order.delivery_info.address}
                </div>
              )}
            </>
          )}
        </div>

        {/* Items */}
        <div className="mb-4">
          <div className="flex justify-between font-bold border-b border-gray-800 pb-1 mb-2">
            <span>Item</span>
            <span>Total</span>
          </div>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <div className="flex-1 pr-2">
                  <p>{item.quantity}x {item.product_name || products[item.product] || item.product}</p>
                </div>
                <div>Rs. {Number(item.total_price || (Number(item.unit_price) * item.quantity)).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-gray-400 pt-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span>Subtotal</span>
            <span>Rs. {Number(order.subtotal).toFixed(2)}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-xs">
              <span>Discount</span>
              <span>-Rs. {Number(order.discount_amount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span>Tax</span>
            <span>Rs. {Number(order.taxamount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-800">
            <span>Total</span>
            <span>Rs. {Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Info */}
        {order.status !== 'draft' && order.payments && order.payments.length > 0 && (
          <div className="mt-4 text-xs">
            <div className="text-center mb-1 font-bold">--- Payment ---</div>
            {order.payments.map((payment, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="uppercase">{payment.method}</span>
                <span>Rs. {Number(payment.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-xs">
          <p>Thank you for your visit!</p>
          <p>Please come again.</p>
        </div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';
