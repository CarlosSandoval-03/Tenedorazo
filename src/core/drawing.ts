import type p5 from "p5";
import type { Vec } from "./math";

// Draws in a body's frame: the origin at its center, the axes turned with it.
export function drawInPose(
  p: p5,
  position: Vec,
  angle: number,
  drawShape: () => void,
): void {
  p.push();
  p.translate(position.x, position.y);
  p.rotate(angle);
  drawShape();
  p.pop();
}
