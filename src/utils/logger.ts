import pino from "pino";

export interface LoggerOptions {
  level?: string;
  destination?: pino.DestinationStream;
}

export function createLogger(options: LoggerOptions = {}) {
  const level = options.level ?? (process.env.LOG_LEVEL ?? "info");
  return pino(
    { level },
    options.destination ?? pino.destination({ dest: 2, sync: false }),
  );
}
