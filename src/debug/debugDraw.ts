import type p5 from "p5";
import type { GameScene } from "../scenes/GameScene";

const OUTLINE_COLOR = "#7dff7a";
const IMPACT_COLOR = "#ff6b6b";
const STILL_ALPHA = 70;
const PANEL_X = 12;
const PANEL_Y = 470;
const PANEL_LINE = 16;

// Body outlines in level space; still bodies dimmed.
export function drawOutlines(p: p5, scene: GameScene): void {
  const { world } = scene;
  p.noFill();
  p.strokeWeight(1);
  for (const body of world.handles()) {
    const color = p.color(OUTLINE_COLOR);
    if (world.isBodyStill(body)) color.setAlpha(STILL_ALPHA);
    p.stroke(color);
    p.beginShape();
    for (const { x, y } of world.vertices(body)) p.vertex(x, y);
    p.endShape(p.CLOSE);
  }
}

// Each impact of the last tick, in raw units, where it happened.
export function drawImpacts(p: p5, scene: GameScene): void {
  p.noStroke();
  p.fill(IMPACT_COLOR);
  p.textSize(12);
  p.textAlign(p.CENTER, p.BOTTOM);
  for (const impact of scene.lastImpacts) {
    p.circle(impact.point.x, impact.point.y, 4);
    p.text(impact.strength.toFixed(0), impact.point.x, impact.point.y - 4);
  }
}

// The shot's state, bodies moving / total, the largest impact, roaches left, and the score.
export function drawPanel(p: p5, scene: GameScene, flags: string): void {
  const { world } = scene;
  const bodies = world.dynamicBodies();
  const moving = bodies.filter((body) => !world.isBodyStill(body)).length;
  const largest = Math.max(0, ...scene.lastImpacts.map((i) => i.strength));
  const lines = [
    `shot ${scene.shot.state}  bodies ${moving}/${bodies.length} moving`,
    `impact ${largest.toFixed(0)}  roaches ${scene.roaches.length}  score ${scene.score}`,
    flags,
  ];
  p.noStroke();
  p.fill(OUTLINE_COLOR);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  lines.forEach((line, i) => p.text(line, PANEL_X, PANEL_Y + i * PANEL_LINE));
}
