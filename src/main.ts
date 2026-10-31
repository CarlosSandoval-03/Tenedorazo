import "./style.css";
import p5 from "p5";
import { loadAssets } from "./assets";
import { CANVAS_HEIGHT, CANVAS_WIDTH, KEYS } from "./config";
import { fitCanvas } from "./core/display";
import { Input } from "./core/Input";
import type { Vec } from "./core/math";
import { SceneManager } from "./core/SceneManager";
import { initLanguage } from "./i18n";
import { TitleScene } from "./scenes/TitleScene";
import { DEBUG_PROGRESS_KEY, PROGRESS_KEY, SavedProgress } from "./state";

// The checks cost time every frame, and minified names trip false warnings.
p5.disableFriendlyErrors = import.meta.env.PROD;

initLanguage(location.search);

const frame = document.getElementById("game");
if (!frame) throw new Error("#game is missing from the DOM");

const isDebug =
  import.meta.env.DEV &&
  new URLSearchParams(location.search).get("debug") === "true";

const sketch = (p: p5) => {
  let scenes: SceneManager | undefined;
  let debug: { update(): void; draw(p: p5): void } | undefined;

  p.setup = async () => {
    const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT).elt;
    const fit = () =>
      p.pixelDensity(fitCanvas(canvas, CANVAS_WIDTH, CANVAS_HEIGHT));
    fit();
    window.addEventListener("resize", fit);
    p.textFont((await loadAssets(p)).font);

    const input = new Input({
      canvas,
      window,
      toLogical: (client) => toLogical(canvas, client),
      bindings: KEYS,
    });
    scenes = new SceneManager(() => input.endFrame());
    const progress = new SavedProgress(
      isDebug ? DEBUG_PROGRESS_KEY : PROGRESS_KEY,
    );
    const context = { input, scenes, progress };
    scenes.change(new TitleScene(context));

    if (isDebug) {
      const { DebugTools } = await import("./debug");
      debug = new DebugTools(context, canvas);
    }
  };

  p.draw = () => {
    if (!scenes) return;
    debug?.update();
    scenes.frame(p.deltaTime);
    scenes.draw(p);
    debug?.draw(p);
  };
};

// The canvas is scaled by CSS only, so the pointer is rescaled back to logical px.
function toLogical(canvas: HTMLElement, client: Vec): Vec {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((client.x - rect.left) * CANVAS_WIDTH) / rect.width,
    y: ((client.y - rect.top) * CANVAS_HEIGHT) / rect.height,
  };
}

new p5(sketch, frame);
