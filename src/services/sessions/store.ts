import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { ApiMode } from "../../core/entities/primitives.js";
import type { ImageSession, SessionIteration } from "../../core/entities/session.js";
import type { SessionStore } from "../../core/interfaces/services.js";

export class FileSessionStore implements SessionStore {
  constructor(private readonly baseDir: string) {}

  private filePath(id: string): string {
    return path.join(this.baseDir, `${id}.json`);
  }

  async create(options: {
    apiMode: ApiMode;
    imageModel: string;
    responsesModel?: string;
  }): Promise<ImageSession> {
    await fs.promises.mkdir(this.baseDir, { recursive: true });
    const now = new Date().toISOString();
    const session: ImageSession = {
      id: crypto.randomBytes(8).toString("hex"),
      createdAt: now,
      updatedAt: now,
      apiMode: options.apiMode,
      imageModel: options.imageModel,
      iterations: [],
      ...(options.responsesModel ? { responsesModel: options.responsesModel } : {}),
    };
    await fs.promises.writeFile(this.filePath(session.id), JSON.stringify(session, null, 2));
    return session;
  }

  async get(id: string): Promise<ImageSession | null> {
    const file = this.filePath(id);
    if (!fs.existsSync(file)) {
      return null;
    }
    return JSON.parse(await fs.promises.readFile(file, "utf8")) as ImageSession;
  }

  async addIteration(sessionId: string, iteration: SessionIteration): Promise<ImageSession> {
    const session = await this.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    session.iterations.push(iteration);
    session.updatedAt = new Date().toISOString();
    await fs.promises.writeFile(this.filePath(sessionId), JSON.stringify(session, null, 2));
    return session;
  }

  async list(): Promise<ImageSession[]> {
    if (!fs.existsSync(this.baseDir)) {
      return [];
    }
    const files = await fs.promises.readdir(this.baseDir);
    const sessions: ImageSession[] = [];
    for (const file of files) {
      if (file.endsWith(".json")) {
        sessions.push(JSON.parse(await fs.promises.readFile(path.join(this.baseDir, file), "utf8")) as ImageSession);
      }
    }
    return sessions;
  }

  async delete(id: string): Promise<void> {
    await fs.promises.unlink(this.filePath(id));
  }

  async exportSession(id: string, outputPath: string): Promise<void> {
    const session = await this.get(id);
    if (!session) {
      throw new Error("Session not found");
    }
    await fs.promises.writeFile(outputPath, JSON.stringify(session, null, 2));
  }
}
