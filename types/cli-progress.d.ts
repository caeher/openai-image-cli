declare module "cli-progress" {
  export class SingleBar {
    constructor(options?: unknown);
    start(total: number, startValue: number): void;
    update(current: number): void;
    stop(): void;
  }
}
