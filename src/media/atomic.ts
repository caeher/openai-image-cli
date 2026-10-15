import fs from "node:fs";
import path from "node:path";

export async function writeAtomic(filePath: string, bytes: Buffer): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(filePath)}.${process.pid}.tmp`);
  const handle = await fs.promises.open(tmp, "w");
  try {
    await handle.write(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.promises.rename(tmp, filePath);
}
