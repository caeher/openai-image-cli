import type { ProductDefaults } from "../../config/defaults.js";

export interface ImageProject {
  id: string;
  name: string;
  root: string;
  createdAt: string;
  defaults: Partial<ProductDefaults>;
}
