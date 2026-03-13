import { NextResponse } from 'next/server';
import escpos from 'escpos';
import escposNetwork from 'escpos-network';

// Ensure the Network adapter is injected into the escpos scope
escpos.Network = escposNetwork;

export async function POST(req: Request) {
  try {
    const { text, order, businessName, businessAddress, businessPhone } = await req.json();

    // Backend-managed Counter Printer IP
    const printerIp = process.env.COUNTER_PRINTER_IP || '127.0.0.1';

    if (!text && !order) {
      return NextResponse.json({ error: 'Either text or order details are required.' }, { status: 400 });
    }

    const device = new escpos.Network(printerIp);
    const printer = new escpos.Printer(device);

    return new Promise((resolve) => {
      device.open((error: any) => {
        if (error) {
          console.error(`Failed to connect to counter printer at ${printerIp}:`, error);
          resolve(NextResponse.json({ error: `Failed to connect to counter printer: ${error.message || 'Check IP/Connection'}` }, { status: 500 }));
          return;
        }

        try {
          if (order) {
            // Professional Cashier Formatting
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
              .style('b')
              .text('-'.repeat(48))
              .text(`Order No: ${order.order_number || order.id.slice(-6).toUpperCase()}`)
              .text(`Date: ${new Date(order.created_at).toLocaleString()}`)
              .text(`Type: ${order.order_type.replace('_', ' ').toUpperCase()}`);

            if (order.table || order.table_no) {
              printer.text(`Table: ${order.table_no || order.table}`);
            }
            if (order.customer || order.delivery_info?.name) {
              printer.text(`Customer: ${order.delivery_info?.name || order.customer}`);
              if (order.delivery_info?.phone) printer.text(`Phone: ${order.delivery_info.phone}`);
            }

            printer.style('normal');

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
              .text(`Tax: Rs. ${Number(order.taxamount).toFixed(2)}`)
              .style('b')
              .size(1, 1)
              .text(`Total Due: Rs. ${Number(order.total).toFixed(2)}`)
              .style('normal')
              .size(0, 0)
              .text('')
              .align('ct')
              .text('*** END OF RECEIPT ***');
          } else {
            // Raw Text Printing
            printer
              .font('a')
              .align('lt')
              .size(0, 0)
              .text(text);
          }

          printer.text('').cut().cashdraw().close();

          resolve(NextResponse.json({ success: true, message: 'Counter printed successfully' }));
        } catch (printError) {
          console.error('Counter print formatting error:', printError);
          resolve(NextResponse.json({ error: 'Printer formatting error' }, { status: 500 }));
        }
      });
    });
  } catch (err: any) {
    console.error('Counter Printing Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
