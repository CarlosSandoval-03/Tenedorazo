import "./style.css";
import p5 from "p5";
import Matter from "matter-js";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GRAVITY,
  SUBSTEPS,
  TICK_MS,
} from "./config";
import { fitCanvas } from "./core/display";

// The checks cost time every frame, and minified names trip false warnings.
p5.disableFriendlyErrors = import.meta.env.PROD;

const frame = document.getElementById("game");
if (!frame) throw new Error("#game is missing from the DOM");

// A temporary sandbox: one box falling onto a floor, until the physics wrapper replaces it.
const engine = Matter.Engine.create({
  gravity: { x: 0, y: 1, scale: GRAVITY / 1e6 },
});
const floor = Matter.Bodies.rectangle(480, 508, 960, 64, { isStatic: true });
const box = Matter.Bodies.rectangle(480, 100, 64, 64, { angle: 0.3 });
Matter.Composite.add(engine.world, [floor, box]);

const sketch = (p: p5) => {
  p.setup = () => {
    const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT).elt;
    const fit = () =>
      p.pixelDensity(fitCanvas(canvas, CANVAS_WIDTH, CANVAS_HEIGHT));
    fit();
    window.addEventListener("resize", fit);
  };

  p.draw = () => {
    for (let i = 0; i < SUBSTEPS; i++)
      Matter.Engine.update(engine, TICK_MS / SUBSTEPS);

    p.background("#14232a");
    p.rectMode(p.CENTER);
    p.noStroke();
    p.fill("#4a5a5e");
    p.rect(floor.position.x, floor.position.y, 960, 64);
    p.push();
    p.translate(box.position.x, box.position.y);
    p.rotate(box.angle);
    p.fill("#d9a441");
    p.rect(0, 0, 64, 64);
    p.pop();
  };
};

new p5(sketch, frame);
