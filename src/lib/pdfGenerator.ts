import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { QCReport } from "../types";

export async function generatePDFReport(report: QCReport, elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Temporarily hide buttons and other non-report elements if needed
  // But we'll assume the elementId targets specifically the printable area

  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`Bao_cao_QC_${report.timestamp.replace(/[/:\s]/g, "_")}.pdf`);
}
