import fs from "node:fs";
import path from "node:path";
import type { CostReport } from "../../core/entities/cost.js";

export interface LedgerEntry {
  id: string;
  model: string;
  usd: string;
  timestamp: string;
  sessionId?: string;
  projectId?: string;
}

export class UsageLedger {
  constructor(private readonly filePath: string) {}

  private read(): LedgerEntry[] {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.filePath, "utf8")) as LedgerEntry[];
  }

  private write(entries: LedgerEntry[]): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(entries, null, 2));
  }

  add(entry: LedgerEntry): void {
    const entries = this.read();
    entries.push(entry);
    this.write(entries);
  }

  sumUsd(): number {
    return this.read().reduce((acc, e) => acc + Number.parseFloat(e.usd), 0);
  }

  summarize(): { totalUsd: string; count: number } {
    const entries = this.read();
    const total = entries.reduce((acc, e) => acc + Number.parseFloat(e.usd), 0);
    return { totalUsd: total.toFixed(6), count: entries.length };
  }

  recordFromReport(report: CostReport, meta: { id: string; model: string }): void {
    const amountLine = report.lines.find((l) => l.kind === "amount");
    if (!amountLine || amountLine.kind !== "amount") {
      return;
    }
    this.add({
      id: meta.id,
      model: meta.model,
      usd: amountLine.usd,
      timestamp: new Date().toISOString(),
    });
  }
}
