import type { Action } from "../config";
import type { Input } from "../core/Input";
import type { SceneManager } from "../core/SceneManager";
import type { SavedProgress } from "../state";

// What every scene reaches: the input, the manager that switches scenes, and the saved progress.
export interface GameContext {
  readonly input: Input<Action>;
  readonly scenes: SceneManager;
  readonly progress: SavedProgress;
}
