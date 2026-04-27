import { NextResponse } from 'next/server';
const generate = require('../../../scripts/generate-pdf');

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log(`Generating PDF for: ${data.name || 'Unknown'}`);
    
    const pdfBuffer = await generate(data);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("Generated PDF buffer is empty");
    }

    console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${data.name || 'Resume'}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message }, 
      { status: 500 }
    );
  }
}
