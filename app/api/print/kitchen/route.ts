import { NextResponse } from 'next/server';
import escpos from 'escpos';
import escposNetwork from 'escpos-network';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Ensure the Network adapter is injected into the escpos scope inside the handler
  // to avoid issues during Next.js static build module evaluation
  if (!(escpos as any).Network) {
    (escpos as any).Network = escposNetwork;
  }
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
            // --------- PROFESSIONAL KITCHEN DOCKET FORMATTING ---------
            const lineDash = '-'.repeat(48);
            
            printer
              .font('a')
              .align('ct')
              .style('b')
              .size(2, 2)
              .text('KITCHEN DOCKET')
              .style('normal')
              .size(0, 0)
              .text((businessName || 'DUKES').toUpperCase())
              .text('')
              .align('lt')
              .style('b')
              .text(lineDash);

            const orderNo = order.order_number || (order.id ? String(order.id).slice(-6).toUpperCase() : 'N/A');
            const dateStr = order.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString();
            
            printer
              .text(`Order No: ${orderNo}`)
              .text(`Date: ${dateStr}`)
              .text('')
              .size(1, 1)
              .text(`TYPE: ${String(order.order_type || 'Takeaway').replace('_', ' ').toUpperCase()}`);
              
            if (order.table_no || order.table) {
              printer.text(`TABLE: ${order.table_no || order.table}`);
            }
            
            printer
              .style('normal')
              .size(0, 0)
              .text(lineDash)
              .style('b')
              .text('QTY   ITEM')
              .style('normal')
              .text(lineDash)
              .size(1, 1);

            order.items.forEach((item: any) => {
              const productName = (item.product_name && item.product_name !== 'string') ? item.product_name : (item.product?.name || 'Item');
              const qty = Number(item.quantity).toFixed(0);
              printer.text(`[${qty}]  ${productName.toUpperCase()}`);
              if (item.notes || order.notes) {
                  printer.style('normal').size(0, 0).text(`      * NOTE: ${item.notes || order.notes}`);
                  printer.size(1, 1);
              }
            });

            printer
              .style('normal')
              .size(0, 0)
              .text('')
              .text(lineDash)
              .text('*** END OF TICKET ***');
          } else {
            // Raw Text Printing (Fallback)
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
