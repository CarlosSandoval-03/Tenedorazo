import type { Action } from "../config";
import type { Input } from "../core/Input";
import type { SceneManager } from "../core/SceneManager";

// What every scene reaches: the input and the manager that switches scenes.
export interface GameContext {
  readonly input: Input<Action>;
  readonly scenes: SceneManager;
}
