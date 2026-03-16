import { jsPDF } from "jspdf";
import { getTotal, getSelectedSummary } from "../config/customOptionsState";
import { modelConfig } from "../config/models";

/**
 * Generate a PDF summary of the product configuration.
 * Captures the 3D canvas as a screenshot and lists selected options with prices.
 */
export function exportPDF(modelName) {
  const cfg = modelConfig[modelName]?.customOptions;
  if (!cfg?.enabled) return;

  const summary = getSelectedSummary(modelName);
  const total = getTotal(modelName);
  const currency = cfg.currency || "USD";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`${modelName} — Custom Configuration`, pageW / 2, y, { align: "center" });
  y += 12;

  // Screenshot from canvas
  const canvas = document.querySelector("canvas");
  if (canvas) {
    try {
      const imgData = canvas.toDataURL("image/png");
      const imgW = 120;
      const imgH = 90;
      doc.addImage(imgData, "PNG", (pageW - imgW) / 2, y, imgW, imgH);
      y += imgH + 10;
    } catch (_) {
      // canvas tainted or unavailable — skip image
    }
  }

  // Divider
  doc.setDrawColor(200);
  doc.line(20, y, pageW - 20, y);
  y += 8;

  // Base price
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Base Price:", 20, y);
  doc.text(`${currency} ${cfg.basePrice.toFixed(2)}`, pageW - 20, y, { align: "right" });
  y += 8;

  // Options table
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Selected Options", 20, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  summary.forEach((item) => {
    doc.text(`${item.label}:`, 24, y);
    doc.text(item.choiceLabel, 90, y);
    doc.text(
      item.price > 0 ? `+${currency} ${item.price.toFixed(2)}` : "Included",
      pageW - 20,
      y,
      { align: "right" }
    );
    y += 7;
  });

  // Total
  y += 4;
  doc.setDrawColor(200);
  doc.line(20, y, pageW - 20, y);
  y += 8;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Total:", 20, y);
  doc.text(`${currency} ${total.toFixed(2)}`, pageW - 20, y, { align: "right" });
  y += 12;

  // Timestamp
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW / 2, y, { align: "center" });

  doc.save(`${modelName}-configuration.pdf`);
}
