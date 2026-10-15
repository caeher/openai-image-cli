import type { ImageJob } from "../../core/entities/job.js";
import type { JobManager } from "../../core/interfaces/services.js";

export class InMemoryJobManager implements JobManager {
  private readonly jobs = new Map<string, ImageJob>();

  async create(job: ImageJob): Promise<ImageJob> {
    this.jobs.set(job.id, job);
    return job;
  }

  async update(id: string, patch: Partial<ImageJob>): Promise<ImageJob> {
    const existing = this.jobs.get(id);
    if (!existing) {
      throw new Error("Job not found");
    }
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.jobs.set(id, updated);
    return updated;
  }

  async get(id: string): Promise<ImageJob | null> {
    return this.jobs.get(id) ?? null;
  }

  async list(projectId?: string): Promise<ImageJob[]> {
    return [...this.jobs.values()].filter((j) => !projectId || j.projectId === projectId);
  }
}
