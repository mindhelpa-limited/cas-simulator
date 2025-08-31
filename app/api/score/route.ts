// app/api/generate-report/route.ts
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req: Request) {
  try {
    const { candidateName, stations } = await req.json();

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 800;

    // Title
    page.drawText("CASC Exam Report", {
      x: 200,
      y,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 40;

    // Candidate name
    page.drawText(`Candidate: ${candidateName}`, {
      x: 50,
      y,
      size: 14,
      font,
    });
    y -= 30;

    // Station feedback
    stations.forEach((station: any, index: number) => {
      page.drawText(`Station ${index + 1}: ${station.title}`, {
        x: 50,
        y,
        size: 12,
        font,
      });
      y -= 20;

      Object.entries(station.feedback).forEach(([domain, feedback]) => {
        page.drawText(`${domain}: ${feedback}`, {
          x: 70,
          y,
          size: 10,
          font,
        });
        y -= 15;
      });

      y -= 15;
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();

    // ✅ Fix: Convert Uint8Array to Buffer so NextResponse accepts it
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="casc_report.pdf"',
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error generating PDF", { status: 500 });
  }
}
