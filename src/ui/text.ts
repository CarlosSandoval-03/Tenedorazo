import type p5 from "p5";

// Wraps at word boundaries to fit maxWidth, measured with the current font and size, and draws
// the lines centered on y. Spanish runs longer than English, so nothing assumes a width.
export function drawWrapped(
  p: p5,
  text: string,
  center: { x: number; y: number },
  maxWidth: number,
): void {
  const lines: string[] = [];
  for (const word of text.split(" ")) {
    const last = lines.at(-1);
    if (last !== undefined && p.textWidth(`${last} ${word}`) <= maxWidth)
      lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  const lineHeight = p.textLeading();
  const top = center.y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => p.text(line, center.x, top + i * lineHeight));
}
