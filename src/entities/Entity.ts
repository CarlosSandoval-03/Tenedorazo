import type p5 from "p5";

export abstract class Entity {
  #isAlive = true;

  get isAlive(): boolean {
    return this.#isAlive;
  }

  // The owner's rules decide when; the scene removes it from the world after the step.
  destroy(): void {
    this.#isAlive = false;
  }

  update(): void {}

  abstract draw(p: p5): void;
}
