import { LogEntry } from '../interfaces/log-entry.interface';

export class LogParser {
  /**
   * Parse JSONL content to log entries
   */
  static parseJsonl(content: string): LogEntry[] {
    const lines = content.split('\n').filter((line) => line.trim());
    const entries: LogEntry[] = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        entries.push(entry);
      } catch (error) {
        // Skip invalid JSON lines
        console.warn('Failed to parse log line:', line.substring(0, 100));
      }
    }

    return entries;
  }

  /**
   * Group log entries by reqId
   */
  static groupByRequest(entries: LogEntry[]): Map<string, LogEntry[]> {
    const grouped = new Map<string, LogEntry[]>();

    for (const entry of entries) {
      if (entry.reqId) {
        if (!grouped.has(entry.reqId)) {
          grouped.set(entry.reqId, []);
        }
        grouped.get(entry.reqId)!.push(entry);
      }
    }

    return grouped;
  }
}
