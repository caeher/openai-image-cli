export function helpExamples(...lines: string[]): string {
  const body = lines.map((line) => (line.startsWith("$") ? `  ${line}` : `  $ oaiimage ${line}`)).join("\n");
  return `\nExamples:\n${body}`;
}
