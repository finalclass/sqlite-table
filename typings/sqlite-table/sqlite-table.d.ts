/// <reference path="../sqlite3/sqlite3.d.ts"/>

declare module "sqlite-table" {

  import sqlite3 = require('sqlite3');

  class SQLiteTable {

    private _db:sqlite3.Database;
    public db:sqlite3.Database;

    constructor(db:sqlite3.Database);
    public all(next:(err:Error, result:any[])=>void):void;
    public all(params?:any, next?:(err:Error, result:any[])=>void):void;
    public find(params:string, next:(err:Error, result:any)=>void):void;
    public find(params:any, next:(err:Error, result:any)=>void):void;
    public insert(data:any, next:(err?:Error)=>void):void;
    public update(data:any, next:(err?:Error)=>void):void;
    private getObjVars(obj):any;
    private getSQLSelectStmt(params:any):{sql:string; objVars:any};
    public tableName:string;
  }

  export = SQLiteTable;
}