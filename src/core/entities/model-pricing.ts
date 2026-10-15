export interface ModelPricing {
  perImageUsd?: PerImagePriceTable;
  tokenRates?: TokenRateTable;
}

export interface PerImagePriceTable {
  [quality: string]: {
    [size: string]: string;
  };
}

export interface TokenRateTable {
  standard: {
    image?: { input: string; cachedInput: string; output: string };
    text?: { input: string; cachedInput: string; output?: string };
  };
  batch?: {
    image?: { input: string; cachedInput: string; output: string };
    text?: { input: string; cachedInput: string; output?: string };
  };
}
