declare module 'bun:sqlite' {
  export interface Statement {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): unknown;
  }

  export class Database {
    constructor(filename?: string, options?: unknown);
    exec(query: string): void;
    prepare(query: string): Statement;
    close(): void;
  }
}