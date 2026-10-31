// The canvas keeps its logical size; only its CSS size follows the window, so the game never sees
// the scale. The backing store follows the displayed size too, or the upscale would blur.
export function fitCanvas(
  canvas: HTMLElement,
  width: number,
  height: number,
): number {
  const scale = Math.min(
    window.innerWidth / width,
    window.innerHeight / height,
  );

  canvas.style.width = `${width * scale}px`;
  canvas.style.height = `${height * scale}px`;
  return scale * window.devicePixelRatio;
}
