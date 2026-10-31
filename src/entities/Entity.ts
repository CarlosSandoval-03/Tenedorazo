import type p5 from "p5";

export abstract class Entity {
  alive = true;

  update(): void {}

  abstract draw(p: p5): void;
}
