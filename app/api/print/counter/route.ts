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
          
          // MOCK FALLBACK: If connection fails, we log it but return success to avoid blocking the user
          // This allows the app to work even without a physical printer connected.
          console.log('>>> [MOCK PRINT] Counter Printer connection failed. Simulating success...');
          resolve(NextResponse.json({ 
            success: true, 
            message: 'Counter print simulated (Printer not connected)',
            is_mocked: true 
          }));
          return;
        }

        try {
          if (order) {
            // --------- PROFESSIONAL COUNTER RECEIPT FORMATTING ---------
            const lineDash = '-'.repeat(48);
            const lineSolid = '='.repeat(48);
            const lineDot = '.'.repeat(48);

            printer
              .font('a')
              .align('ct')
              .style('b')
              .size(1, 1)
              .text((businessName || 'DUKE\'S POS').toUpperCase())
              .style('normal')
              .size(0, 0)
              .text(businessAddress || '123 Main St, City')
              .text(businessPhone || '+92 300 1234567')
              .text('')
              .text(lineDash)
              .align('lt');

            // Order Info Table-like layout
            const orderNo = order.order_number || order.id.slice(-6).toUpperCase();
            const dateStr = new Date(order.created_at).toLocaleString('en-US', { 
              year: 'numeric', month: 'numeric', day: 'numeric', 
              hour: '2-digit', minute: '2-digit', hour12: true 
            });
            const cashier = order.created_by || 'dukes';

            printer
              .style('b').text(`ORDER NO:`.padEnd(30) + orderNo.padStart(18)).style('normal')
              .text(`Date:`.padEnd(30) + dateStr.padStart(18))
              .text('')
              .align('ct')
              .text(`[ ${order.order_type.replace('_', ' ').toUpperCase()} ]`.padEnd(24) + `[ Table ${order.table_no || order.table || 'N/A'} ]`)
              .align('lt')
              .text(`Cashier:`.padEnd(30) + cashier.padStart(18))
              .text(lineSolid);

            // Items Header
            printer
              .style('b')
              .text('QTY  ITEM'.padEnd(38) + 'TOTAL'.padStart(10))
              .style('normal')
              .text(lineSolid);

            // Item list
            order.items.forEach((item: any) => {
              const productName = (item.product_name && item.product_name !== 'string') ? item.product_name : (item.product?.name || 'Item');
              const qty = Number(item.quantity).toFixed(2);
              const totalLine = Number(item.total_price || (item.quantity * (item.unit_price || 0))).toFixed(2);
              
              printer.style('b').text(`${qty} ${productName.padEnd(32)} ${totalLine.padStart(9)}`).style('normal');
            });

            printer
              .text(lineDot)
              .align('rt');

            // Subtotal and Tax
            const subtotal = Number(order.subtotal || order.total).toFixed(2);
            const tax = Number(order.taxamount || 0).toFixed(2);
            const total = Number(order.total).toFixed(2);

            printer
              .text(`Subtotal`.padEnd(30) + `Rs. ${subtotal.padStart(10)}`)
              .text(`Tax`.padEnd(30) + `Rs. ${tax.padStart(10)}`)
              .style('b')
              .size(1, 0)
              .text(`TOTAL DUE`.padEnd(20) + `Rs. ${total.padStart(10)}`)
              .style('normal')
              .size(0, 0)
              .text('')
              .align('ct')
              .text(lineDot)
              .text('')
              .text('THANK YOU FOR VISITING!')
              .text('*** END OF RECEIPT ***');
          } else {
            // Raw Text Printing (Fallback if old frontend)
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
