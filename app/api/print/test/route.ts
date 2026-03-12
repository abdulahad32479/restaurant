import { NextResponse } from 'next/server';
import escpos from 'escpos';
import escposNetwork from 'escpos-network';

// Ensure the Network adapter is injected into the escpos scope
escpos.Network = escposNetwork;

export async function POST(req: Request) {
  try {
    const { printerIp, printerRole } = await req.json();

    if (!printerIp) {
      return NextResponse.json({ error: 'Printer IP is required.' }, { status: 400 });
    }

    // Connect to the specific printer at the provided IP address
    const device = new escpos.Network(printerIp);

    return new Promise((resolve) => {
      device.open((error: any) => {
        if (error) {
          console.error(`Failed to connect to ${printerRole || 'printer'} at ${printerIp}:`, error);
          resolve(NextResponse.json({ 
            error: `Failed to connect to ${printerRole || 'printer'}. Socket Error: ${error.message || 'Connection Refused'}. Ensure it is online and reachable on TCP Port 9100.` 
          }, { status: 500 }));
          return;
        }

        try {
          // Connection successful! We don't need to print anything, just close the device.
          device.close();
          resolve(NextResponse.json({ success: true, message: `Successfully connected to ${printerRole || 'printer'} at ${printerIp}` }));
        } catch (closeError) {
          console.error('Error closing test connection:', closeError);
          resolve(NextResponse.json({ success: true, message: 'Connected, but error closing connection.' }));
        }
      });
    });
  } catch (err: any) {
    console.error('Printer Test Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
