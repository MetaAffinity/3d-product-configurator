import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { getTotal, getSelectedSummary } from "../config/customOptionsState";
import { modelConfig } from "../config/models";
import { generateShareURL } from "./shareLink";

/**
 * Generate a PDF summary with user-captured views of the product.
 * @param {string} modelName
 * @param {Array} views — array of { label, dataURL } captured by the user
 * @param {string} note — optional product note from user
 */
export async function exportPDF(modelName, views, note) {
  const cfg = modelConfig[modelName]?.customOptions;
  if (!cfg?.enabled) return;

  const summary = getSelectedSummary(modelName);
  const total = getTotal(modelName);
  const currency = cfg.currency || "USD";
  const branding = cfg.branding || {};
  const features = cfg.features || {};

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  // ── Branding header ──────────────────────────────────────────────
  if (branding.companyName) {
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40);
    doc.text(branding.companyName, pageW / 2, y, { align: "center" });
    y += 7;
  }
  if (branding.tagline) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(branding.tagline, pageW / 2, y, { align: "center" });
    y += 6;
  }
  if (branding.companyName || branding.tagline) {
    doc.setDrawColor(200);
    doc.line(30, y, pageW - 30, y);
    y += 8;
  }

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(`${modelName} — Custom Configuration`, pageW / 2, y, { align: "center" });
  y += 12;

  // Render captured views
  const imgs = views || [];
  if (imgs.length > 0) {
    // Images are center-cropped to square (1:1 aspect)
    if (imgs.length === 1) {
      // Single image — large centered
      const imgW = 110;
      const imgH = imgW;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(imgs[0].label, pageW / 2, y, { align: "center" });
      y += 4;
      doc.addImage(imgs[0].dataURL, "PNG", (pageW - imgW) / 2, y, imgW, imgH);
      y += imgH + 8;
    } else if (imgs.length === 2) {
      // Two images — side by side
      const imgW = 82;
      const imgH = imgW;
      const gap = 6;
      const startX = (pageW - (imgW * 2 + gap)) / 2;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(imgs[0].label, startX + imgW / 2, y, { align: "center" });
      doc.text(imgs[1].label, startX + imgW + gap + imgW / 2, y, { align: "center" });
      y += 4;
      doc.addImage(imgs[0].dataURL, "PNG", startX, y, imgW, imgH);
      doc.addImage(imgs[1].dataURL, "PNG", startX + imgW + gap, y, imgW, imgH);
      y += imgH + 8;
    } else {
      // 3+ images — grid of 2 per row
      const imgW = 82;
      const imgH = imgW;
      const gap = 6;
      const startX = (pageW - (imgW * 2 + gap)) / 2;

      for (let i = 0; i < imgs.length; i += 2) {
        // Labels
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120);
        doc.text(imgs[i].label, startX + imgW / 2, y, { align: "center" });
        if (imgs[i + 1]) {
          doc.text(imgs[i + 1].label, startX + imgW + gap + imgW / 2, y, { align: "center" });
        }
        y += 4;

        doc.addImage(imgs[i].dataURL, "PNG", startX, y, imgW, imgH);
        if (imgs[i + 1]) {
          doc.addImage(imgs[i + 1].dataURL, "PNG", startX + imgW + gap, y, imgW, imgH);
        }
        y += imgH + 6;

        // Page break if running out of space
        if (y > 250 && i + 2 < imgs.length) {
          doc.addPage();
          y = 20;
        }
      }
      y += 2;
    }
  }

  doc.setTextColor(0);

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

  // ── Product Note ──────────────────────────────────────────────────
  if (note && note.trim()) {
    // Check if we need page break
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Product Note", 20, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    const noteLines = doc.splitTextToSize(note.trim(), pageW - 44);
    doc.text(noteLines, 24, y);
    y += noteLines.length * 5 + 6;

    doc.setDrawColor(200);
    doc.line(20, y, pageW - 20, y);
    y += 8;
  }

  // ── QR Code ──────────────────────────────────────────────────────
  if (features.qrCode) {
    try {
      const shareURL = generateShareURL(modelName);
      const qrDataURL = await QRCode.toDataURL(shareURL, {
        width: 200,
        margin: 1,
        color: { dark: "#333333", light: "#ffffff" },
      });

      // Check if we need a page break for QR
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      const qrSize = 30;
      doc.addImage(qrDataURL, "PNG", (pageW - qrSize) / 2, y, qrSize, qrSize);
      y += qrSize + 4;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text("Scan to view this configuration", pageW / 2, y, { align: "center" });
      y += 8;
    } catch (_) {
      // QR generation failed — skip silently
    }
  }

  // Timestamp
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW / 2, y, { align: "center" });

  doc.save(`${modelName}-configuration.pdf`);
}
