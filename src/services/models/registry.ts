import type { ImageModelConfig } from "../../core/entities/model.js";
import { UsageError } from "../../core/errors/errors.js";
import { MODEL_DATA } from "./data.js";

export class ModelRegistry {
  private readonly byId = new Map(MODEL_DATA.map((m) => [m.id, m]));

  list(): ImageModelConfig[] {
    return [...MODEL_DATA];
  }

  get(id: string): ImageModelConfig | undefined {
    return this.byId.get(id);
  }

  resolve(id: string): ImageModelConfig {
    const model = this.get(id);
    if (!model) {
      throw new UsageError(`Unknown model: ${id}`);
    }
    return model;
  }
}
