/**
 * Creates an offscreen canvas with the given text rendered on it.
 * Returns the canvas element (caller converts to THREE.CanvasTexture).
 */
export function createTextTexture({ text, font, textColor, bold, curved, curveUp }) {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, size, size);

  const weight = bold ? "bold" : "normal";

  // 20% padding each side keeps content away from DecalGeometry edges
  const pad = size * 0.2;
  const inner = size - pad * 2; // usable content area

  // Auto-size font to fill inner area based on text length
  let fontSize;
  if (text.length <= 2) {
    fontSize = inner * 0.7; // big for 1-2 chars
  } else if (text.length <= 5) {
    fontSize = inner * 0.35;
  } else {
    fontSize = Math.max(40, Math.floor(inner / text.length * 1.8));
  }

  ctx.font = `${weight} ${fontSize}px "${font}", sans-serif`;

  // Shrink font if text is wider than inner area (single line)
  const measured = ctx.measureText(text);
  if (measured.width > inner && !curved) {
    fontSize = fontSize * (inner / measured.width) * 0.95;
    ctx.font = `${weight} ${fontSize}px "${font}", sans-serif`;
  }

  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (curved && text.length > 0) {
    // Draw each character along an arc — scaled to fit within inner area
    const r = inner * 0.32;
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
    // Straight text — wrap if too wide, constrained to inner area
    const maxWidth = inner;
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

    const lineH = fontSize * 1.25;
    const startY = size / 2 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, size / 2, startY + i * lineH, maxWidth);
    });
  }

  return canvas;
}
