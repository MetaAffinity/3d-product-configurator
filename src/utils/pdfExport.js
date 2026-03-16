import { jsPDF } from "jspdf";
import { getTotal, getSelectedSummary } from "../config/customOptionsState";
import { modelConfig } from "../config/models";

/**
 * Capture canvas screenshot as data URL.
 */
function captureCanvas() {
  const canvas = document.querySelector("canvas");
  if (!canvas) return null;
  try {
    return canvas.toDataURL("image/png");
  } catch (_) {
    return null;
  }
}

/**
 * Wait for next animation frame + a small delay for render to complete.
 */
function waitFrame(ms = 100) {
  return new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, ms));
  });
}

/**
 * Generate a PDF summary with front & back views of the product.
 * @param {string} modelName
 * @param {object} controlsRef — ref to OrbitControls (controls.current)
 */
export async function exportPDF(modelName, controlsRef) {
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

  // Calculate proper image dimensions from canvas aspect ratio
  const canvas = document.querySelector("canvas");
  const maxImgW = 80;
  let imgW = maxImgW;
  let imgH = 60;
  if (canvas) {
    const aspect = canvas.width / canvas.height;
    imgH = maxImgW / aspect;
  }

  // Capture front view
  const frontImg = captureCanvas();

  // Capture back view by rotating camera
  let backImg = null;
  if (controlsRef) {
    const savedAzimuthal = controlsRef.getAzimuthalAngle();
    const savedPolar = controlsRef.getPolarAngle();

    // Rotate to back (π radians from current)
    controlsRef.setAzimuthalAngle(savedAzimuthal + Math.PI);
    controlsRef.update();
    await waitFrame(200);

    backImg = captureCanvas();

    // Restore original camera position
    controlsRef.setAzimuthalAngle(savedAzimuthal);
    controlsRef.setPolarAngle(savedPolar);
    controlsRef.update();
  }

  // Add images side by side
  if (frontImg && backImg) {
    const gap = 6;
    const totalW = imgW * 2 + gap;
    const startX = (pageW - totalW) / 2;

    // Labels
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text("Front", startX + imgW / 2, y, { align: "center" });
    doc.text("Back", startX + imgW + gap + imgW / 2, y, { align: "center" });
    y += 4;

    doc.addImage(frontImg, "PNG", startX, y, imgW, imgH);
    doc.addImage(backImg, "PNG", startX + imgW + gap, y, imgW, imgH);
    y += imgH + 8;
  } else if (frontImg) {
    // Single image centered
    doc.addImage(frontImg, "PNG", (pageW - imgW) / 2, y, imgW, imgH);
    y += imgH + 8;
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

  // Timestamp
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW / 2, y, { align: "center" });

  doc.save(`${modelName}-configuration.pdf`);
}
