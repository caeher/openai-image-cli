import { buildGenerateBody } from "./images-adapter.js";

export interface BatchApiClient {
  files: {
    create: (body: { file: Buffer; purpose: string }) => Promise<{ id: string }>;
  };
  batches: {
    create: (body: Record<string, unknown>) => Promise<{ id: string }>;
    retrieve: (id: string) => Promise<Record<string, unknown>>;
    cancel: (id: string) => Promise<unknown>;
  };
}

export interface BatchLineItem {
  custom_id: string;
  method: "POST";
  url: string;
  body: Record<string, unknown>;
}

export function buildBatchJsonlLine(
  customId: string,
  endpoint: "/v1/images/generations" | "/v1/images/edits",
  body: Record<string, unknown>,
): string {
  const line: BatchLineItem = {
    custom_id: customId,
    method: "POST",
    url: endpoint,
    body,
  };
  return `${JSON.stringify(line)}\n`;
}

export function buildGenerationBatchBody(request: Parameters<typeof buildGenerateBody>[0]): Record<string, unknown> {
  const body = buildGenerateBody(request);
  delete body.stream;
  delete body.partial_images;
  return body;
}

export class OpenAiBatchAdapter {
  constructor(private readonly client: BatchApiClient) {}

  async uploadJsonl(content: string): Promise<string> {
    const file = await this.client.files.create({
      file: Buffer.from(content, "utf8"),
      purpose: "batch",
    });
    return file.id;
  }

  async createBatch(inputFileId: string, endpoint: string): Promise<string> {
    const batch = await this.client.batches.create({
      input_file_id: inputFileId,
      endpoint,
      completion_window: "24h",
    });
    return batch.id;
  }

  async retrieve(batchId: string): Promise<Record<string, unknown>> {
    return await this.client.batches.retrieve(batchId);
  }
}
