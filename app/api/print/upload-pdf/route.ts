import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { pdfData, orderId } = await req.json();

    if (!pdfData || !orderId) {
      return NextResponse.json({ error: 'PDF data and Order ID are required.' }, { status: 400 });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(pdfData.split(',')[1], 'base64');

    // Define storage path
    const targetDir = path.join(process.cwd(), 'public', 'receipts');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fileName = `receipt_${orderId}_${Date.now()}.pdf`;
    const filePath = path.join(targetDir, fileName);

    // Save PDF
    fs.writeFileSync(filePath, buffer);

    console.log(`>>> [PDF UPLOAD] Receipt saved: ${fileName}`);

    return NextResponse.json({ 
      success: true, 
      message: 'PDF receipt uploaded successfully',
      filePath: `/receipts/${fileName}`
    });
  } catch (err: any) {
    console.error('PDF Upload Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
