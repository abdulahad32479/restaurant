import { Order } from '../types';

export const formatOrderToReceiptText = (order: Order, businessInfo: { name?: string, address?: string, phone?: string, tables?: Record<string, string> }) => {
  const line = '-'.repeat(48);
  const itemsHeader = 'QTY  ITEM                                  TOTAL';
  
  let text = '';
  text += `${(businessInfo.name || 'RESTAURANT NAME').toUpperCase()}\n`;
  if (businessInfo.address) text += `${businessInfo.address.toUpperCase()}\n`;
  if (businessInfo.phone) text += `${businessInfo.phone}\n`;
  text += '\n';
  text += `${line}\n`;
  text += `ORDER NO: ${order.order_number || order.id.slice(-6).toUpperCase()}\n`;
  text += `DATE: ${new Date(order.created_at).toLocaleString().toUpperCase()}\n`;
  text += `TYPE: ${order.order_type.replace('_', ' ').toUpperCase()}\n`;
  
  if (order.table_no || order.table) {
    const tableName = (order.table && businessInfo.tables?.[order.table]) || order.table_no || order.table;
    text += `TABLE: ${tableName}\n`;
  }
  
  text += `${line}\n`;
  text += `${itemsHeader}\n`;
  
  order.items.forEach((item: any) => {
    const productName = (item.product_name && item.product_name !== 'string') ? item.product_name.toUpperCase() : 'ITEM';
    const qtyStr = `${item.quantity}`.padEnd(5, ' ');
    const nameStr = productName.substring(0, 30).padEnd(32, ' ');
    const totalStr = Number(item.total_price).toFixed(2).padStart(11, ' ');
    text += `${qtyStr}${nameStr}${totalStr}\n`;
  });
  
  text += `${line}\n`;
  text += `SUBTOTAL: RS. ${Number(order.subtotal).toFixed(2)}\n`.padStart(48);
  text += `TAX: RS. ${Number(order.taxamount).toFixed(2)}\n`.padStart(48);
  if (Number(order.discount_amount) > 0) {
    text += `DISCOUNT: -RS. ${Number(order.discount_amount).toFixed(2)}\n`.padStart(48);
  }
  text += `TOTAL DUE: RS. ${Number(order.total).toFixed(2)}\n`.padStart(48);
  text += '\n';
  text += '*** END OF RECEIPT ***\n';
  
  return text;
};

export const formatOrderToKitchenText = (order: Order, businessName?: string, tables: Record<string, string> = {}) => {
  const line = '-'.repeat(48);
  
  let text = '';
  text += 'KITCHEN DOCKET\n';
  if (businessName) text += `${businessName}\n`;
  text += '\n';
  text += `${line}\n`;
  text += `Order No: ${order.order_number || order.id.slice(-6).toUpperCase()}\n`;
  text += `Date: ${new Date(order.created_at).toLocaleString()}\n`;
  text += `TYPE: ${order.order_type.replace('_', ' ').toUpperCase()}\n`;
  
  if (order.table_no || order.table) {
    const tableName = (order.table && tables[order.table]) || order.table_no || order.table;
    text += `TABLE: ${tableName}\n`;
  }
  
  text += `${line}\n`;
  text += `QTY  ITEM\n`;
  text += `${line}\n`;
  
  order.items.forEach((item: any) => {
    const productName = (item.product_name && item.product_name !== 'string') ? item.product_name : 'Item';
    text += `[${item.quantity}]  ${productName.toUpperCase()}\n`;
    if (order.notes) {
      text += `      * NOTE: ${order.notes}\n`;
    }
  });
  
  return text;
};
