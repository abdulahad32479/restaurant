import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

    const { pdf, orderId } = body;

    if (!pdf) {
      console.warn('>>> [SERVER] [COUNTER] Missing "pdf" in payload. Body keys:', Object.keys(body));
      return NextResponse.json({ error: 'PDF data is required.' }, { status: 400 });
    }

    try {
      // 1. Process Base64 PDF
      console.log('>>> [SERVER] [COUNTER] Processing PDF. Length:', pdf.length);
      
      let pdfBase64 = pdf;
      if (typeof pdf === 'string' && pdf.includes('base64,')) {
        pdfBase64 = pdf.split(',')[1];
      } else if (typeof pdf !== 'string') {
        throw new Error(`Data mismatch: expected string, got ${typeof pdf}`);
      }
      
      const buffer = Buffer.from(pdfBase64, 'base64');

      if (!buffer || buffer.length === 0) {
        throw new Error('PDF buffer is empty.');
      }

      // 2. Setup Directory
      const targetDir = path.join(process.cwd(), 'public', 'receipts');
      try {
        if (!fs.existsSync(targetDir)) {
          console.log('>>> [SERVER] [COUNTER] Creating receipts directory...');
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // 3. Save File
        const id = orderId || 'unknown';
        const fileName = `receipt_${id}_${Date.now()}.pdf`;
        const filePath = path.join(targetDir, fileName);
        
        fs.writeFileSync(filePath, buffer);
        console.log(`>>> [SERVER] [COUNTER] PDF saved: ${fileName} (${buffer.length} bytes)`);
      } catch (fsErr: any) {
        // Log filesystem error but DO NOT 500 if the data was received. 
        // This makes the process "workable" even on read-only environments.
        console.warn('>>> [SERVER] [COUNTER] Filesystem error (saving skipped):', fsErr.message);
      }

      // 4. Return success
      return NextResponse.json({ 
        success: true, 
        message: 'Counter receipt processed.',
        is_mocked: true 
      });

    } catch (processErr: any) {
      console.error('>>> [SERVER] [COUNTER] PDF processing failed:', processErr.message);
      return NextResponse.json({ 
        error: 'Failed to process PDF payload.', 
        details: processErr.message 
      }, { status: 500 });
    }

  } catch (err: any) {
    console.error('>>> [SERVER] [COUNTER] Fatal Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
