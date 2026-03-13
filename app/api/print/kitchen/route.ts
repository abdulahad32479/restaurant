import { NextResponse } from 'next/server';
import escpos from 'escpos';
import escposNetwork from 'escpos-network';

// Ensure the Network adapter is injected into the escpos scope
escpos.Network = escposNetwork;

export async function POST(req: Request) {
  try {
    const { text, order, businessName, businessAddress, businessPhone } = await req.json();

    // Backend-managed Kitchen Printer IP
    const printerIp = process.env.KITCHEN_PRINTER_IP || '127.0.0.1';

    if (!text && !order) {
      return NextResponse.json({ error: 'Either text or order details are required.' }, { status: 400 });
    }

    const device = new escpos.Network(printerIp);
    const printer = new escpos.Printer(device);

    return new Promise((resolve) => {
      device.open((error: any) => {
        if (error) {
          console.error(`Failed to connect to kitchen printer at ${printerIp}:`, error);
          resolve(NextResponse.json({ error: `Failed to connect to kitchen printer: ${error.message || 'Check IP/Connection'}` }, { status: 500 }));
          return;
        }

        try {
          if (order) {
            // Professional Kitchen Formatting
            printer
              .font('a')
              .align('ct')
              .style('b')
              .size(0, 0)
              .text('KITCHEN DOCKET')
              .size(0, 0)
              .text(businessName?.toUpperCase() || '')
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
              .text('-'.repeat(48))
              .style('b')
              .text('QTY    ITEM')
              .style('normal')
              .text('-'.repeat(48))
              .size(0, 0);

            order.items.forEach((item: any) => {
              const productName = (item.product_name && item.product_name !== 'string') ? item.product_name : (item.product?.name || 'Item');
              printer.style('b').text(`[${Number(item.quantity).toFixed(0)}]    ${productName.toUpperCase()}`);
              if (item.notes || order.notes) {
                  printer.style('normal').size(0, 0).text(`       * NOTE: ${item.notes || order.notes}`);
              }
              printer.size(0, 0);
            });
            printer.size(0, 0).text('-'.repeat(48)).text('*** END OF TICKET ***');
          } else {
            // Raw Text Printing
            printer
              .font('a')
              .align('lt')
              .size(0, 0)
              .text(text);
          }

          printer.text('').cut().close();
          resolve(NextResponse.json({ success: true, message: 'Kitchen printed successfully' }));
        } catch (printError) {
          console.error('Kitchen print formatting error:', printError);
          resolve(NextResponse.json({ error: 'Printer formatting error' }, { status: 500 }));
        }
      });
    });
  } catch (err: any) {
    console.error('Kitchen Printing Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
