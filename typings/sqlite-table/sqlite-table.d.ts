/// <reference path="../sqlite3/sqlite3.d.ts"/>

declare module "sqlite-table" {

  import sqlite3 = require('sqlite3');

  class SQLiteTable {
    private _db;
    tableName: string;
    constructor(_db: sqlite3.Database);
    joins(record: any, done: (err: Error, record: any) => void): void;
    all(next: (err: Error, result?: any[]) => void, eager?: boolean): void;
    all(params: any, next?: (err: Error, result?: any[]) => void, eager?: boolean): void;
    count(where?: any, next?: (err?: Error, count?: number) => void): void;
    allLimited(where?: any, limit?: {
      limit: number;
      offset: number;
    }, next?: (err?: Error, result?: any[]) => void, eager?: boolean): void;
    joinMany(records: any[], next: (err: Error, results?: any[]) => void): void;
    find(params: string, next: (err: Error, result?: any) => void, eager?: boolean): void;
    find(params: any, next: (err: Error, result?: any) => void, eager?: boolean): void;
    insert(data: any, next: (err?: Error, id?: string) => void): void;
    save(data: any, next: (err?: Error, record?: any) => void): void;
    update(data: any, next: (err?: Error) => void): void;
    remove(id: string, next: (err?: Error, isSuccess?: boolean) => void): void;
    private getObjVars(obj);
    private getSQLSelectStmt(params, limit?, select?);
    getTableName(): string;
    db: sqlite3.Database;
  }

  export = SQLiteTable;
}
