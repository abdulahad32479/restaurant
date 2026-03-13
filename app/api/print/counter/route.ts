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
              .text(businessName?.toUpperCase() || 'DUKES')
              .style('normal')
              .size(0, 0)
              .text(businessAddress?.toUpperCase() || '')
              .text(businessPhone || '')
              .text('-'.repeat(48))
              .align('lt')
              .style('b')
              .text('ORDER NO:'.padEnd(30, ' ') + (order.order_number || order.id.slice(-6).toUpperCase()).padStart(18, ' '))
              .style('normal')
              .text('Date:'.padEnd(30, ' ') + new Date(order.created_at).toLocaleString().padStart(18, ' '))
              .text('')
              .align('ct')
              .style('b')
              .text(`[ ${order.order_type.replace('_', ' ').toUpperCase()} ]`.padEnd(24, ' ') + `[ Table: ${order.table_no || order.table || 'N/A'} ]`)
              .align('lt')
              .style('normal')
              .text('Cashier:'.padEnd(30, ' ') + (order.created_by || 'dukes').padStart(18, ' '))
              .text('-'.repeat(48))
              .style('b')
              .text('QTY  ITEM'.padEnd(38, ' ') + 'TOTAL'.padStart(10, ' '))
              .style('normal')
              .text('-'.repeat(48));

            order.items.forEach((item: any) => {
              const productName = (item.product_name && item.product_name !== 'string') ? item.product_name : (item.product?.name || 'Item');
              const qtyStr = `${Number(item.quantity).toFixed(2)}`.padEnd(5, ' ');
              const nameStr = productName.toUpperCase().substring(0, 32).padEnd(33, ' ');
              const totalStr = Number(item.total_price || (item.quantity * (item.unit_price || 0))).toFixed(2).padStart(10, ' ');
              printer.text(`${qtyStr}${nameStr}${totalStr}`);
            });

            printer
              .text('-'.repeat(48))
              .align('rt')
              .text(`Subtotal: Rs. ${Number(order.subtotal || order.total).toFixed(2)}`)
              .text(`Tax: Rs. ${Number(order.taxamount || 0).toFixed(2)}`)
              .style('b')
              .size(1, 1)
              .text(`TOTAL DUE: Rs. ${Number(order.total).toFixed(2)}`)
              .style('normal')
              .size(0, 0)
              .text('')
              .align('ct')
              .text('THANK YOU FOR VISITING!')
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
