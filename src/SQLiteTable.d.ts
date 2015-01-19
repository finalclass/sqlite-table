/// <reference path="../typings/tsd.d.ts" />
import sqlite3 = require('sqlite3');
declare class SQLiteTable {
    private _db;
    tableName: string;
    constructor(_db: sqlite3.Database);
    joins(record: any, done: (err: Error, record: any) => void): void;
    all(next: (err: Error, result?: any[]) => void): void;
    all(params: any, next?: (err: Error, result?: any[]) => void): void;
    count(where?: any, next?: (err?: Error, count?: number) => void): void;
    allLimited(where?: any, limit?: {
        limit: number;
        offset: number;
    }, next?: (err?: Error, result?: any[]) => void): void;
    private joinMany(records, next);
    find(params: string, next: (err: Error, result?: any) => void): void;
    find(params: any, next: (err: Error, result?: any) => void): void;
    insert(data: any, next: (err?: Error, id?: string) => void): void;
    update(data: any, next: (err?: Error) => void): void;
    remove(id: string, next: (err?: Error, isSuccess?: boolean) => void): void;
    private getObjVars(obj);
    private getSQLSelectStmt(params, limit?, select?);
    getTableName(): string;
    db: sqlite3.Database;
}
export = SQLiteTable;
