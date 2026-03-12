import { NextResponse } from 'next/server';
import escpos from 'escpos';
import escposNetwork from 'escpos-network';

// Ensure the Network adapter is injected into the escpos scope
escpos.Network = escposNetwork;

export async function POST(req: Request) {
  try {
    const { order, printerIp, printerRole, businessName, businessAddress, businessPhone } = await req.json();

    if (!order || !printerIp || !printerRole) {
      return NextResponse.json({ error: 'Order details, Printer IP, and Printer Role are required.' }, { status: 400 });
    }

    // Connect to the specific printer at the provided IP address
    const device = new escpos.Network(printerIp);
    const printer = new escpos.Printer(device);

    return new Promise((resolve) => {
      device.open((error: any) => {
        if (error) {
          console.error(`Failed to connect to ${printerRole} printer at ${printerIp}:`, error);
          resolve(NextResponse.json({ error: `Failed to connect to ${printerRole} printer: ${error.message || 'Check IP/Connection'}` }, { status: 500 }));
          return;
        }

        try {
          if (printerRole === 'main') {
            // --------- MAIN CASHIER RECEIPT FORMATTING ---------
            printer
              .font('a')
              .align('ct')
              .style('b')
              .size(1, 1)
              .text(businessName || 'RESTAURANT NAME')
              .style('normal')
              .size(0, 0)
              .text(businessAddress || '')
              .text(businessPhone || '')
              .text('')
              .align('lt')
              .text('-'.repeat(48)) // 80mm divider
              .text(`Order No: ${order.order_number || order.id.slice(-6).toUpperCase()}`)
              .text(`Date: ${new Date(order.created_at).toLocaleString()}`)
              .text(`Type: ${order.order_type.replace('_', ' ').toUpperCase()}`);

            if (order.table || order.table_no) {
              printer.text(`Table: ${order.table_no || order.table}`);
            }
            if (order.customer || order.delivery_info?.name) {
              printer.text(`Customer: ${order.delivery_info?.name || order.customer}`);
              if (order.delivery_info?.phone) printer.text(`Phone: ${order.delivery_info.phone}`);
              if (order.delivery_info?.address) printer.text(`Address: ${order.delivery_info.address}`);
            }

            printer
              .text('-'.repeat(48))
              .style('b')
              .text('QTY  ITEM                                  TOTAL')
              .style('normal');

            order.items.forEach((item: any) => {
              const productName = (item.product_name && item.product_name !== 'string') ? item.product_name : 'Item';
              const qtyStr = `${item.quantity}`.padEnd(5, ' ');
              const nameStr = productName.substring(0, 30).padEnd(32, ' ');
              const totalStr = Number(item.total_price).toFixed(2).padStart(11, ' ');
              printer.text(`${qtyStr}${nameStr}${totalStr}`);
            });

            printer
              .text('-'.repeat(48))
              .align('rt')
              .text(`Subtotal: Rs. ${Number(order.subtotal).toFixed(2)}`)
              .text(`Tax: Rs. ${Number(order.taxamount).toFixed(2)}`);

            if (Number(order.discount_amount) > 0) {
              printer.text(`Discount: -Rs. ${Number(order.discount_amount).toFixed(2)}`);
            }

            printer
              .style('b')
              .size(1, 1)
              .text(`Total Due: Rs. ${Number(order.total).toFixed(2)}`)
              .style('normal')
              .size(0, 0)
              .text('')
              .align('ct')
              .text('*** END OF RECEIPT ***')
              .cut()
              .cashdraw() // Open cash drawer if connected to the main printer
              .close();
              
          } else if (printerRole === 'kitchen') {
            // --------- KITCHEN DOCKET FORMATTING ---------
            printer
              .font('a')
              .align('ct')
              .style('b')
              .size(2, 2)
              .text('KITCHEN DOCKET')
              .style('normal')
              .size(0, 0)
              .text(businessName || '')
              .text('')
              .align('lt')
              .text('-'.repeat(48))
              .text(`Order No: ${order.order_number || order.id.slice(-6).toUpperCase()}`)
              .text(`Date: ${new Date(order.created_at).toLocaleString()}`)
              .style('b')
              .size(1, 1)
              .text(`TYPE: ${order.order_type.replace('_', ' ').toUpperCase()}`);
              
            if (order.table || order.table_no) {
              printer.text(`TABLE: ${order.table_no || order.table}`);
            }
            if (order.order_type === 'delivery' && (order.customer || order.delivery_info?.name)) {
                printer.style('normal').size(0, 0).text(`FOR: ${order.delivery_info?.name || order.customer}`);
            }
            
            printer
              .style('normal')
              .size(0, 0)
              .text('-'.repeat(48))
              .style('b')
              .text('QTY  ITEM')
              .style('normal')
              .text('-'.repeat(48))
              .size(1, 1) // slightly larger text for the cooks to read

            order.items.forEach((item: any) => {
              const productName = (item.product_name && item.product_name !== 'string') ? item.product_name : 'Item';
              printer.text(`[${item.quantity}]  ${productName.toUpperCase()}`);
              if (order.notes) { // if there are order notes apply it, or we could look for item level notes if the app supported them
                  printer.style('normal').size(0, 0).text(`      * NOTE: ${order.notes}`);
              }
            });

            printer
              .style('normal')
              .size(0, 0)
              .text('')
              .text('')
              .cut()
              .close();
          } else {
             resolve(NextResponse.json({ error: 'Unknown printer role.' }, { status: 400 }));
             return;
          }

          resolve(NextResponse.json({ success: true, message: `${printerRole} printed successfully` }));
        } catch (printError) {
          console.error(`Print formatting error for ${printerRole}:`, printError);
          resolve(NextResponse.json({ error: 'Printer formatting error' }, { status: 500 }));
        }
      });
    });
  } catch (err: any) {
    console.error('Server Printing Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
