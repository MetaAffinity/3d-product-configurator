/**
 * Creates an offscreen canvas with the given text rendered on it.
 * Returns the canvas element (caller converts to THREE.CanvasTexture).
 */
export function createTextTexture({ text, font, textColor, bold, curved, curveUp }) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);

  const weight = bold ? "bold" : "normal";
  const fontSize = Math.max(32, Math.floor(size / Math.max(text.length, 1) * 1.1));
  const clampedSize = Math.min(fontSize, 96);
  ctx.font = `${weight} ${clampedSize}px "${font}", sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (curved && text.length > 0) {
    // Draw each character along an arc
    const r = 160;
    const charSpacing = Math.min(0.18, (Math.PI * 0.85) / Math.max(text.length, 1));
    const totalAngle = charSpacing * (text.length - 1);
    const startAngle = -totalAngle / 2;
    const dir = curveUp ? -1 : 1; // -1 = arch up (top of circle), 1 = arch down

    ctx.save();
    ctx.translate(size / 2, size / 2 + dir * r * 0.35);

    for (let i = 0; i < text.length; i++) {
      const angle = startAngle + charSpacing * i;
      ctx.save();
      ctx.rotate(angle * dir);
      ctx.translate(0, -r * dir);
      ctx.rotate(-angle * dir + (dir === 1 ? Math.PI : 0));
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  } else {
    // Straight text — wrap if too wide
    const maxWidth = size * 0.9;
    const words = text.split(" ");
    const lines = [];
    let current = "";

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);

    const lineH = clampedSize * 1.25;
    const startY = size / 2 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, size / 2, startY + i * lineH, maxWidth);
    });
  }

  return canvas;
}
