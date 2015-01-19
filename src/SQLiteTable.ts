/// <reference path="../typings/tsd.d.ts"/>

import sqlite3 = require('sqlite3');
import debug = require('debug');

var log = debug('sqlite-table');
var logError = debug('sqlite-table:error');

class SQLiteTable {

  public tableName:string;

  constructor(private _db:sqlite3.Database) {

  }

  public joins(record:any, done:(err:Error, record:any)=>void):void {
    done(null, record);
  }

  public all(next:(err:Error, result?:any[])=>void):void;
  public all(params?:any, next?:(err:Error, result?:any[])=>void):void {
    if (typeof params === 'function') {
      next = params;
      params = {};
    }
    log('get all', params);
    var stmt:{sql:string;objVars:any} = this.getSQLSelectStmt(params);
    this.db.all(stmt.sql, stmt.objVars, (err:Error, records:any[]):void => {
      if (err) return next(err);
      this.joinMany(records, next);
    });
  }

  private joinMany(records:any[], next:(err:Error, results?:any[])=>void):void {
    var joined = [];

    records.forEach((r) => {
      this.joins(r, (err:Error, j):void => {
        if (err) {
          return next(err);
        }
        joined.push(j);
        if (joined.length === records.length) {
          next(null, joined);
        }
      });
    });
  }

  public find(params:string, next:(err:Error, result?:any)=>void):void;
  public find(params:any, next:(err:Error, result?:any)=>void):void {
    var typeofParams:string = typeof params;
    if (typeofParams === 'string' || typeofParams === 'number') {
      params = {id: params};
    }
    log('find', params);
    var stmt:{sql:string;objVars:any} = this.getSQLSelectStmt(params);
    this.db.get(stmt.sql, stmt.objVars, (err:Error, record:any):void => {
      if (err) return next(err);
      this.joins(record, next);
    });
  }

  public insert(data:any, next:(err?:Error, id?:string)=>void):void {
    log('insert', data);

    if (data.id) {
      delete data.id;
    }

    var keys:string[] = Object.keys(data);
    var keysVars:string[] = keys.map((key:string):string => '$' + key);
    var objVars:any = this.getObjVars(data);

    var sql:string = 'INSERT INTO ' + this.getTableName()
      + '(' + keys.join(',') + ') '
      + 'VALUES(' + keysVars.join(',') + ')';

    this.db.run(sql, objVars, function (err):void {
      data.id = this.lastID;
      next(err, data.id);
    });
  }

  public update(data:any, next:(err?:Error)=>void):void {
    log('update', data);
    if (!data.id) {
      logError('id is not specified, can not update');
      next(new Error('id is not specified'));
      return;
    }
    var keys:string[] = Object.keys(data);
    var updateStmts:string[] = keys.map((key:string):string => {
      return key + '=$' + key;
    });
    var objVars:any = this.getObjVars(data);

    var sql:string = 'UPDATE ' + this.getTableName()
      + ' SET ' + updateStmts.join(' , ')
      + ' WHERE id=$id';

    this.db.run(sql, objVars, next);
  }

  public remove(id:string, next:(err?:Error, isSuccess?:boolean)=>void):void {
    this.db.run('DELETE FROM ' + this.getTableName() + ' WHERE id=?', id, function (err) {
      next(err, this.changes === 1);
    });
  }

  private getObjVars(obj):any {
    var objVars:any = {};

    Object.keys(obj).forEach((key:string):void => {
      objVars['$' + key] = obj[key];
    });

    return objVars;
  }

  private getSQLSelectStmt(params:any):{sql:string; objVars:any} {
    var objVars:any = this.getObjVars(params);
    var whereStmts:string[] = Object.keys(params)
      .map((key:string):string => key + '=$' + key);
    var where:string = whereStmts.length > 0 ? ' WHERE ' + whereStmts.join(' AND ') : '';

    return {
      sql: 'SELECT * FROM ' + this.getTableName() + where,
      objVars: objVars
    };
  }

  public getTableName():string {
    if (!this.tableName) {
      throw new Error('tableName is not specified, override public get tableName():string method');
    }
    return this.tableName;
  }

  public get db():sqlite3.Database {
    return this._db;
  }

}

export = SQLiteTable;
