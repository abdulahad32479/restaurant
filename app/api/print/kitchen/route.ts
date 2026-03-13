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
          
          // MOCK FALLBACK: If connection fails, we log it but return success to avoid blocking the user
          // This allows the app to work even without a physical printer connected.
          console.log('>>> [MOCK PRINT] Kitchen Printer connection failed. Simulating success...');
          resolve(NextResponse.json({ 
            success: true, 
             message: 'Kitchen print simulated (Printer not connected)',
             is_mocked: true 
          }));
          return;
        }

        try {
          if (order) {
            // Professional Kitchen Formatting
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
              .style('b')
              .text('-'.repeat(48))
              .text(`Order No: ${order.order_number || order.id.slice(-6).toUpperCase()}`)
              .text(`Date: ${new Date(order.created_at).toLocaleString()}`)
              .style('b')
              .size(1, 1)
              .text(`TYPE: ${order.order_type.replace('_', ' ').toUpperCase()}`);
              
            if (order.table || order.table_no) {
              printer.text(`TABLE: ${order.table_no || order.table}`);
            }
            
            printer
              .style('normal')
              .size(0, 0)
              .text('-'.repeat(48))
              .style('b')
              .text('QTY  ITEM')
              .style('normal')
              .text('-'.repeat(48))
              .size(1, 1);

            order.items.forEach((item: any) => {
              const productName = (item.product_name && item.product_name !== 'string') ? item.product_name : 'Item';
              printer.text(`[${item.quantity}]  ${productName.toUpperCase()}`);
              if (order.notes) {
                  printer.style('normal').size(0, 0).text(`      * NOTE: ${order.notes}`);
              }
            });
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
