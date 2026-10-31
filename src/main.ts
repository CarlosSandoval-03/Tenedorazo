import "./style.css";
import p5 from "p5";
import { CANVAS_HEIGHT, CANVAS_WIDTH, KEYS } from "./config";
import { fitCanvas } from "./core/display";
import { Input } from "./core/Input";
import { SceneManager } from "./core/SceneManager";
import { GameScene } from "./scenes/GameScene";

// The checks cost time every frame, and minified names trip false warnings.
p5.disableFriendlyErrors = import.meta.env.PROD;

const frame = document.getElementById("game");
if (!frame) throw new Error("#game is missing from the DOM");

const sketch = (p: p5) => {
  let scenes: SceneManager | undefined;

  p.setup = () => {
    const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT).elt;
    const fit = () =>
      p.pixelDensity(fitCanvas(canvas, CANVAS_WIDTH, CANVAS_HEIGHT));
    fit();
    window.addEventListener("resize", fit);

    const input = new Input({
      canvas,
      window,
      toLogical: (client) => toLogical(canvas, client),
      bindings: KEYS,
    });
    scenes = new SceneManager(() => input.endFrame());
    scenes.change(new GameScene());
  };

  p.draw = () => {
    if (!scenes) return;
    scenes.frame(p.deltaTime);
    scenes.draw(p);
  };
};

// The canvas is scaled by CSS only, so the pointer is rescaled back to logical px.
function toLogical(canvas: HTMLElement, client: { x: number; y: number }) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((client.x - rect.left) * CANVAS_WIDTH) / rect.width,
    y: ((client.y - rect.top) * CANVAS_HEIGHT) / rect.height,
  };
}

new p5(sketch, frame);
