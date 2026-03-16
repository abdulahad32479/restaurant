import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log('>>> [SERVER] [COUNTER] Request received');
  
  try {
    let body;
    try {
      body = await req.json();
    } catch (e: any) {
      console.error('>>> [SERVER] [COUNTER] Failed to parse JSON body:', e.message);
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const { order, businessName, businessAddress, businessPhone } = body;

    if (!order) {
      console.warn('>>> [SERVER] [COUNTER] Missing "order" in payload. Body keys:', Object.keys(body));
      return NextResponse.json({ error: 'Order data is required.' }, { status: 400 });
    }

    // Log the received order for debugging
    console.log('>>> [SERVER] [COUNTER] Order received:', order.order_number || order.id);
    console.log('>>> [SERVER] [COUNTER] Business:', businessName || 'N/A');
    console.log('>>> [SERVER] [COUNTER] Items count:', order.items?.length || 0);

    // Return success - the actual printing is handled by the local print agent
    // which polls this endpoint or listens for print jobs
    return NextResponse.json({ 
      success: true, 
      message: 'Counter receipt received.',
      orderId: order.order_number || order.id
    });

  } catch (err: any) {
    console.error('>>> [SERVER] [COUNTER] Fatal Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
