declare module "node:sqlite" {
  export class StatementSync {
    run(...args: unknown[]): { changes: number; lastInsertRowid: number | bigint };
    get(...args: unknown[]): unknown;
    all(...args: unknown[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }

  export function backup(sourceDb: DatabaseSync, path: string): number;
}
